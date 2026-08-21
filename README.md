# ProofScout

**Trust before you apply.**

Private, on-device screening for jobs, grants, scholarships and competitions — plus a Firefox companion that sits on the page you are already viewing.

| | |
| --- | --- |
| Live app | https://favour187.github.io/ProofScout/ |
| Hostile demo page | https://favour187.github.io/ProofScout/demo-target.html |
| Firefox (desktop) | https://addons.mozilla.org/firefox/addon/proofscout-page-assistant/ |
| Firefox Android | https://addons.mozilla.org/android/addon/proofscout-page-assistant/ |
| Privacy | https://favour187.github.io/ProofScout/privacy.html |

Current companion: **ProofScout Page Assistant v3.0.0** (public on Mozilla Add-ons).

## The problem

Fake offers ask people to pay a “processing fee”, send an OTP, or upload an ID before they can verify the organizer. A mysterious scam score is not enough. People need evidence they can read, on a phone, without creating an account.

## What you can do in two minutes

1. Open the [live app](https://favour187.github.io/ProofScout/) and paste a message, or tap **Suspicious offer**.
2. In **Firefox**, tap **Add Scout to Firefox**, allow website access, then open the [demo page](https://favour187.github.io/ProofScout/demo-target.html).
3. Tap the lime **P** on the edge. Use **Security** first. Scout should warn you **not to type** passwords, cards or codes.

Chrome on Android cannot put Scout on other websites. Firefox can.

## Product

**Inspect (website / PWA)**  
Explainable risk score, claim extraction, evidence completeness, verification-message generator, local case locker, side-by-side compare, redacted second-opinion files, Hausa safety guide, share-target, offline HTML edition.

**Scout (Firefox v3)**  
A draggable edge circle. Four tabs, all offline:

- **Security** — XSS indicators, SQL error text, CSRF gaps, leaked secrets, mixed content, copy-jack, punycode, short links, miners, hidden password fields, brand/link mismatch, card fields  
- **URL** — encryption, open-redirect params, traversal-shaped values, `javascript:` / `data:` addresses, markup in the query  
- **Offer** — payment pressure, OTP/seed-phrase language, fake urgency  
- **Quality** — broken images, labels, headings, `rel=noopener`

If the page looks dangerous, Scout marks sensitive fields, shows **Do not enter sensitive information**, and can block a password/file submit. It never sends attack payloads and never uploads the page.

## Stack

HTML, CSS, vanilla JavaScript. No backend, analytics, ads, accounts or remote AI. MIT licensed.

## Repo

- Site: `index.html`, `app.js`, `styles.css`, `scout.js`, `scout.css`, `sw.js`
- Offline single file: `proofscout-offline.html`
- Firefox add-on source: `extension-firefox/` (listed as v3.0.0 on AMO)
- Chrome unpacked demo: `extension/`
- Hackathon write-up: `SUBMISSION.md`

The signed `.xpi` lives on Mozilla Add-ons, not in this repo.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Built for

[Build Beyond Hackathon 2026](https://build-beyond-hackathon.devpost.com/). Submission copy: [`SUBMISSION.md`](SUBMISSION.md).
