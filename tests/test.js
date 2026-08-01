"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function elementStub() {
  return {
    value: "",
    textContent: "",
    className: "",
    style: {},
    children: [],
    listeners: {},
    classList: { add() {}, remove() {} },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    addEventListener(name, listener) { this.listeners[name] = listener; },
    replaceChildren(...children) { this.children = children; },
    append(...children) { this.children.push(...children); },
    focus() {},
    select() {},
    remove() {}
  };
}

const nodes = new Map();
global.document = {
  querySelector(selector) {
    if (!nodes.has(selector)) nodes.set(selector, elementStub());
    return nodes.get(selector);
  },
  createElement: elementStub,
  createDocumentFragment: elementStub,
  body: { append() {} },
  execCommand() { throw new Error("Clipboard fallback must not be called"); }
};
global.window = { setTimeout(callback) { callback(); } };

const wordListSource = fs.readFileSync(path.join(root, "bip39-wordlist.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const api = new Function(`${wordListSource}\n${appSource}\nreturn { BIP39_ENGLISH_WORDS, example11Words, example23Words, findValidFinalWords, sha256, validate };`)();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function referenceMnemonic(entropyHex) {
  const entropy = Buffer.from(entropyHex, "hex");
  const checksumLength = (entropy.length * 8) / 32;
  const entropyBits = [...entropy].map((byte) => byte.toString(2).padStart(8, "0")).join("");
  const checksumBits = crypto.createHash("sha256").update(entropy).digest()[0]
    .toString(2).padStart(8, "0").slice(0, checksumLength);
  const bits = entropyBits + checksumBits;
  const words = [];
  for (let offset = 0; offset < bits.length; offset += 11) {
    words.push(api.BIP39_ENGLISH_WORDS[Number.parseInt(bits.slice(offset, offset + 11), 2)]);
  }
  return words;
}

assert(api.BIP39_ENGLISH_WORDS.length === 2048, "Word list must contain 2,048 entries");
assert(new Set(api.BIP39_ENGLISH_WORDS).size === 2048, "Word list entries must be unique");
assert(api.BIP39_ENGLISH_WORDS[0] === "abandon" && api.BIP39_ENGLISH_WORDS[2047] === "zoo", "Word list order is wrong");

for (let index = 0; index < 1000; index += 1) {
  const input = crypto.randomBytes(index % 97);
  const expected = crypto.createHash("sha256").update(input).digest("hex");
  const actual = Buffer.from(api.sha256(input)).toString("hex");
  assert(actual === expected, `SHA-256 mismatch for generated case ${index}`);
}

const official = JSON.parse(fs.readFileSync(path.join(__dirname, "official-vectors.json"), "utf8"));
for (const [index, vector] of official.vectors.entries()) {
  const mnemonic = referenceMnemonic(vector.entropy);
  const digest = crypto.createHash("sha256").update(mnemonic.join(" ")).digest("hex");
  assert(mnemonic.length === vector.words, `Official vector ${index + 1} has the wrong word count`);
  assert(digest === vector.mnemonicSha256, `Official vector ${index + 1} mnemonic mismatch`);
  const valid = api.findValidFinalWords(mnemonic.slice(0, -1));
  assert(valid.includes(mnemonic.at(-1)), `Official vector ${index + 1} final word was rejected`);
  assert(valid.length === (vector.words === 12 ? 128 : 8), `Official vector ${index + 1} candidate count is wrong`);
}

assert(api.example11Words === api.BIP39_ENGLISH_WORDS.slice(0, 11).join(" "), "11-word demo is not the public prefix");
assert(api.example23Words === api.BIP39_ENGLISH_WORDS.slice(0, 23).join(" "), "23-word demo is not the public prefix");
assert(!/navigator\.clipboard|execCommand\s*\(\s*["']copy/i.test(appSource), "Clipboard code must not exist");
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|console\./i.test(appSource), "Network, logging, or storage API found");

const renderedList = nodes.get("#word-list").children[0].children;
assert(renderedList.length === 2048, "Rendered list must have 2,048 rows");
assert(renderedList[0].children[0].textContent === "1", "Rendered numbering must start at 1");
assert(renderedList[2047].children[1].textContent === "zoo", "Rendered list must end with zoo");

console.log(`PASS: 1,000 SHA-256 comparisons, ${official.vectors.length} official BIP39 vectors, offline/security checks, and UI word-list integrity`);
