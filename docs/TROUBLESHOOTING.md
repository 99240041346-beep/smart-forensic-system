# Troubleshooting Guide

## 1. ADB Missing or Not Recognized

**Symptom**: "ADB executable not found at adb" or "ADB NOT DETECTED".

**Solution**:
1. Verify Android Platform Tools is installed.
2. Run `powershell .\scripts\check-adb.ps1` to test detection.
3. If ADB is not in system PATH, set explicit absolute path in `.env`:
   ```ini
   ADB_PATH="C:\\Users\\VARDHAN\\Downloads\\platform-tools-latest-windows\\platform-tools\\adb.exe"
   ```

---

## 2. Device Shows "UNAUTHORIZED"

**Symptom**: Device appears in list with Amber "UNAUTHORIZED" badge.

**Solution**:
1. Unlock the Android phone's lock screen.
2. Check for the popup prompt: *"Allow USB debugging from this computer?"*.
3. Check the checkbox *"Always allow from this computer"* and tap **Allow**.
4. Click **REFRESH ADB** in the dashboard.

---

## 3. Contacts / SMS Showing "Unavailable"

**Symptom**: "Contacts permission was not granted" or "SMS collection unavailable".

**Solution**:
- This is by design: The system adheres to defensive, authorized forensic standards.
- Install and launch the companion Android app (`apps/android-agent/`).
- Tap **Grant Required Permissions** on the phone screen.
- Or switch to **Demo Mode** in Settings to test using realistic synthetic profiles.
