# TapTalk

A web-based AAC (augmentative and alternative communication) app for people who use AAC to communicate, including non-speaking people and people with speech difficulties. Their voice matters, so it focuses on one thing: helping them say exactly what they mean in fewer taps, while they stay the author of every word.

**Vertical:** Build for Impact: Reimagining the Future with AI

## The idea

Existing AAC apps already have text-to-speech, word prediction, saved phrases and personalization. TapTalk does not claim those are new. It tests one question: can free-form typing and prediction be combined so the same thought takes less effort, without the app "guessing" at the user?

Rules the interface follows:
- The user can type anything, edit it, ignore every suggestion, and speak the result.
- Suggestions live in one fixed-height row, so the layout never jumps.
- Nothing is spoken or inserted without a tap.
- Prediction only counts as useful if accepting it costs fewer actions than typing.

## How it works

- **Type with your own keyboard.** The sentence box is a normal text field, so the device keyboard, a physical keyboard, voice typing and Hindi keyboards all work. Prefer larger keys? Turn on **Big keys** for TapTalk's own English or Devanagari keyboard.
- **Suggestions** appear under the sentence, at the cursor. While a word is being typed, the first chips complete that word (two or three choices, from a vocabulary of everyday words plus the person's own words and names). Further chips complete the whole thought. Tap one to accept it, or keep typing to ignore it.
- **Tools under the sentence:** delete word, clear, and big keys are icon buttons right under the sentence box. Tapping them, Speak or a suggestion keeps the on-screen keyboard open; it only closes when the person moves to another page.
- **Situations** is a page of ready-made phrases to tap and speak, grouped by where the person is or what they need: at home, at work, need help, at the doctor, out and about, at school, and family and friends. Each situation can hold the person's own phrases too (added with **+ Add**, changed with the pencil), and they can make new situations of their own, such as "At the temple".
- **Favorites** sit at the top as up to five cards, then a **More** button that slides to a page with all of them in three columns. Tap a card to speak it. A dashed line on the Favorites page separates the five shown on the Talk page from the rest. Add a favorite with the star next to the sentence, from the history, or with **+ Add**. Change one with the pencil, delete it with the bin (there is an Undo), and hold a card then drag it to change the order.
- **Symbols** is a page of bold pictures (water, food, toilet, pain, help, medicine, feelings, yes, no, wait, home, phone and more). Tap a picture to speak its phrase.
- **Speaking feedback:** whatever is being spoken (a card, a symbol, a history line, the Speak button) turns light blue and shows moving sound bars beside it, and the mascot shows sound lines.
- **My words** is a page for names and personal words. Tap one to add it to the sentence. These words also feed the suggestions.
- **Select** (on Favorites, My words, Situations and the history) turns the cards into checkable items so several can be deleted at once, with Undo. On the lists the person arranges (favorites, words, own phrases) there is also **Move to top**.
- **Spoken before** is a timeline of what was said and when. Tap a line to speak it again, edit it or add it to favorites.
- **English and हिन्दी.** Hindi works in Devanagari and in Roman letters (Hinglish). In Hindi mode, Roman words are converted to Devanagari as you type (when you press space), suggestions appear in Devanagari, and speech uses a Hindi voice.
- Swipe between pages or use the tabs. The speak bar stays above the on-screen keyboard.

## Suggestions and AI

TapTalk has two layers:

1. **Built-in model (default, on the device).** A small statistical language model in `public/predict.js`: word frequencies, next-word pairs and phrase matching over a phrase list, boosted by what the user has said before and by their own names and words. It needs no network and sends nothing anywhere. A phrase match is ranked by how much of the sentence it matches, and matches that lead to the same continuation are combined.
2. **Optional AI layer (off by default).** If the server has a Gemini API key, an **AI** button appears. After the user agrees in a dialog, the text before the cursor, the language, and up to five recently spoken sentences are sent to Google Gemini through `api/ai.js`, which returns up to three short completions. They show up as green chips next to the built-in ones. If the AI is slow, fails or is switched off, the built-in suggestions keep working and nothing changes.

How the AI layer is kept safe:
- The key stays on the server and is never sent to the browser.
- Input is validated (length, language, five recent sentences at most) and requests are rate limited.
- The model's answer is cleaned, deduplicated and capped before it is shown, and it is only ever a suggestion the user can tap or ignore.
- The user's text is passed as data between markers, and the model output is never run as code.

Privacy: when AI is on, what the user types goes to Google. On Google's free tier, content may be used to improve their products, so check Google's current terms before turning it on for private sentences. Using a paid key avoids that.

Set up: create a key in Google AI Studio and add `GEMINI_API_KEY` as an environment variable on the host (Vercel: Project, Settings, Environment Variables, then redeploy). Optionally set `GEMINI_MODEL` to change the model, which is `gemini-flash-lite-latest` by default.

3. **Optional natural voice (off by default).** The device voice is chosen automatically (the best matching English or Hindi voice, spoken slightly slowly for clarity). If the server has the same Gemini key, a speaker button appears that sends the sentence being spoken to Google's Gemini text-to-speech through `api/speak.js` and plays a more natural voice. If it fails, the device voice is used. The same privacy note applies. Optional variables: `GEMINI_TTS_MODEL` and `GEMINI_VOICE`.

There are four built-in styles: A words, B phrases, C personal and D adaptive. The app uses C. Add `?v=A`, `?v=B` or `?v=D` to the address to try the others.

## Evaluation

`npm run bench` runs 5 communication tasks through all four built-in styles, in English and Hindi, with a scripted test user who accepts a suggestion only when it exactly matches what they want. The tasks are: a plain sentence, a two-part sentence, an unusual sentence, changing their mind halfway, and ignoring every suggestion. It counts key presses and taps and compares them with typing every letter. The AI layer is not part of this benchmark, because it needs a key and a network.

What it shows:
- Prediction saves roughly a quarter of the actions in English and nearly a third in Hindi, mostly when the sentence resembles a known phrase or uses common words.
- Phrase completion and word completion together beat word completion alone.
- Personalization helps most with sentences the user repeats, so it is the default.
- Adaptive did not beat Personal. When it hid suggestions after a run of ignored ones it also hid useful ones, so it stays an experiment.
- When nothing fits, no style costs more than typing.

Limits: the test user is idealized, the phrase lists are small, and the benchmark counts actions, not time.

## Design

Light lavender page, white and pastel cards, black actions, rounded rectangles everywhere, Poppins type (it covers Hindi too), bold icons, and chunky tiles inspired by Duolingo. Colors carry meaning instead of decorating: favorites are yellow, each situation has its own color, symbols are green, words are lilac, and a tapped or speaking tile turns light blue. The character and logo are the yellow speech-bubble mascot: it looks up toward the sentence and shows sound lines while it speaks. Gestalt principles guide the layout:
- **Proximity:** suggestions sit directly under the sentence, and the actions directly under them.
- **Common region:** each job (situations, favorites, sentence, history, keyboard) has its own card.
- **Similarity:** actions are black, suggestions are white, AI suggestions are green, and selected options are always black.
- **Figure and ground:** the sentence is the largest text and Speak is the one high-contrast block.
- **Hierarchy:** favorites come first because they are the fastest way to speak.

The layout reflows: stacked in portrait, two columns in landscape, and compact when the on-screen keyboard is open. It can be added to the home screen like an app.

## Run, test, deploy

```bash
npm test          # 40 unit tests, no install needed
npm start         # http://localhost:8080
npm run bench     # the evaluation above
```

Deploy on Vercel (static files in `public/` plus the function in `api/`) or Google Cloud Run (`Dockerfile`):

```bash
gcloud run deploy taptalk --source . --region asia-south1 --allow-unauthenticated
```

## Accessibility

Large touch targets, high contrast, visible keyboard focus, labels for screen readers, reduced-motion support, hidden pages are not focusable, the device keyboard (including Hindi) and voice typing work, and layouts for portrait and landscape.

## Security

No accounts. Sentences, history, favorites and words stay in the browser's local storage on the device. Outside requests are the Poppins font from Google Fonts and, only when the user turns AI suggestions or natural voice on, the server's calls to Gemini. The Content-Security-Policy allows nothing else. The server only serves files from `public/` and rejects path tricks.

## Assumptions

- Reordering uses hold and drag, so it needs a pointer or touch. Every other action has a button.

- English and Hindi. Speech uses the device's own voices, so a Hindi voice must be installed (on Android: Settings, then Text-to-speech).
- Roman Hindi is converted with a word list built from the phrase lists plus simple rules, so unusual spellings may sound slightly off.
- Built-in Hindi phrases are written gender-neutral, and personalization learns the user's own forms. They should be reviewed by a native speaker.
- The phrase lists are a starting point, not a clinical vocabulary.
