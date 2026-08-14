# ProofScout Page Assistant — Chrome extension

A zero-API browser assistant that inspects the page the user is already viewing.

## Capabilities

- Floating Scout orb on regular HTTP and HTTPS pages
- Current-page opportunity screening
- URL risk analysis
- Local bug and accessibility diagnosis
- Highlights problematic page elements
- Spoken result summary through browser text-to-speech
- Optional voice command support where Chrome Speech Recognition is available
- No backend, analytics, API key or page-content upload

## Install for development/demo

1. Download or clone the ProofScout repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the `extension` folder.
6. Open any normal website and select the floating `P` orb.

Chrome blocks extensions on internal pages such as `chrome://settings` and the Chrome Web Store.

## Privacy

The extension analyzes DOM text and metadata locally. It does not transmit page content. Its manifest requests page access because the assistant must be available without making the user leave the current page.
