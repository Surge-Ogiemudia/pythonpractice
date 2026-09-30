# CS50P Logic Tutor

A study tool for CS50's Introduction to Programming with Python. Paste in any problem set and a Gemini-powered tutor walks you through it, without handing you the answer:

1. **Plain English.** Explain how you would solve it, in the order the program runs. If anything is missing or out of order, the tutor shows what you missed and the right order, then has you write it again in your own words (pasting is off). You move on only when it is complete and in order.
2. **Step by step.** Write the program top to bottom, a few lines per step, with the indentation they'll have in the final file. Steps unlock one at a time, and a live preview shows your file taking shape.
3. **Run & review.** Your approved steps, stacked together, are the program. Run it in the browser (Python via Pyodide), then get a review. Once it's correct, the tutor shows a shorter or cleaner way to write it.

Use `check50` in your CS50 codespace for the official grade.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Connect AI Key** and paste a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). The key is saved in your browser. You can also set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in `.env.local` instead.

Progress is saved in the browser, so a refresh won't lose your place. **New** in the top bar starts a fresh problem.
