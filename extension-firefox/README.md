# ProofScout for Firefox and Firefox for Android

This directory is the Mozilla Add-ons signing package.

## Free signing route

1. Create or sign in to a free Mozilla account at https://addons.mozilla.org/developers/.
2. Choose **Submit a New Add-on**.
3. Select whether the add-on should be listed publicly or self-distributed after signing.
4. Upload `proofscout-firefox-v1.0.1.xpi`.
5. Use the listing text in `STORE-LISTING.md` and the hosted privacy policy.
6. After Mozilla validation/signing, download the signed XPI.
7. For a public listing, link the website install button to the AMO listing. For self-distribution, host the signed XPI and link directly to it.

Normal Firefox users can install only the Mozilla-signed file. Firefox will show the required page-access permission before installation.
