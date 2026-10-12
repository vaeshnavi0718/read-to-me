# ☁️ read to me

A tiny local page that reads PDFs and web articles aloud.

## Run it

You need [Node.js](https://nodejs.org) 20.19 or newer (`node -v` to check).

```sh
git clone https://github.com/vaeshnavi0718/read-to-me.git
cd read-to-me
npm install
npm run dev
```

Your browser opens at http://localhost:5173. Works best in Chrome, Safari, or Edge.

## Using it

- **PDF**: drop a file or click to choose one. Scanned image PDFs have no text, so they can't be read.
- **Link**: paste an article URL. Links that point to PDFs work too. Some sites block automated readers.
- **Click any sentence** to jump there.
- **Keys**: `space` plays or pauses, `←` / `→` go to the previous or next sentence.
- Your voice and speed are remembered.

## Getting nicer voices

Voices come from your own computer and browser, so what you see depends on your setup.


- **Chrome** adds "Google US English", "Google UK English Female" and others (these need internet).
- **Better Mac voices**: System Settings → Accessibility → Spoken Content → System Voice → *Manage Voices…*,
  then download any **Premium** or **Enhanced** voice (e.g. Ava, Zoe, Evan). Restart the browser and they show up
  under "✨ best sounding". Safari shows all of them; Chrome shows most.
- Tick **all languages** to see voices for other languages.

## How it's built

React + TypeScript on Vite. PDFs are parsed in the browser with pdf.js. Article links go through a small
`/api/fetch` route inside the Vite dev server (`server/fetchArticle.ts`), which uses Mozilla Readability
to pull out just the article text. Speech uses the browser's built-in Web Speech API, one sentence at a time.
