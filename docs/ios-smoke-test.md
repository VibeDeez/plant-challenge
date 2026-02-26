# iOS Simulator Smoke Test (Mobile-First PWA)

Use this before major UI releases or after significant mobile/auth changes.

## Goal
Catch iOS-specific issues that Playwright may miss (Safari behavior, PWA install UX, viewport/touch feel, keyboard interactions).

## Prereqs
- Xcode + iOS Simulator installed
- Project dependencies installed
- `.env.local` configured
- E2E test user configured (`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`)

## 1) Boot Simulator + Safari
```bash
# List devices
xcrun simctl list devices

# Boot a common iPhone profile (adjust if needed)
xcrun simctl boot "iPhone 15"

# Open Simulator app
open -a Simulator

# Open Safari in simulator
xcrun simctl launch booted com.apple.mobilesafari
```

## 2) Start app locally
```bash
cd ~/desktop/placeholder
E2E_TEST=true npm run dev
```

## 3) Open app in Simulator Safari
Use: `http://localhost:3000`

If localhost fails, use your Mac LAN IP (from `ipconfig getifaddr en0`):
`http://<your-lan-ip>:3000`

## 4) Auth bootstrap
In simulator Safari, open:
`http://localhost:3000/api/e2e/login`

Expected: redirect to `/` in authenticated state.

---

## Smoke Checklist (10–15 min)

### A. Global shell + navigation
- [ ] Bottom nav visible and tappable
- [ ] Active tab state is clear
- [ ] No overlapping with iOS safe area/home indicator
- [ ] No clipped text at ~375px width

### B. Home (`/`)
- [ ] Progress + “Log a Plant” CTA readable
- [ ] Category cards are readable and not cramped
- [ ] Key labels/names do not truncate unexpectedly
- [ ] Tap targets feel easy (>=44px)

### C. Add (`/add`)
- [ ] Search input focus/typing works with iOS keyboard
- [ ] Category tabs are tappable and stable while scrolling
- [ ] Plant row labels readable
- [ ] Photo modal open/close controls are easy to tap

### D. Circles (`/circles`, `/join/[code]`, `/circles/create`)
- [ ] Join flow handles bad code cleanly (no broken navigation)
- [ ] Create flow error handling is user-friendly
- [ ] No route jumps to invalid URLs (e.g., `/circles/undefined`)

### E. Profile (`/profile`)
- [ ] Edit actions and avatar picker are tappable
- [ ] Long names remain readable

### F. API guardrails sanity
- [ ] Recognize endpoint rejects invalid payload safely (no crash UX)

---

## PWA-Specific Quick Checks (Safari)
- [ ] Share → “Add to Home Screen” flow appears
- [ ] Launched-from-home-screen layout still respects safe area
- [ ] No major visual regressions in standalone mode

## Optional: capture evidence
- Simulator screenshot: `⌘S`
- Save screenshots in: `test-results/ios-smoke/<date>/`

## Recommended cadence
- After any mobile UI batch
- After auth/session changes
- Before shipping major feature work

## Notes
- Playwright remains primary for regression speed.
- Simulator smoke testing is the iOS reality check.
