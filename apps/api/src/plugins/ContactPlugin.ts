import { ForensicPlugin, PluginCollectionResult, PluginContext } from './ForensicPlugin';
import { ContactInfo } from '@smart-forensic/shared';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';

export class ContactPlugin implements ForensicPlugin {
  readonly name = 'ContactPlugin';
  readonly version = '1.0.0';
  readonly description = 'Collects authorized contact records via Android Companion Agent or content queries with consent';
  readonly requiredPermissions = ['android.permission.READ_CONTACTS'];
  readonly supportedAndroidVersions = 'Android 7.0 - 15+ (API 24 - 35)';

  async collect(ctx: PluginContext): Promise<PluginCollectionResult<ContactInfo[]>> {
    ctx.emitProgress(55, 'Checking Android companion Contacts authorization...');

    if (ctx.isDemo) {
      const demoContacts = DemoDataGenerator.getDemoContacts();
      return {
        success: true,
        data: demoContacts,
        permissionGranted: true,
        message: `Collected ${demoContacts.length} authorized contacts (Demo Mode)`
      };
    }

    try {
      // Check if ADB companion bridge port is active
      const response = await fetch('http://127.0.0.1:47822/api/companion/contacts', {
        headers: { 'X-Agent-Token': process.env.LOCAL_AGENT_TOKEN || 'forensic-agent-token-local-auth' },
        signal: AbortSignal.timeout(3000)
      }).catch(() => null);

      if (response && response.ok) {
        const payload: any = await response.json();
        return {
          success: true,
          data: payload.contacts || [],
          permissionGranted: true,
          message: `Collected ${payload.contacts?.length || 0} authorized contacts via Companion App`
        };
      }

      // If companion app is not active or permission was denied
      return {
        success: true,
        data: [],
        permissionGranted: false,
        message: 'Contacts permission was not granted or Companion App is offline. Collection gracefully skipped.'
      };
    } catch {
      return {
        success: true,
        data: [],
        permissionGranted: false,
        message: 'Contacts permission was not granted on device. No contact data collected.'
      };
    }
  }
}
