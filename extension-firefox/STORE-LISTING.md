# Mozilla Add-ons listing material (v3.0.0)

Public listing: https://addons.mozilla.org/firefox/addon/proofscout-page-assistant/

Optional dashboard updates still worth doing:

- Homepage: https://favour187.github.io/ProofScout/
- Icon: upload `icon128.png` (AMO currently shows the default puzzle)
- Screenshots: the live site and `demo-target.html`

## Name
ProofScout Page Assistant

## Summary
Inspect the current page for opportunity pressure, XSS and SQL indicators, URL tricks and leaked secrets — on your device, including offline.

## Description
ProofScout adds a small floating Scout button to ordinary web pages. Open it to inspect the page you are already viewing. Version 3 includes four tools:

Security — reads this document, its scripts, forms, URL and local storage for XSS indicators, SQL error text, CSRF gaps, leaked keys, mixed content, copy-jack, punycode links, miners, hidden password fields, brand/link mismatch and card fields. If it finds a serious fingerprint it tells you not to type passwords, OTPs, cards or ID numbers, and can block a dangerous form. It does not send attack payloads.

URL — explains insecure connections, open-redirect style parameters, traversal-shaped values, javascript: and data: addresses, markup in the query, and other address-bar signals.

Offer — explains common danger signals such as upfront fees, artificial urgency, guaranteed outcomes and requests for passwords, OTP codes, banking logins or seed phrases.

Quality — broken images, insecure forms, unlabeled controls, duplicate IDs, missing page language, unsafe new-tab links and other accessibility defects. It can highlight affected elements.

Scout can read findings aloud. Voice commands are offered when the browser supports speech recognition.

All inspection happens locally. ProofScout has no user account, analytics, ads, remote AI service or page-content server.

## Privacy policy
https://favour187.github.io/ProofScout/privacy.html

## Homepage
https://favour187.github.io/ProofScout/

## Source code
https://github.com/favour187/ProofScout

## Permission justification
ProofScout requests access to HTTP and HTTPS pages so its content script can display the floating assistant and inspect visible text, the current URL, forms, images, headings, labels and links. Data is processed locally and is not transmitted or collected.

## Categories
Privacy & Security; Web Development

## Support
https://github.com/favour187/ProofScout/issues
