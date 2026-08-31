# Security & Ethical Compliance Policy

The **Smart Android Forensic & Security Analysis System** is engineered exclusively for authorized security audits, defensive endpoint triage, incident response investigations, and mobile app QA.

## Strict Compliance Requirements

1. **Authorized Devices Only**: Forensic acquisition is only permitted on corporate/managed devices or personal devices with explicit, informed owner consent.
2. **No Screen-Lock Bypasses**: The application does not contain code to exploit lock-screens, bypass encryption keys, or defeat biometric controls.
3. **No Root Exploitation**: Uses official Android userland ADB APIs (`pm`, `dumpsys`, `getprop`, `ps`) and does not deploy rooting exploits.
4. **Transparent Risk Heuristics**: Application risk scoring is based on explainable static factors (permissions, sideload status, debug builds, security tool categories) and explicitly discloses that static heuristics are indicators rather than proof of malicious software.
5. **Data Minimization & Sanitization**:
   - Audit logs strictly redact passwords, tokens, and personal message bodies.
   - Sensitive device serial numbers are masked on display.
   - Evidence datasets adhere to configurable expiration and retention schedules (7, 30, 90 days, or manual deletion).
