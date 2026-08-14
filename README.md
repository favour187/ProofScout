# ProofScout

**Trust before you apply.**

ProofScout is a private, explainable screening tool for online jobs, grants, scholarships and competitions. It helps people identify dangerous pressure, payment demands, credential requests and missing verification evidence before they take action.

## Why it exists

Online opportunities can change lives, but fake grants, jobs and prize notices often imitate legitimate organizations. People need more than a mysterious “scam score”: they need to understand the evidence, know what remains unverified and leave with concrete next steps.

ProofScout runs entirely in the browser. Pasted messages and saved cases never leave the user's device.

## Features

- Explainable risk score with signal-by-signal reasoning
- Extraction of deadlines, prize claims, entry cost, mode, domain and contact
- Independent verification checklist tailored to the result
- Evidence-completeness meter that highlights missing proof
- Contradiction detection for “free” offers that later request payment
- Safe verification-message generator for contacting organizers
- Exportable, machine-readable evidence reports
- Local evidence locker for saved cases
- Credible and suspicious built-in demo scenarios
- Print-friendly report
- English and Hausa safety guidance
- High-contrast mode, keyboard navigation and reduced-motion support
- Offline installation as a Progressive Web App
- No account, analytics, paid API or backend

## Technical approach

The interface uses semantic HTML, responsive CSS and modular vanilla JavaScript. The screening engine combines transparent pattern rules, weighted evidence, URL checks and structured claim extraction. Positive evidence can reduce risk while danger patterns increase it. Every rule produces a human-readable explanation.

This is intentionally an explainable screening model rather than a black-box classifier. It does not guarantee legitimacy; it helps users decide what to verify next.

Saved cases and display preferences use browser local storage. A service worker caches the application shell for offline use.

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
