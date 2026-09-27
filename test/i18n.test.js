const assert = require("node:assert/strict");
const test = require("node:test");

const { read, loadMessages } = require("./helper");

const { MESSAGES } = loadMessages();
const source = read("i18n.js");
const html = read("index.html");
const script = read("script.js");
const NL = String.fromCharCode(10);
const JAPANESE = /[぀-ヿ一-鿿]/;

// 引用符の外にある // から後ろだけを落とす
function stripTrailingComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "/" && line[i + 1] === "/") return line.slice(0, i);
  }
  return line;
}

test("日本語と英語のキーが一致し、空の値がない", () => {
  const ja = Object.keys(MESSAGES.ja).sort();
  const en = Object.keys(MESSAGES.en).sort();
  assert.deepEqual(en, ja, "キーの集合が違う");
  assert.ok(ja.length > 80, "キーが少なすぎる");

  for (const language of ["ja", "en"]) {
    for (const [key, value] of Object.entries(MESSAGES[language])) {
      assert.equal(typeof value, "string", `${language}.${key} が文字列でない`);
      assert.notEqual(value.trim(), "", `${language}.${key} が空`);
    }
  }
});

test("英語の辞書に日本語が残っていない", () => {
  // 言語切り替えボタンだけは、切り替え先の言語の表記で出す
  const allowed = new Set(["lang.toggle"]);
  for (const [key, value] of Object.entries(MESSAGES.en)) {
    if (allowed.has(key)) continue;
    assert.doesNotMatch(value, JAPANESE, `en.${key} に日本語が残っている: ${value}`);
  }
});

test("差し込みの名前が日英でそろっている", () => {
  const names = (text) => (text.match(/\{[a-zA-Z]+\}/g) || []).sort().join(",");
  for (const key of Object.keys(MESSAGES.ja)) {
    assert.equal(names(MESSAGES.en[key]), names(MESSAGES.ja[key]), `${key} の差し込みが食い違う`);
  }
});

test("画面の文言を script.js へ直接書かない", () => {
  script.split(NL).forEach((line, index) => {
    const trimmed = line.trim();
    // コメント行（// と /* と * の続き）は対象外
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
    assert.doesNotMatch(stripTrailingComment(line), JAPANESE, `script.js:${index + 1} に画面文言が直書きされている`);
  });
});

test("index.htmlの表示文字は辞書と結びついている", () => {
  const keys = [...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length >= 30, "data-i18nが少なすぎる");
  for (const key of keys) {
    assert.ok(MESSAGES.ja[key], `辞書にない: ${key}`);
  }
  for (const attr of [...html.matchAll(/data-i18n-attr="([^"]+)"/g)].map((m) => m[1])) {
    for (const pair of attr.split(",")) {
      const key = pair.split(":")[1].trim();
      assert.ok(MESSAGES.ja[key], `辞書にない属性キー: ${key}`);
    }
  }
});

test("script.jsが呼ぶキーが辞書にある", () => {
  for (const match of script.matchAll(/uiText\("([a-zA-Z][\w.]*)"/g)) {
    assert.ok(MESSAGES.ja[match[1]], `辞書にないキー: ${match[1]}`);
  }
});

test("言語の決め方と、保存できない環境の扱い", () => {
  const detect = source.slice(source.indexOf("detectLanguage()"), source.indexOf("  readSaved() {"));
  assert.ok(detect.indexOf("searchParams") < detect.indexOf("readSaved"), "?langを先に見ていない");
  assert.ok(detect.indexOf("readSaved") < detect.indexOf("navigator.language"), "保存値をブラウザー言語より後に見ている");

  for (const method of ["  readSaved() {", "  writeSaved(language) {"]) {
    const section = source.slice(source.indexOf(method), source.indexOf(method) + 400);
    assert.match(section, /try \{/, `${method} が例外を処理していない`);
    assert.match(section, /catch \(e\)/, `${method} が例外を処理していない`);
  }
});

test("言語を切り替えても入力と結果を失わない", () => {
  const setLanguage = source.slice(source.indexOf("setLanguage(language)"), source.indexOf("restoreCarriedState()"));
  assert.match(setLanguage, /inputUrls/);
  assert.match(setLanguage, /outputUrls/);
  // 持ち越しはStorageを使わない（このツールは「保存しない」と言っている）
  assert.doesNotMatch(setLanguage, /sessionStorage\.setItem/);
  assert.match(setLanguage, /window\.name = JSON\.stringify/);
});
