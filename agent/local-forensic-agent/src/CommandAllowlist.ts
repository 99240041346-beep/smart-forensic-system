export class CommandAllowlist {
  private static readonly ALLOWED_COMMANDS: Set<string> = new Set([
    'version',
    'devices',
    'getprop',
    'dumpsys',
    'pm',
    'ps',
    'top',
    'cat',
    'df',
    'wm',
    'settings',
    'forward'
  ]);

  private static readonly ALLOWED_SUBCOMMANDS: Record<string, Set<string>> = {
    dumpsys: new Set(['battery', 'meminfo', 'package', 'wifi', 'telephony.registry']),
    pm: new Set(['list', 'get-install-source', 'dump']),
    settings: new Set(['get']),
    cat: new Set(['/proc/meminfo', '/proc/version', '/proc/cpuinfo']),
    wm: new Set(['size', 'density']),
    df: new Set(['-k', '-h', '/data', '/system'])
  };

  /**
   * Validates if the process arguments array is strictly within the authorized forensic allowlist.
   */
  public static isAuthorized(args: string[]): boolean {
    if (!args || args.length === 0) return false;

    // Filter out target device flags (-s <serial>)
    const cleanArgs: string[] = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-s') {
        i++; // skip serial
        continue;
      }
      if (args[i] === 'shell') continue;
      cleanArgs.push(args[i]);
    }

    if (cleanArgs.length === 0) return true;

    const baseCmd = cleanArgs[0];
    if (!this.ALLOWED_COMMANDS.has(baseCmd)) {
      return false;
    }

    const subAllowed = this.ALLOWED_SUBCOMMANDS[baseCmd];
    if (subAllowed && cleanArgs.length > 1) {
      const subCmd = cleanArgs[1];
      if (!subAllowed.has(subCmd)) {
        return false;
      }
    }

    return true;
  }
}
