# Problem rendering engine snapshot

This directory contains a read-only snapshot of the shared math and problem rendering engine.
The seminar dashboard uses the snapshot without writing to the source system.

- `problem-math.js`: shared math normalization rules
- `problem-display.js`: shared problem display rules
- Snapshot date: 2026-08-25

Refresh the snapshot locally after the display rules change:

```powershell
$env:PROBLEM_BANK_ROOT = "<source root>"
.\sync_problem_display.ps1
```
