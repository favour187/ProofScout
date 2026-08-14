# ProofScout

**Trust before you apply.**

ProofScout is a private, explainable screening tool for online jobs, grants, scholarships and competitions. It helps people identify dangerous pressure, payment demands, credential requests and missing verification evidence before they take action.

## Why it exists

Online opportunities can change lives, but fake grants, jobs and prize notices often imitate legitimate organizations. People need more than a mysterious “scam score”: they need to understand the evidence, know what remains unverified and leave with concrete next steps.

ProofScout runs entirely in the browser. Pasted messages and saved cases never leave the user's device. The repository also includes `proofscout-offline.html`, a complete single-file edition with its CSS and screening engine embedded. It can be transferred by USB, Bluetooth or local sharing and opened directly in Chrome with no internet connection.

## Features

- Explainable risk score with signal-by-signal reasoning
- Extraction of deadlines, prize claims, entry cost, mode, domain and contact
- Independent verification checklist tailored to the result
- Evidence-completeness meter that highlights missing proof
- Contradiction detection for “free” offers that later request payment
- Safe verification-message generator for contacting organizers
- Exportable, machine-readable evidence reports
- Local evidence locker for saved cases
- Side-by-side opportunity comparison with risk, evidence and concern counts
- Privacy-preserving second-opinion workflow for teachers, parents, mentors or friends
- Automatic redaction of emails, direct links, phone/account-like numbers and identifiers
- Offline export/import of structured review requests and human review responses
- Credible and suspicious built-in demo scenarios
- Print-friendly report
- English and Hausa safety guidance
- High-contrast mode, keyboard navigation and reduced-motion support
- Offline installation as a Progressive Web App
- Downloadable zero-data, single-HTML-file edition
- Chrome page assistant that stays on the page being inspected
- Current URL analysis for insecure, encoded, disguised or unusually structured links
- On-page bug doctor for broken images, insecure forms/resources, duplicate IDs and accessibility defects
- Voice commands and spoken findings through browser speech features
- Click-to-highlight affected page elements
- No account, analytics, paid API or backend

## Technical approach

The interface uses semantic HTML, responsive CSS and modular vanilla JavaScript. The screening engine combines transparent pattern rules, weighted evidence, URL checks and structured claim extraction. Positive evidence can reduce risk while danger patterns increase it. Every rule produces a human-readable explanation.

This is intentionally an explainable screening model rather than a black-box classifier. It does not guarantee legitimacy; it helps users decide what to verify next.

Saved cases and display preferences use browser local storage. A service worker caches the application shell for offline use.

## Simplest user flow: install and share

On supported Android/Chrome devices, open the hosted ProofScout site and tap **Install ProofScout app**. Afterwards, while viewing an opportunity page, use the browser's normal **Share** action and choose **ProofScout**. The shared title, text and URL open in the installed app ready for inspection. This uses the standard PWA Web Share Target API and requires no browser developer settings.

## Advanced Chrome page assistant

The `extension` directory contains the optional ProofScout Scout extension for current-page DOM and bug diagnosis. To demo it, open `chrome://extensions`, enable Developer mode, select **Load unpacked**, and choose that directory. The assistant appears as a floating `P` on ordinary HTTP and HTTPS pages. It cannot run on protected Chrome-internal pages. The `extension-firefox` directory contains a Firefox for Android signing package. Mozilla Add-ons signing is free. After Mozilla approves or signs the package, normal users can install it with one tap, review its page-access permission, and use the floating assistant on mobile pages.

## Run locally

A local web server is recommended so the service worker can run:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Privacy and safety

ProofScout does not upload pasted text. It never asks for identity documents, passwords or financial details. Users should independently confirm opportunities using an organizer's real website and contact their bank or payment provider if money or credentials may be exposed.

## Limitations

Text screening cannot prove that an opportunity is legitimate. Sophisticated fraud may avoid common warning language, while some legitimate announcements may contain urgency. The result is a decision-support signal, not a verdict.

## Built for

Build Beyond Hackathon 2026.
