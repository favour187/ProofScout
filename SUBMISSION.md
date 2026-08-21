# Devpost copy — Build Beyond Hackathon 2026

Paste this into https://build-beyond-hackathon.devpost.com/

**Project name:** ProofScout  
**Tagline:** Trust the evidence. Not the pressure.  
**Built with:** HTML, CSS, JavaScript, Firefox WebExtensions, Progressive Web App  

**Links**

- Website: https://favour187.github.io/ProofScout/
- Demo (hostile page): https://favour187.github.io/ProofScout/demo-target.html
- GitHub: https://github.com/favour187/ProofScout
- Firefox add-on v3.0.0: https://addons.mozilla.org/firefox/addon/proofscout-page-assistant/

## The idea

People get job, grant and prize messages that rush them to pay or send OTP codes. ProofScout is a private screening aid that runs on the phone. It explains *why* a message looks risky, and a Firefox companion inspects the live page — wording, URL, XSS/SQL indicators and leaked secrets — without uploading anything.

## How it works

Stay in Firefox. Add ProofScout Page Assistant (allow website access). A lime **P** docks to the screen edge on ordinary sites. Tap it for Security, URL, Offer and Quality. If Scout finds a serious fingerprint it tells you not to type secrets and can stop a dangerous form.

The website also accepts pasted announcements, saves cases locally, compares two offers, and exports a redacted file for a teacher or parent.

## Features

- Explainable opportunity score (not a black box)
- Offline XSS / SQL-error / CSRF / secret / transport audit
- “Do not enter sensitive information” banners and field marks
- Form blocking on high-risk password/file submits
- Live re-scan when the page changes
- Second-opinion workflow with automatic redaction
- English + Hausa safety guide
- Zero servers

## Intended audience

Students and first-time applicants, especially on mobile, including people who cannot or should not create an account.

## How judges should test

1. Open the live site → Inspect → **Suspicious offer**.
2. Firefox → add-on → [demo-target.html](https://favour187.github.io/ProofScout/demo-target.html) → tap **P** → Security.
3. Try focusing the password/card fields. Scout should tell you to stop.

## Judging notes

| Criterion | Where it shows |
| --- | --- |
| Technical execution | Vanilla JS, signed Firefox Android add-on v3, PWA, no backend |
| Originality | Evidence-first screening + on-page protector, not another scam-score API |
| Impact | Stops people giving away money and OTPs before they can verify |
| UX | One circle, spoken summary, Hausa guide, high contrast |
| Clarity | This file, README, privacy policy, public AMO listing |

## Limitations (say this in the video)

Scout is a screening aid. A clean result is not a pentest pass and not proof an offer is real.
