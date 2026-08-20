# Build Beyond Hackathon 2026 — ProofScout

**Deadline:** 22 August 2026, 2:45 AM EDT (07:45 WAT)

Live app: https://favour187.github.io/ProofScout/  
Firefox add-on: https://addons.mozilla.org/android/addon/proofscout-page-assistant/  
Source: https://github.com/favour187/ProofScout  
Demo of a hostile page: https://favour187.github.io/ProofScout/demo-target.html

## The idea

People in Nigeria and elsewhere receive job, grant, scholarship and prize messages that pressure them to pay, send OTP codes or upload IDs. ProofScout lets someone inspect the wording **and** the live page on their own phone, without uploading anything.

## How it works

1. Open the site in **Firefox**.
2. Tap **Add Scout to Firefox** and allow website access.
3. Open any ordinary website. A lime **P** circle docks to the screen edge.
4. Tap it. Security, URL, Offer and Quality tabs run entirely on the device — including offline.

If Scout finds a serious fingerprint it tells the person **not to type** passwords, cards, OTPs or ID numbers, highlights those fields, and can stop a dangerous form submit.

## Main features

- Opportunity screening with explainable scores
- Offline XSS / SQL-error / CSRF / secret / transport / hardening audit
- URL tricks (open redirects, traversal-shaped values, javascript: URLs)
- Live re-scan when the page changes
- Field-level “do not enter sensitive information” warnings
- Local audit export and history
- Second-opinion redacted files, case comparison, Hausa safety guide
- PWA share-target so WhatsApp/email can send a message into Inspect

## Stack

Semantic HTML, CSS, vanilla JavaScript. No backend, no analytics, no remote AI.

## Audience

Students and first-time applicants who need a private screening aid, not a black-box “scam score”.
