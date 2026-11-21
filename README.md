# TapTalk

A web-based AAC (augmentative and alternative communication) app for people who use AAC to communicate, including non-speaking people and people with speech difficulties. Their voice matters, so it focuses on one thing: helping them say exactly what they mean in fewer taps, while they stay the author of every word.

**Vertical:** Build for Impact: Reimagining the Future with AI

## The idea

Existing AAC apps already have text-to-speech, word prediction, saved phrases and personalization. TapTalk does not claim those are new. It tests one question: can free-form typing and prediction be combined so the same thought takes less effort, without the app "guessing" at the user?

Rules the interface follows:
- The user can type anything, edit it, ignore every suggestion, and speak the result.
- Suggestions are at most 3 chips in a fixed-height row, so the layout never jumps.
- Nothing is spoken or inserted without a tap.
- Prediction only counts as useful if accepting it costs fewer actions than typing.

## How it works

- **Type with your own keyboard.** The sentence box is a normal text field, so the device keyboard, a physical keyboard, voice typing and Hindi keyboards all work. Prefer larger keys? Turn on **Big keys** for TapTalk's own English or Devanagari keyboard.
- **Suggestions** appear under the sentence, at the cursor. Tap one to accept it, or keep typing to ignore it.
- **My favorite** is one card at the top. Type a phrase, tap ★ Favorite, and from then on it speaks with a single tap.
- **Speak** reads the sentence aloud using the device's own voice, in English or Hindi (it detects which from what was typed).
- **English and हिन्दी** each have their own phrases, predictions and labels.
- **Spoken before** keeps recent sentences so they can be loaded and edited.

## Suggestions

All logic is in `public/predict.js` (plain JS, no AI API, works offline). There are four styles:

| Version | Behavior |
|---|---|
| A Words | Completes the current word, or predicts the next word |
| B Phrases | Completes the current thought from a phrase list, even mid-sentence, then words |
| C Personal | Like B, but sentences the user spoke before count 3x |
| D Adaptive | Like C, but backs off when the user keeps ignoring suggestions, and returns when one is accepted |

The app uses D. Add `?v=A`, `?v=B` or `?v=C` to the address to try the others.

## Evaluation

`npm run bench` runs 5 communication tasks through all four versions, in English and Hindi, with a scripted test user who accepts a suggestion only when it exactly matches what they want. The tasks are: a plain sentence, a two-part sentence, an unusual sentence, changing their mind halfway, and ignoring every suggestion. It counts key presses and taps and compares them with typing every letter.

What it shows:
- Prediction saves roughly a quarter of the actions in English and more in Hindi, mostly when the sentence resembles a known phrase.
- Phrase completion is not always better than word prediction. In one task its chips pushed out a more useful word chip.
- Personalization helps most with sentences the user repeats, and can hurt when history outranks a better match.
- Adaptive matches Personal on action counts, so it is not faster. It is the default because it stays out of the way when suggestions are ignored, which this benchmark barely measures. A trial with real users would settle it.
- When nothing fits, no version costs more than typing.

Limits: the test user is idealized, the phrase lists are small, and the benchmark counts actions, not time.

## Design

Light lavender page, white and pastel cards, black actions, rounded rectangles everywhere, Poppins type. Gestalt principles guide the layout:
- **Proximity:** suggestions sit directly under the sentence, and the actions directly under them.
- **Common region:** each job (favorite, compose, keyboard, history) is its own card.
- **Similarity:** actions are black, suggestions are mint, and selected options are always black.
- **Figure and ground:** the sentence is the largest text and the Speak button is the one high-contrast block.
- **Hierarchy:** the favorite card comes first because it is the fastest way to speak.

The cards reflow: stacked on phones and portrait tablets, side by side in landscape, and they move up into free space on large screens.

## Run, test, deploy

```bash
npm test          # 14 unit tests, no install needed
npm start         # http://localhost:8080
npm run bench     # the evaluation above
gcloud run deploy taptalk --source . --region asia-south1 --allow-unauthenticated
```

## Accessibility

Large touch targets, high contrast, visible keyboard focus, labels for screen readers, reduced-motion support, works with the device keyboard (including Hindi), voice typing and switch-style keyboards, and layouts for portrait and landscape.

## Security

No API keys and no accounts. Sentences, history and the favorite stay in the browser's local storage on the device. The only outside request is the Poppins font from Google Fonts, and the Content-Security-Policy allows nothing else. The server only serves files from `public/` and rejects path tricks.

## Assumptions

- English and Hindi. Speech uses the device's own voices, so a Hindi voice must be installed (on Android: Settings, then Text-to-speech).
- Built-in Hindi phrases are written gender-neutral, and personalization learns the user's own forms. They should be reviewed by a native speaker.
- The phrase lists are a starting point, not a clinical vocabulary.
