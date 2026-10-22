# Core Asana Partners: mobile app

The partner-facing app of the Core Asana affiliate program. Yoga teachers, physiotherapists, studios and wellness creators sign up, pick a code their students can remember, share it, and follow every order from *on hold* to *paid* in their UPI or bank account.

**Download the APK:** [latest release](https://github.com/TarunVermaaa/coreasana-partners-app/releases/latest). It talks to the live API at https://coreasana-partners-api.onrender.com.

This is one of three repos:

| Repo | What it is |
| --- | --- |
| **coreasana-partners-app** (this one) | React Native (Expo) app for partners. Ships as an Android APK. |
| [coreasana-partners-api](https://github.com/TarunVermaaa/coreasana-partners-api) | Node.js + Express + MongoDB API. Owns all data and rules. |
| [coreasana-partners-dashboard](https://github.com/TarunVermaaa/coreasana-partners-dashboard) | Web dashboard for the affiliate team (review and release commissions) and finance (payout runs). |

The five-minute happy path across the app and the dashboard: [docs/WALKTHROUGH.md](https://github.com/TarunVermaaa/coreasana-partners-api/blob/main/docs/WALKTHROUGH.md).

## What's in v1

| Screen | Why it's there |
| --- | --- |
| **Welcome** | Growth starts here. It shows the deal before asking for anything: the partner card, an earnings calculator (students per month → monthly earnings, from live program terms) and the three steps from signup to payout. |
| **Sign up** | About a minute, in 2 steps. Step 1 is name, email, mobile, password and "how you'll share". Step 2 is picking the code, with a live availability check and suggestions. The code works immediately; payout details are asked for later, when there's money to send. |
| **Log in** | Email and password. |
| **Home** | The partner card with Copy and Share. It also shows what's ready for Friday's payout (net of TDS, the same figure as Payouts), what's on hold and why, lifetime paid, a plain-language 30-day summary and recent orders. It nudges the partner when payout details or PAN are missing. |
| **Earnings** | Every commission grouped by month, filterable by status. Tapping an order opens its timeline: order placed → return window ends (date) → ready → in payout (batch number) → paid (UTR). Refunds show as reversed, and refunds after payout show as a clawback. |
| **Payouts** | Where money goes (UPI or bank, PAN status and TDS rate) and the next payout with its date and estimated net. The latest payout is shown as a receipt (commission, TDS, sent, UTR) with a "Paid" stamp, and older payouts follow in a ledger. |
| **Payout details** | Add or change UPI or bank details and PAN, with format checks (UPI, IFSC, PAN, matching account numbers). |
| **Profile** | Account details, log out, app version and the API address in use. |


## Run it

Requirements: Node 20+, and the API running (see partners-api; default `http://localhost:4100`).

```bash
npm install
cp .env.example .env          # set EXPO_PUBLIC_API_URL if the API isn't on localhost:4100
npx expo start --web          # quickest look: opens in the browser at a phone layout
npx expo run:android          # or a development build on an Android device or emulator
```

Demo partner logins (seeded by the API), all with password `Demo@1234`:
- `priya@partners.demo`: full history, UPI + PAN on file, last payout paid.
- `kabir@partners.demo`: no payout details yet, so the app shows what blocks his payout.
- `leela@partners.demo`: new partner, orders still on hold, no PAN.

Or create a new account from the Welcome screen.

> Expo Go isn't supported for the Android build: the app uses native modules (SecureStore, Reanimated 4) that need a development or release build. The web preview runs everything except haptics and the native share sheet.

## Install the APK

`core-asana-partners.apk` is attached to the GitHub release, or shared alongside the submission.
1. Open it on an Android phone (Android 7+, arm64) and allow "Install unknown apps" for your browser or file manager.
2. Launch **Core Asana Partners** and log in with a demo account.

The release APK is built against the deployed API. To point it at another server, such as your laptop on the same Wi-Fi, **long-press the "Core Asana Partners" wordmark on the Welcome screen** and enter `http://<your-LAN-IP>:4100`. The app tests the address (`/api/v1/health`) before saving it.

## Configuration

| Variable | Default | Used for |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:4100` | API base URL, baked in at build time. It can be overridden in the app as described above. |
| `EXPO_PUBLIC_USE_FIXTURES` | `0` | `1` serves typed sample data from `src/api/fixtures.ts` instead of calling the API (UI work without a backend). |

## How it talks to the API

- REST over HTTPS/JSON at `${EXPO_PUBLIC_API_URL}/api/v1`. All money is integer paise and is formatted on the device (`₹1,840`, with paise set smaller when present).
- Auth: `POST /auth/affiliate/signup` and `/login` return a JWT. It's stored in the Android Keystore through `expo-secure-store` (localStorage on web) and sent as `Authorization: Bearer`. A 401 signs the partner out.
- Partner data:
  - `GET /me`, `/me/summary`, `/me/commissions?status=&cursor=` (paged) and `/me/payouts`
  - `PUT /me/payout-method`
- Public data: `GET /program` (terms for Welcome) and `GET /codes/:code/availability`.
- The share link is `${API}/r/CODE`: the API logs the click and redirects to the store with the code.
- `@tanstack/react-query` caches responses, refreshes on pull-to-refresh and avoids refetch storms. The client gives every request a 15-second timeout and shows clear "can't reach the server" errors.

**Startup order:** MongoDB → partners-api → this app.

## Build the APK yourself

Needs JDK 17 and the Android SDK (`ANDROID_HOME`). No EAS account is required.

```bash
EXPO_PUBLIC_API_URL=https://<deployed-api> npm run build:apk
# → build/core-asana-partners.apk
```

`scripts/build-apk.sh` runs `expo prebuild` (the `android/` folder is generated from `app.json` and not committed), then `./gradlew assembleRelease` for `arm64-v8a`. The release is signed with the React Native template's debug keystore. That's fine for sideloading a review build, but it needs a real upload key and an AAB before it goes to the Play Store.

Cleartext HTTP is allowed (`expo-build-properties`) so that reviewers can point the APK at a laptop on the LAN. A production build should turn this off and use HTTPS only. Permissions the app doesn't use (overlay, storage, biometrics) are blocked in `app.json`, which leaves only INTERNET and VIBRATE (for haptics).

## Design notes

The look comes from Core Asana itself: its colourways (Midnight Blue, Lavender, Amber, Vermilion) and the AcuTech acupressure mat.
- **The partner card** is the one expressive element. It's a lavender card textured with the mat's six-petal "lotus" spike clusters, with the code set large in Young Serif (lining figures, so `10` never reads as `IO`). On first load it rises and the nodes bloom outward from the code, like pressure spreading across the mat.
- **Everything else is quiet.** Earnings and Payouts are ledgers (one panel, hairline rows) rather than stacks of cards. Amounts use Young Serif with paise set smaller, and identifiers (UTR) use Red Hat Mono.
- **Motion answers actions:**
  - balances count up once
  - buttons spring on press
  - copying the code flashes it, with a haptic and a toast
  - a tapped order's timeline unfolds with a layout animation
  - the tab indicator slides
  - a rubber "Paid" stamp lands once on a newly paid payout

  Reduced-motion settings are respected throughout.
- **Copy is plain and specific:** real dates ("Return window ends 5 Nov"), real amounts, and the reason behind every state.

## Project layout

```
src/app/            screens (Expo Router): welcome, signup, login, (tabs)/home|earnings|payouts, payout-method, profile
src/components/     PartnerCard, Lotus, CommissionCard (row + timeline), PaidStamp, Slider, TabBar, Toast, …
src/api/            typed contract (types.ts), fetch client, react-query hooks, optional fixtures
src/auth/           session context (SecureStore)
src/theme/tokens.ts colours, type scale, radii
scripts/            build-apk.sh, make-icons.mjs (renders icon/splash from the lotus SVG)
```

## What's next

- **Push notifications** for "new order with your code" and "payout sent" (Expo Notifications + an API hook). These would do more for retention than any screen.
- **Share kit:** a ready-made Instagram story and WhatsApp image of the partner card, and a QR code for studio walls.
- **Invite a fellow teacher:** partner-to-partner referral bonuses. This is the cheapest way to grow signups.
- **KYC and bank checks in the app:** a penny-drop verification result and name match shown before the first payout.
- **Offline cache** of the last summary, so the app opens instantly on a bad connection.
- **iOS build and Play Store release** (signed AAB through EAS).
