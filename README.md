# TapTalk

A web-based AAC (augmentative and alternative communication) interface for people who cannot speak. It focuses on one problem: getting an arbitrary sentence out in fewer taps, while the user stays the author of every word.

**Vertical:** Build for Impact: Reimagining the Future with AI

## The idea

Existing AAC apps already have text-to-speech, word prediction, saved phrases and personalization. TapTalk does not claim those are new. It tests one question: can free-form typing and prediction be combined so the same thought takes less effort, without the app "guessing" at the user?

Rules the interface follows:
- The user can type anything, edit it, ignore every suggestion, and speak the result.
- Suggestions are at most 3 chips in a fixed-height row, so the layout never jumps.
- Nothing is spoken or inserted without a tap.
- Prediction only counts as useful if accepting it costs fewer actions than typing.

## Four suggestion styles (switch at the top)

| Version | Behavior |
|---|---|
| A Words | Completes the current word, or predicts the next word |
| B Phrases | Completes the current thought from a phrase list, matching even mid-sentence, then words |
| C Personal | Like B, but sentences the user spoke before are weighted 3x |
| D Adaptive | Like C, but tracks accepts and ignores. If the user keeps ignoring suggestions, it shows only phrases, then only strong matches, then almost nothing. Accepting one brings them back |

All logic is in `public/predict.js` (plain JS, no AI API, runs offline). The sentence list is a small built-in list of about 40 everyday phrases.

## How it works

Type with the on-screen keyboard or a physical one. Tap a chip to accept a suggestion. Backspace, Delete word and Clear all handle changes of mind. Speak reads the sentence aloud with the browser's built-in speech. Every spoken sentence shows its measured time, keys, taps, corrections, accepted and ignored suggestions, and is added to "Spoken before".

The layout is a CSS grid that reflows: stacked on phones, side by side in landscape, extra panels move up into free space on large screens.

## Evaluation

The "Does prediction save effort?" panel runs 5 tasks through all four versions with a simulated user who accepts a suggestion only when it exactly matches what they want:

1. "I want to go home after dinner."
2. "Can you wait five minutes? I need to finish this."
3. An unusual sentence not in the phrase list
4. Changing their mind halfway (types "I want to eat pizza", then switches to "I want to go outside.")
5. Ignoring every suggestion

Actions = key presses + taps. Results (fewer is better, in brackets the saving versus typing every letter):

| Task | A | B | C | D |
|---|---|---|---|---|
| Go home | 19 (−12) | 18 (−13) | 13 (−18) | 13 (−18) |
| Wait | 26 (−23) | 29 (−20) | 26 (−23) | 26 (−23) |
| Unusual | 41 (−5) | 41 (−5) | 41 (−5) | 41 (−5) |
| Change of mind | 28 (−11) | 22 (−17) | 28 (−11) | 28 (−11) |
| Ignore all | 36 (±0) | 36 (±0) | 36 (±0) | 36 (±0) |
| Total | 150 (−51) | 146 (−55) | 144 (−57) | 144 (−57) |

What this shows, honestly:
- Prediction saves roughly a quarter of the actions, and gains come mostly when the sentence resembles a known phrase.
- Phrase completion (B) is not always better than words (A): on task 2 it was worse, because phrase chips pushed out a useful word chip.
- Personalization (C) helps on sentences the user repeats (task 1) but can hurt when history ranks above a better match (task 4).
- Adaptive (D) matched C in this benchmark. It did not measurably reduce ignored suggestions here, so per the brief it has not earned its place yet and should be tested with real users who ignore suggestions often.
- When nothing fits (tasks 3 and 5), no version slows the user down: cost equals typing.

Limits: the simulated user is idealized, the phrase list is small, and the benchmark counts actions, not time. Real time and error data come from the live stats line after each spoken sentence. Task time and search count are not simulated (there is no search in the interface by design).

## Run, test, deploy

```bash
npm test          # 11 unit tests, no install needed
npm start         # http://localhost:8080
gcloud run deploy taptalk --source . --region asia-south1 --allow-unauthenticated
```

## Accessibility

Large touch targets (48px and up), high contrast text, visible keyboard focus, full physical keyboard support (type, Backspace, Enter to speak), screen-reader labels and a live stats region, reduced-motion support, layout works in portrait and landscape.

## Security

No external requests, no API keys, no user data leaves the device (history stays in the browser's local storage). The server only serves files from `public/`, rejects path tricks, and sends a strict Content-Security-Policy.

## Assumptions

- English only for now; the browser's own voice is used for speech.
- Editing is backspace-based, not at an arbitrary cursor position.
- The phrase list is a starting point, not a clinical vocabulary.
