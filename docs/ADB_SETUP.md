# Android Debug Bridge (ADB) Setup & Workflow

## 1. Enabling USB Debugging on the Android Device

1. Open **Settings** on the Android device.
2. Navigate to **About Phone**.
3. Tap **Build Number** 7 times until you see *"You are now a developer!"*.
4. Go back to **System > Developer Options** (or Settings > Developer Options).
5. Toggle **USB Debugging** to `ON`.
6. Connect the Android phone to your PC via a high-quality USB-C / USB-A cable.

---

## 2. Authorizing Computer Host Key

When plugged in, an Android dialog prompt will appear:

> **"Allow USB debugging?"**  
> *The computer's RSA key fingerprint is: ...*  
> [x] *Always allow from this computer*  
> [ **Allow** ]

Tap **Allow**.

---

## 3. Verifying from PowerShell

Run:

```powershell
adb devices -l
```

Expected output:
```text
List of devices attached
9888...       device product:husky model:Pixel_8_Pro device:husky
```

If the state shows `unauthorized`, unlock the phone screen and accept the prompt.

Click the **REFRESH ADB** button in the Web Forensic Dashboard to immediately discover and inspect the attached device.
