# Android Companion Application Setup

The companion application (`apps/android-agent/`) provides authorized, non-invasive access to Android Contacts and SMS messages when permitted by the device owner.

## 1. Principles of Authorized Collection

- **Zero Root / Zero Exploits**: Operates entirely within standard Android userland SDK capabilities.
- **Explicit Runtime Consent**: The user must explicitly approve `READ_CONTACTS` and `READ_SMS` prompts.
- **Emergency Stop Button**: The device owner can instantly revoke access at any time with the large red "Emergency Stop Collection" button.
- **Local Loopback Only**: The embedded Ktor HTTP server binds to `127.0.0.1:47822` and only communicates through authenticated ADB port-forwarding (`adb forward tcp:47822 tcp:47822`).

---

## 2. Building and Installing

Using Android Studio:
1. Open the project folder at `apps/android-agent`.
2. Build and run on your connected device.

Using Gradle CLI:
```bash
cd apps/android-agent
./gradlew installDebug
```

---

## 3. Starting Authorized Session

1. Open **Smart Forensic Agent** on the phone.
2. Tap **Grant Required Permissions** when prompted.
3. Verify the status banner turns Green (`AGENT ACTIVE & READY`).
4. The dashboard on your PC will automatically retrieve authorized data when scanning.
