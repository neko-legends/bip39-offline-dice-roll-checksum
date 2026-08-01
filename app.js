"use strict";

const wordToIndex = new Map(BIP39_ENGLISH_WORDS.map((word, index) => [word, index]));
const wordsInput = document.querySelector("#words");
const countLabel = document.querySelector("#count");
const status = document.querySelector("#status");
const resultsPanel = document.querySelector("#results-panel");
const results = document.querySelector("#results");
const resultsTitle = document.querySelector("#results-title");
const resultsDescription = document.querySelector("#results-description");
const wordListElement = document.querySelector("#word-list");

// Build demos from public list positions so no private-looking phrase is ever
// stored in the source. These prefixes are intentionally incomplete and must
// never be used as wallet keys.
const example11Words = BIP39_ENGLISH_WORDS.slice(0, 11).join(" ");
const example23Words = BIP39_ENGLISH_WORDS.slice(0, 23).join(" ");

function addWordFromList(word, button) {
  const currentWords = normalizeWords(wordsInput.value);
  if (currentWords.length >= 24) {
    status.className = "status error";
    status.textContent = "A BIP39 mnemonic can contain at most 24 words.";
    return;
  }

  wordsInput.value = [...currentWords, word].join(" ");
  updateCount();
  wordsInput.removeAttribute("aria-invalid");
  resultsPanel.classList.remove("visible");
  results.replaceChildren();
  status.className = "status";
  status.textContent = `Added word ${currentWords.length + 1}: “${word}” from the local list.`;
  button.textContent = "✓";
  window.setTimeout(() => { button.textContent = "+"; }, 650);
}

function renderWordList() {
  const fragment = document.createDocumentFragment();
  BIP39_ENGLISH_WORDS.forEach((word, index) => {
    const item = document.createElement("li");
    const number = document.createElement("span");
    const label = document.createElement("span");
    const add = document.createElement("button");
    number.className = "word-number";
    label.className = "listed-word";
    add.className = "add-word";
    number.textContent = String(index + 1);
    label.textContent = word;
    add.type = "button";
    add.textContent = "+";
    add.setAttribute("aria-label", `Add ${word} to mnemonic`);
    add.setAttribute("title", `Add ${word}`);
    add.addEventListener("click", () => addWordFromList(word, add));
    item.append(number, label, add);
    fragment.append(item);
  });
  wordListElement.replaceChildren(fragment);
}

function normalizeWords(value) {
  const normalized = value.normalize("NFKD").trim().toLowerCase();
  return normalized ? normalized.split(/\s+/) : [];
}

function updateCount() {
  const count = normalizeWords(wordsInput.value).length;
  countLabel.textContent = `${count} word${count === 1 ? "" : "s"} · enter 11, 12, 23, or 24`;
}

function validate(words) {
  if (![11, 12, 23, 24].includes(words.length)) {
    return `Enter 11 or 23 words to find an ending, or 12 or 24 words to verify one. There ${words.length === 1 ? "is" : "are"} currently ${words.length}.`;
  }

  const prefixLength = words.length <= 12 ? 11 : 23;
  // A bad final entry is still replaceable. Only the entropy-bearing prefix
  // must be valid before replacement candidates can be calculated.
  const invalid = [...new Set(words.slice(0, prefixLength).filter((word) => !wordToIndex.has(word)))];
  if (invalid.length) {
    return `Not in the English BIP39 list: ${invalid.join(", ")}`;
  }

  return "";
}

function indicesToEntropy(indices) {
  const bits = indices.map((index) => index.toString(2).padStart(11, "0")).join("");
  const checksumLength = bits.length / 33;
  const entropyLength = bits.length - checksumLength;
  const entropy = new Uint8Array(entropyLength / 8);
  for (let i = 0; i < entropy.length; i += 1) {
    entropy[i] = Number.parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return { entropy, checksum: Number.parseInt(bits.slice(entropyLength), 2), checksumLength };
}

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

// Small synchronous SHA-256 implementation keeps file:// usage independent of
// secure-context rules around Web Crypto. Input and output are byte arrays.
function sha256(message) {
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bitLength = message.length * 8;
  const paddedLength = Math.ceil((message.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  for (let offset = 0; offset < padded.length; offset += 64) {
    const schedule = new Uint32Array(64);
    for (let i = 0; i < 16; i += 1) schedule[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const x = schedule[i - 15];
      const y = schedule[i - 2];
      const s0 = rightRotate(x, 7) ^ rightRotate(x, 18) ^ (x >>> 3);
      const s1 = rightRotate(y, 17) ^ rightRotate(y, 19) ^ (y >>> 10);
      schedule[i] = (schedule[i - 16] + s0 + schedule[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + constants[i] + schedule[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    hash[0] = (hash[0] + a) >>> 0; hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0; hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0; hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0; hash[7] = (hash[7] + h) >>> 0;
  }

  const output = new Uint8Array(32);
  const outputView = new DataView(output.buffer);
  hash.forEach((value, index) => outputView.setUint32(index * 4, value, false));
  return output;
}

function findValidFinalWords(words) {
  const firstIndices = words.map((word) => wordToIndex.get(word));
  const valid = [];
  for (let candidate = 0; candidate < BIP39_ENGLISH_WORDS.length; candidate += 1) {
    const { entropy, checksum, checksumLength } = indicesToEntropy([...firstIndices, candidate]);
    const expectedChecksum = sha256(entropy)[0] >>> (8 - checksumLength);
    if (expectedChecksum === checksum) valid.push(BIP39_ENGLISH_WORDS[candidate]);
  }
  return valid;
}

async function copyPhrase(phrase, button) {
  try {
    await navigator.clipboard.writeText(phrase);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = phrase;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  button.textContent = "Copied";
  window.setTimeout(() => { button.textContent = "Copy phrase"; }, 1300);
}

function renderResults(prefix, validWords, suppliedFinalWord = "") {
  results.replaceChildren();
  const suppliedIsValid = suppliedFinalWord && validWords.includes(suppliedFinalWord);
  const checksumLength = (prefix.length + 1) / 3;
  let entropyPreservingWord = "";
  if (suppliedFinalWord && wordToIndex.has(suppliedFinalWord)) {
    const entropyPart = wordToIndex.get(suppliedFinalWord) >>> checksumLength;
    entropyPreservingWord = validWords.find((word) => (wordToIndex.get(word) >>> checksumLength) === entropyPart) || "";
  }
  const orderedWords = entropyPreservingWord
    ? [entropyPreservingWord, ...validWords.filter((word) => word !== entropyPreservingWord)]
    : validWords;
  resultsTitle.textContent = suppliedFinalWord
    ? (suppliedIsValid ? "Your 24th word is valid" : "Your 24th word is invalid")
    : "Valid checksum words";
  resultsDescription.textContent = suppliedFinalWord
    ? (suppliedIsValid
        ? `“${suppliedFinalWord}” has the correct checksum. The words below are all valid endings for the same first ${prefix.length}.`
        : entropyPreservingWord
          ? `“${entropyPreservingWord}” is the checksum correction that preserves the entropy portion of your dice-picked final word. Other options change those remaining entropy bits.`
          : `Replace “${suppliedFinalWord}” with an option below; the first ${prefix.length} words stay unchanged.`)
    : `Use an unbiased random method to choose one of these for word ${prefix.length + 1}; that choice supplies the remaining ${11 - checksumLength} entropy bits.`;
  for (const word of orderedWords) {
    const card = document.createElement("div");
    card.className = "result";
    const wordWrap = document.createElement("span");
    wordWrap.className = "word-wrap";
    const label = document.createElement("span");
    label.className = "word";
    label.textContent = word;
    wordWrap.append(label);
    if (word === entropyPreservingWord) {
      const note = document.createElement("span");
      note.className = "recommended";
      note.textContent = suppliedIsValid ? "Current word" : "Preserves dice entropy";
      wordWrap.append(note);
    }
    const copy = document.createElement("button");
    copy.className = "copy";
    copy.type = "button";
    copy.textContent = "Copy phrase";
    copy.addEventListener("click", () => copyPhrase(`${prefix.join(" ")} ${word}`, copy));
    card.append(wordWrap, copy);
    results.append(card);
  }
  resultsPanel.classList.add("visible");
}

function run() {
  const words = normalizeWords(wordsInput.value);
  const error = validate(words);
  wordsInput.setAttribute("aria-invalid", String(Boolean(error)));
  resultsPanel.classList.remove("visible");
  results.replaceChildren();

  if (error) {
    status.className = "status error";
    status.textContent = error;
    return;
  }

  const prefixLength = words.length <= 12 ? 11 : 23;
  const prefix = words.slice(0, prefixLength);
  const suppliedFinalWord = words[prefixLength] || "";
  const validWords = findValidFinalWords(prefix);
  renderResults(prefix, validWords, suppliedFinalWord);
  status.className = "status";
  if (!suppliedFinalWord) {
    status.textContent = `Found ${validWords.length} valid final words.`;
  } else if (validWords.includes(suppliedFinalWord)) {
    status.textContent = `Valid checksum: “${suppliedFinalWord}” can be used as word ${prefixLength + 1}.`;
  } else {
    status.className = "status error";
    status.textContent = `Invalid checksum: choose one of the ${validWords.length} replacements below.`;
  }
}

wordsInput.addEventListener("input", updateCount);
document.querySelector("#find").addEventListener("click", run);
function loadExample(words) {
  wordsInput.value = words;
  updateCount();
  run();
}

document.querySelector("#sample-12").addEventListener("click", () => loadExample(example11Words));
document.querySelector("#sample-24").addEventListener("click", () => loadExample(example23Words));
document.querySelector("#clear").addEventListener("click", () => {
  wordsInput.value = "";
  updateCount();
  status.textContent = "";
  status.className = "status";
  wordsInput.removeAttribute("aria-invalid");
  resultsPanel.classList.remove("visible");
  results.replaceChildren();
  wordsInput.focus();
});

renderWordList();
updateCount();
