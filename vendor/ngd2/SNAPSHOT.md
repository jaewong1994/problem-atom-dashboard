# NGD2 display snapshot

This directory contains a read-only snapshot of NGD2's shared display engine.
The independent seminar dashboard does not write to or depend on a running NGD2 instance.

- `ngd2-math.js`: NGD2 `수식공통.js`, SHA-256 `833C96BCC7F36811E869CAF7D314DD7256A726D97F4F3DAB6E1CA386782FFBAE`
- `ngd2-display.js`: NGD2 `표시공통.js`, SHA-256 `4748E80F4B2A51CC507DC0CA32A6F50C624D7C1E8569D0CAD049ADB834F4A0A8`
- Snapshot date: 2026-08-25

Refresh the snapshot locally after NGD2 display rules change:

```powershell
$env:NGD2_ROOT = "<NGD2 root>"
.\sync_ngd2_display.ps1
```
