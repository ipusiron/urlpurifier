const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const NL = String.fromCharCode(10);
const ja = read("README.md");
const en = read("README.en.md");

test("READMEのYAMLはハブが読む値を保っている", () => {
  const block = ja.slice(ja.indexOf("<!--"), ja.indexOf("-->"));
  const expected = {
    "id:": "day039",
    "slug:": "urlpurifier",
    "repo_url:": '"https://github.com/ipusiron/urlpurifier"',
    "demo_url:": '"https://ipusiron.github.io/urlpurifier/"',
    "hub:": "true"
  };
  for (const [key, value] of Object.entries(expected)) {
    const line = block.split(NL).find((l) => l.trim().startsWith(key));
    assert.ok(line, `${key} がない`);
    assert.equal(line.trim().slice(key.length).trim(), value, `${key} の値が変わっている`);
  }
});

test("日本語と英語のREADMEは見出しの数・順・階層がそろっている", () => {
  const levels = (text) =>
    text
      .split(NL)
      .filter((line) => /^#{1,6} /.test(line))
      .map((line) => line.match(/^#+/)[0].length);
  assert.deepEqual(levels(en), levels(ja), "見出しの階層が食い違う");
  assert.ok(levels(ja).length >= 12, "見出しが少なすぎる");
});

test("READMEは相手の言語へのリンクを先頭に置く", () => {
  assert.match(ja.slice(ja.indexOf("# URLPurifier")), /^#[^\n]*\n\n\[English\]\(README\.en\.md\) · 日本語/);
  assert.match(en, /^# [^\n]*\n\nEnglish · \[日本語\]\(README\.md\)/);
});

test("READMEが指すスクリーンショットが実在する", () => {
  for (const text of [ja, en]) {
    const images = [...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]).filter((p) => !p.startsWith("http"));
    assert.ok(images.length >= 2, "スクリーンショットの参照が足りない");
    for (const image of images) {
      assert.ok(fs.existsSync(path.join(root, image)), `見つからない: ${image}`);
    }
  }
});

test("ディレクトリー構成は実在するファイルをすべて挙げている", () => {
  const listed = new Set();
  // 「ディレクトリー構成」の直後のコードブロックを見る。
  // リポジトリーのURLにも同じ文字列が出てくるので、見出しを起点にする。
  const headingAt = ja.indexOf("## 📂 ディレクトリー構成");
  assert.ok(headingAt > 0, "ディレクトリー構成の見出しがない");
  const fenceAt = ja.indexOf("```", headingAt);
  const block = ja.slice(fenceAt, ja.indexOf("```", fenceAt + 3));
  for (const line of block.split(NL)) {
    // json を js より先に置く。逆だと package.json が package.js と読める
    const match = line.match(/([A-Za-z0-9_.-]+\.(?:html|css|json|js|md|png|yml))\b/);
    if (match) listed.add(match[1]);
  }

  const walk = (dir, prefix = "") => {
    const found = [];
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) found.push(...walk(path.join(dir, entry.name), rel));
      else found.push(rel);
    }
    return found;
  };

  for (const file of walk(".")) {
    if (file === "LICENSE" || file.startsWith("node_modules")) continue;
    const base = path.basename(file);
    assert.ok(listed.has(base), `ディレクトリー構成に載っていない: ${file}`);
  }
});

test("READMEに書いたテスト件数が実際と合う", () => {
  // test/ 配下の test( 呼び出しを数える
  const dir = path.join(root, "test");
  let actual = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".test.js")) continue;
    actual += (fs.readFileSync(path.join(dir, name), "utf8").match(/^test\(/gm) || []).length;
  }
  assert.match(ja, new RegExp(`${actual}件のテスト`), `README.md の件数が違う（実際は${actual}件）`);
  assert.match(en, new RegExp(`${actual} tests check`), `README.en.md の件数が違う（実際は${actual}件）`);
});
