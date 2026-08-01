# BIP39 Offline Dice-Roll Checksum

Create a checksum-valid 12- or 24-word English BIP39 mnemonic from words selected with an unbiased dice-roll method. Everything runs locally in your browser—there is no backend, installation, build process, or internet connection required.

![BIP39 Offline Dice-Roll Checksum interface with black and orange theme, checksum input, and numbered word list](assets/app-screenshot.webp)

## Why this exists

A common point of failure when creating a BIP39 mnemonic with dice is the final word. The last word is not completely arbitrary: part of it contains a checksum derived from the preceding entropy. A randomly selected final word will therefore usually fail a wallet's recovery-phrase validation even when every word belongs to the official BIP39 list.

This app automatically finds checksum-valid final words so the resulting mnemonic can be accepted by a BIP39-compatible wallet. It supports both 12-word and 24-word mnemonics.

The interface also includes a compact, numbered, scrollable copy of the complete English BIP39 word list. It is rendered from the same embedded list used by the verifier and remains available offline.

Each listed word has a `+` button that appends it directly to the mnemonic field, allowing a phrase to be assembled without typing the words on a keyboard. Keyboard entry remains available. Selecting from the screen may reduce keyboard exposure, but it does not protect against malware, screen capture, browser extensions, or other monitoring on the device.

I used this tool when generating my own key. Recent reports of cold-wallet compromises motivated me to share it so others can inspect it, run it offline, and use it for their own dice-generated mnemonics.

## Run it locally

1. Download or clone this repository.
2. Keep `index.html`, `app.js`, `bip39-wordlist.js`, and the `assets` folder together.
3. Drag `index.html` into any modern browser, or double-click it.
4. Enter:
   - 11 words to find checksum-valid 12th words;
   - all 12 words to verify the current 12th word;
   - 23 words to find checksum-valid 24th words; or
   - all 24 words to verify the current 24th word.

The example buttons use either the first 11 or the first 23 public entries in the embedded BIP39 list. They are generated from the list at runtime and do not contain a privately chosen mnemonic.

> **Never use either example as a wallet key.** The words are public, predictable, and included only to demonstrate the checksum finder.

If a supplied final word is invalid, the app lists valid replacements while preserving the preceding words. An 11-word prefix normally has 128 valid endings; a 23-word prefix has 8.

When you supply a dice-picked final word, the app highlights the one checksum correction that preserves the entropy bits contributed by that word. Other displayed endings are also checksum-valid, but they change those remaining entropy bits and must be selected with an unbiased random method.

## Verify the source before using it

This repository is intentionally small enough to inspect. Before entering a mnemonic, review the source yourself or ask an AI coding assistant to inspect the **unmodified source files** and confirm that:

- all scripts are local;
- there are no network requests, remote assets, analytics, or telemetry;
- mnemonic words are not written to browser storage;
- mnemonic words are only processed in memory; and
- the checksum implementation follows BIP39.

AI review is an additional check, not a security guarantee. **Never paste your mnemonic into an AI service, upload a populated screenshot, or ask an online tool to test the actual words.** Review the source first, then disconnect the computer from the network before opening `index.html` and entering any secret material.

## Important security notes

- A valid checksum does **not** prove that a mnemonic is random, secure, unique, or unused. It only proves that the BIP39 checksum is structurally correct.
- Human-picked words are predictable. Use a documented, unbiased dice procedure with enough rolls to generate the required entropy. Do not choose words based on personal preference.
- For this dice-based workflow, use physical dice and a documented unbiased conversion procedure. Do not trust a casual website or app that merely claims to generate random words. A vetted hardware wallet or cryptographically secure offline generator is a separate, valid approach, but ordinary pseudo-random or online word generators are not equivalent.
- Use a trusted, offline computer. Malware, browser extensions, clipboard managers, screen capture, and operating-system telemetry may expose a mnemonic even though this app makes no network requests.
- Do not enter an existing funded wallet's mnemonic merely to test this app.
- Verify the completed mnemonic on the intended hardware wallet before relying on it, and securely test the recovery procedure before depositing significant funds.

## Offline design

The application consists of four static files:

- `index.html` provides the interface;
- `app.js` performs validation and SHA-256 checksum calculation; and
- `bip39-wordlist.js` contains the official 2,048-word English BIP39 list; and
- `assets/cat-logo.webp` provides the local brand artwork.

The app makes no network requests and requires no PHP runtime or web server.
