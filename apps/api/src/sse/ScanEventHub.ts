import { Response } from 'express';
import { ScanProgressEvent } from '@smart-forensic/shared';

export class ScanEventHub {
  private static clients: Map<string, Set<Response>> = new Map();

  public static addClient(scanId: string, res: Response) {
    if (!this.clients.has(scanId)) {
      this.clients.set(scanId, new Set());
    }
    this.clients.get(scanId)!.add(res);

    // Initial ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', scanId, timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      const set = this.clients.get(scanId);
      if (set) {
        set.delete(res);
        if (set.size === 0) {
          this.clients.delete(scanId);
        }
      }
    });
  }

  public static emitEvent(scanId: string, event: Partial<ScanProgressEvent>) {
    const clients = this.clients.get(scanId);
    if (!clients || clients.size === 0) return;

    const payload = JSON.stringify({
      scanId,
      timestamp: new Date().toISOString(),
      ...event
    });

    for (const client of clients) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (err) {
        // client closed
      }
    }
  }
}
