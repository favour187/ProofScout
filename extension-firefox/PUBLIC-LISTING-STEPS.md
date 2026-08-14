# Publish ProofScout for one-tap Firefox Android installation

The approved 1.0.1 file was submitted through Mozilla's self-distribution (“On your own”) channel. Firefox Android does not offer a normal one-tap installation for that externally hosted XPI. A public AMO listing is required.

## Preferred route on the existing add-on

1. Open the ProofScout developer page.
2. Select **Upload a New Version**.
3. If Mozilla asks for a distribution channel, select **On this site** / **Listed**.
4. Upload `proofscout-firefox-listed-v1.0.2.zip`.
5. Choose Firefox and Firefox for Android as supported platforms.
6. Complete the public product listing using `STORE-LISTING.md`.
7. Add the privacy policy: `https://favour187.github.io/ProofScout/privacy.html`.
8. Submit for public listing review.

## If the existing page does not offer Listed / On this site

1. Go to `https://addons.mozilla.org/developers/addon/submit/distribution`.
2. Choose **On this site** (not “On your own”).
3. Upload `proofscout-firefox-listed-v1.0.2.zip`.
4. If Mozilla reports that the add-on ID already exists, return to the existing add-on and contact Mozilla Add-ons support about enabling the listed channel for the same add-on. Do not delete the approved entry until Mozilla gives a clear instruction.

## Listing details

Use the prepared name, summary, description, categories, permission justification and links in `STORE-LISTING.md`.

After approval, Mozilla will provide a public URL similar to:

`https://addons.mozilla.org/firefox/addon/proofscout-page-assistant/`

That public AMO URL—not a developer URL or self-hosted XPI—is what should be connected to the website's mobile install button.
