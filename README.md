# BIP39 Offline Dice-Roll Checksum

This tool helps you finish or check a 12-word or 24-word BIP39 seed phrase made with dice.

It runs entirely in your browser. You do not need to install anything, start a server, or connect to the internet.

![The BIP39 Offline Dice-Roll Checksum tool with its black and orange design, seed phrase box, and numbered word list](assets/app-screenshot.webp)

## Why this tool exists

The last word of a BIP39 seed phrase cannot be any word you want. Part of the last word is a built-in error check called a checksum.

This is why people can roll dice, choose words from the official list, and still have their wallet reject the finished phrase. The last word may have the wrong checksum.

This tool finds last words that pass the checksum test. It works with both 12-word and 24-word seed phrases.

I used an earlier version of this tool when I made my own key. I am sharing it because people should have a simple tool that they can inspect and run offline.

## How to use it

1. Download this repository.
2. Keep `index.html`, `app.js`, `bip39-wordlist.js`, and the `assets` folder together.
3. Disconnect the computer from the internet.
4. Drag `index.html` into your browser. You can also double-click it.
5. Choose what you want to do:
   - Enter 11 words to find possible 12th words.
   - Enter all 12 words to check the 12th word.
   - Enter 23 words to find possible 24th words.
   - Enter all 24 words to check the 24th word.
6. Click **Find valid final words**.

You can type the words yourself or use the `+` buttons next to the words in the list. The full English BIP39 word list is built into the tool and works offline.

If you enter a complete phrase with a bad last word, the tool shows valid replacements. It puts the replacement that keeps the random part of your dice-picked last word first.

## Never use the examples as real keys

The example buttons load the first 11 or 23 words from the public BIP39 list. Everyone can see and guess these words.

**Never use an example phrase to hold money. The examples are only there to show how the tool works.**

## Make the seed with real randomness

A phrase can pass the checksum test and still be unsafe. This tool only checks the last word. It cannot tell you whether the rest of the phrase is random or secure.

- Do not pick words because you like them.
- Do not use an ordinary online random-word website.
- For this method, use physical dice and follow a trusted guide that explains how to remove bias and make enough rolls.
- A trusted hardware wallet or a properly tested offline cryptographic generator is another valid way to make a seed.

## Check the code before entering secret words

The project is intentionally small. Read the source code yourself or ask an AI coding assistant to review the unchanged files. Check that:

- every script and image is stored locally;
- the app makes no internet requests;
- there are no ads, analytics, or tracking tools;
- the app does not save your words in browser storage; and
- the checksum code follows BIP39.

An AI review can help, but it cannot promise that a computer is safe. **Never give your seed phrase to an AI service. Never upload a screenshot containing your seed phrase.** Ask the AI to review the source code only.

## Safety warnings

- Use a trusted computer that is disconnected from the internet.
- Malware, browser extensions, screen-recording software, clipboard history, and other programs may still see your words.
- Clicking words instead of typing them may reduce keyboard exposure, but it does not stop screen capture or malware.
- Do not enter the seed phrase of a wallet that already holds money just to test this tool.
- Check the finished phrase on the hardware wallet where you plan to use it.
- Test that you can restore the wallet before sending it a large amount of money.

## What is included

- `index.html` is the page you open.
- `app.js` checks the words and calculates the checksum.
- `bip39-wordlist.js` contains the official 2,048 English BIP39 words.
- `assets/cat-logo.webp` is the cat logo.
- `assets/app-screenshot.webp` is the screenshot shown in this README.

The tool does not need PHP, a web server, or an internet connection.
