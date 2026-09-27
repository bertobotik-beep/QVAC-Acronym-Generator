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

## License

MIT
