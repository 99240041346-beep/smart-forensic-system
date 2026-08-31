import { ForensicPlugin, PluginCollectionResult, PluginContext } from './ForensicPlugin';
import { DeviceInfo } from '@smart-forensic/shared';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';

export class DeviceInfoPlugin implements ForensicPlugin {
  readonly name = 'DeviceInfoPlugin';
  readonly version = '1.0.0';
  readonly description = 'Collects hardware specifications, OS build info, battery, memory, storage, and security state';
  readonly requiredPermissions = ['android.permission.READ_PHONE_STATE (optional for telephony)'];
  readonly supportedAndroidVersions = 'Android 7.0 - 15+ (API 24 - 35)';

  async collect(ctx: PluginContext): Promise<PluginCollectionResult<DeviceInfo>> {
    ctx.emitProgress(10, 'Collecting hardware, OS build, and integrity indicators...');

    if (ctx.isDemo) {
      const demoInfo = DemoDataGenerator.getDemoDeviceInfo(ctx.deviceSerial);
      return {
        success: true,
        data: demoInfo,
        permissionGranted: true,
        message: 'Demo device information generated'
      };
    }

    try {
      const info = await ctx.adbManager.getDeviceInfo(ctx.deviceSerial);
      return {
        success: true,
        data: info,
        permissionGranted: true,
        message: 'Device information successfully collected via ADB properties'
      };
    } catch (err: any) {
      return {
        success: false,
        data: null as any,
        error: err.message || 'Failed to collect device information'
      };
    }
  }
}
