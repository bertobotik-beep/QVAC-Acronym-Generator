# QVAC Acronym Generator

Enter a phrase (e.g. "Quick Value Add Checker") and get 3-5 acronym options built from that phrase's actual words. The candidate letters are computed deterministically from your words (so they're always accurate), and an on-device AI is used to pick and flavor the most catchy options. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:31006

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown. Acronym letters are always verified against the actual input words before being shown.

`src/logic.js` never trusts the model's letters directly. `isValidCandidate()` checks that every candidate is a true in-order subsequence of the phrase's own first letters, so a hallucinated letter that doesn't actually come from one of your words is discarded. `deterministicCandidates()` also builds several guaranteed-valid options in code (full first letters, first letters skipping stopwords like "a"/"the"/"of", dropping the first or last word, and first letters of only the longer words) so the app can always return a full result even if the model's suggestions are all rejected.

## Example

- **Input phrase:** `"Quick Value Add Checker"`
- **Output acronyms:** `QVAC`, `QAC`, `VAC` (skipping stopwords or trimming words), all confirmed to be genuine in-order subsequences of `Q-V-A-C`.

## Setup

Requires Node.js and a machine that can run the QVAC on-device runtime (see the QVAC SDK docs for platform support). `npm install` pulls in `@qvac/sdk`; `npm start` loads the `LLAMA_3_2_1B_INST_Q4_0` model on first run, which can take a moment.

## License

MIT
