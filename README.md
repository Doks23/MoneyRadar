# MoneyRadar

Upload your bank statements and let AI analyze your spending. No sign-ups, no servers, no data leaving your computer.

## What it does

- Drop in PDFs, CSV files, TXT files, or screenshots of your bank statements
- Automatically extracts every transaction and sorts them into categories (Groceries, Dining, Transport, etc.)
- Shows you where your money goes with charts and summaries
- Lets you edit, categorize, and export everything as CSV

## How it works

Everything runs in your browser. Your financial data never touches the internet — the AI works through your own API key, and all your edits and rules are saved locally.

You'll need a Gemini API key from Google AI Studio (free tier works fine). The app will prompt you for it the first time you use it.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in your terminal, paste your API key, and start uploading statements.
