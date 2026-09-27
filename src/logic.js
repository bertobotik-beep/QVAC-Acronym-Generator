// QVAC Acronym Generator — core logic.
//
// Acronym letters are computed and VALIDATED deterministically in code
// (each candidate must be a true in-order subsequence of the phrase's own
// first letters), so the small model can never hallucinate letters that
// don't actually come from the phrase. The model is only used to suggest
// which subsets of words make the catchiest acronym.

import { completion } from "@qvac/sdk";

const STOPWORDS = new Set([
  "a", "an", "the", "of", "for", "and", "or", "in", "to", "on", "with",
  "at", "by", "from", "your", "our", "my",
]);

function splitWords(phrase) {
  return phrase
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0);
}

function firstLetters(words) {
  return words.map((w) => w[0].toUpperCase()).join("");
}

function isValidCandidate(candidate, fullLetters) {
  const c = (candidate || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length < 2 || c.length > fullLetters.length) return false;
  const f = fullLetters.toUpperCase();
  let i = 0;
  for (const ch of f) {
    if (i < c.length && ch === c[i]) i++;
  }
  return i === c.length;
}

// Deterministic candidate list, always grounded in the actual words.
function deterministicCandidates(words) {
  const out = [];
  const full = firstLetters(words);
  out.push(full);

  const meaningful = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  if (meaningful.length >= 2) {
    const noStop = firstLetters(meaningful);
    if (noStop !== full) out.push(noStop);
  }

  if (words.length >= 3) {
    out.push(firstLetters(words.slice(1))); // drop first word
    out.push(firstLetters(words.slice(0, -1))); // drop last word
  }

  const longWords = words.filter((w) => w.length >= 4);
  if (longWords.length >= 2) {
    const longOnly = firstLetters(longWords);
    if (longOnly !== full) out.push(longOnly);
  }

  return [...new Set(out.map((c) => c.toUpperCase()))].filter((c) => c.length >= 2);
}

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i am not able"];
  return bad.some((phrase) => text.toLowerCase().includes(phrase));
}

export async function generateAcronyms(modelId, phrase) {
  const words = splitWords(phrase);
  if (words.length === 0) {
    return { phrase, acronyms: [] };
  }
  const fullLetters = firstLetters(words);
  const wordList = words.join(", ");

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You build acronyms from a phrase's words. Given the phrase's words in order, " +
          "suggest 2-3 catchy acronyms using ONLY the first letters of those words, kept in " +
          "the same left-to-right order. You may skip minor words like 'a', 'the', 'of', 'and' " +
          "to make a more pronounceable result, but never invent a letter that isn't the first " +
          "letter of one of the given words. Reply with ONLY the acronyms, one per line, all " +
          "caps, no explanation.",
      },
      { role: "user", content: "Words in order: Quick, Value, Add, Checker" },
      { role: "assistant", content: "QVAC\nQAC\nVAC" },
      { role: "user", content: `Words in order: ${wordList}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.6, maxTokens: 60 },
  });

  let raw = "";
  for await (const token of run.tokenStream) raw += token;

  const modelCandidates = looksUnusable(raw)
    ? []
    : raw
        .split(/[\n,]/)
        .map((line) => line.trim().replace(/^[-*\d.)\s]+/, "").toUpperCase())
        .filter((c) => c.length > 0);

  // Ground every model suggestion against the phrase's real letters; discard
  // anything that isn't an actual in-order subsequence (no hallucinated
  // letters), then fill out with deterministic, guaranteed-valid candidates.
  const validated = modelCandidates.filter((c) => isValidCandidate(c, fullLetters));
  const deterministic = deterministicCandidates(words);

  const merged = [...new Set([...validated, ...deterministic])].filter((c) =>
    isValidCandidate(c, fullLetters)
  );

  const acronyms = merged.slice(0, 5);

  return { phrase, words, acronyms };
}
