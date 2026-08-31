# Development & Extensibility Guide

## Monorepo Architecture

```text
smart-forensic-system/
├── apps/
│   ├── web/                    # Next.js 14 Web Forensic Dashboard (Port 3000)
│   ├── api/                    # Express + Node.js Local Forensic Agent Service (Port 3001)
│   └── android-agent/          # Kotlin Jetpack Compose Android Companion App
├── packages/
│   ├── shared/                 # Common interfaces, types, rules, and risk models
│   └── security-engine/        # Transparent heuristic scoring, signatures, and rule sets
├── scripts/                    # Windows PowerShell orchestration scripts
└── docs/                       # Technical reference documentation
```

---

## Adding Custom Forensic Plugins

Implement the `ForensicPlugin` interface in `apps/api/src/plugins/`:

```typescript
import { ForensicPlugin, PluginContext, PluginCollectionResult, PluginAnalysisResult } from './ForensicPlugin';

export class CustomAnalyzerPlugin implements ForensicPlugin {
  readonly name = 'CustomAnalyzerPlugin';
  readonly version = '1.0.0';
  readonly description = 'Inspects specialized artifact caches';
  readonly requiredPermissions = ['ADB Shell'];
  readonly supportedAndroidVersions = 'Android 10 - 15';

  async collect(ctx: PluginContext): Promise<PluginCollectionResult> {
    ctx.emitProgress(50, 'Inspecting custom artifacts...');
    // Execute safe commands via ctx.adbManager
    return {
      success: true,
      data: { /* ... */ },
      permissionGranted: true
    };
  }

  async analyze(ctx: PluginContext, result: PluginCollectionResult): Promise<PluginAnalysisResult> {
    return {
      riskScore: 0,
      riskLevel: 'SAFE',
      findings: [],
      summary: {}
    };
  }
}
```

Register your plugin in `PluginManager.ts`:
```typescript
this.registerPlugin(new CustomAnalyzerPlugin());
```
