const assert = require("node:assert/strict");
const test = require("node:test");

const { loadScript, defaultOptions } = require("./helper");

const api = loadScript();
const NL = String.fromCharCode(10);

test("サイト別のルールが、そのサイトでだけ効く", () => {
  const cases = [
    ["https://www.youtube.com/watch?v=abc&si=XYZ&feature=share", "https://www.youtube.com/watch?v=abc"],
    ["https://x.com/user/status/1?t=aa&s=20", "https://x.com/user/status/1"],
    ["https://www.instagram.com/p/abc/?igshid=zzz", "https://www.instagram.com/p/abc"],
    ["https://open.spotify.com/track/abc?si=qqq", "https://open.spotify.com/track/abc"],
    ["https://www.tiktok.com/@a/video/1?is_from_webapp=1&sender_device=pc", "https://www.tiktok.com/@a/video/1"]
  ];
  for (const [input, expected] of cases) {
    assert.equal(api.cleanOne(input, defaultOptions).cleaned, expected, input);
  }

  // 同じ名前でも、別のサイトでは残す
  const other = api.cleanOne("https://example.com/?t=42&si=keep", defaultOptions);
  assert.equal(other.cleaned, "https://example.com/?t=42&si=keep");
});

test("意味のあるパラメーターは残す", () => {
  // YouTubeの再生位置は消さない
  const youtube = api.cleanOne("https://www.youtube.com/watch?v=abc&t=42&si=XYZ", defaultOptions);
  assert.match(youtube.cleaned, /t=42/);
  assert.doesNotMatch(youtube.cleaned, /si=/);

  // 検索語や記事IDも消さない
  const generic = api.cleanOne("https://example.com/search?q=cat&page=2&utm_source=x", defaultOptions);
  assert.equal(generic.cleaned, "https://example.com/search?q=cat&page=2");
});

test("フラグメントに紛れた追跡用の値を落とす", () => {
  const withUtm = api.cleanOne("https://example.com/doc#utm_source=news&section=3", defaultOptions);
  assert.equal(withUtm.cleaned, "https://example.com/doc#section=3");
  assert.ok(withUtm.removed.some((r) => r.where === "fragment" && r.name === "utm_source"));

  const textFragment = api.cleanOne("https://example.com/doc#:~:text=secret", defaultOptions);
  assert.equal(textFragment.cleaned, "https://example.com/doc");

  // ふつうのアンカーは残す
  const anchor = api.cleanOne("https://example.com/doc#chapter-2", defaultOptions);
  assert.equal(anchor.cleaned, "https://example.com/doc#chapter-2");
});

test("消したものに、名前と説明の対応が付く", () => {
  const result = api.cleanOne("https://example.com/?utm_source=a&fbclid=b&gclid=c", defaultOptions);
  assert.equal(result.removed.length, 3);
  const byName = Object.fromEntries(result.removed.map((r) => [r.name, r.noteKey]));
  assert.equal(byName.utm_source, "note.utm");
  assert.equal(byName.fbclid, "note.fbclid");
  assert.equal(byName.gclid, "note.gclid");
  for (const item of result.removed) {
    assert.equal(item.where, "query");
    assert.ok(item.noteKey.startsWith("note."));
  }
});

test("貼る前に見ておきたい点を挙げる", () => {
  const expectations = [
    ["https://www.google.com@evil.example/login", "userinfo"],
    ["https://xn--80ak6aa92e.com/", "punycode"],
    ["https://example.com:8443/admin", "port"],
    ["http://example.com/page", "plainHttp"],
    ["https://bit.ly/3abcDEF", "shortener"],
    ["https://example.com/go?url=https://evil.example/phish", "openRedirect"]
  ];
  for (const [input, id] of expectations) {
    const result = api.cleanOne(input, defaultOptions);
    assert.ok(result.risks.some((r) => r.id === id), `${input} で ${id} を挙げていない`);
  }
});

test("ふつうのURLには注意書きを出さない", () => {
  for (const input of ["https://example.com/", "https://example.com/a/b?q=1", "https://example.com/?url=notaurl"]) {
    const result = api.cleanOne(input, defaultOptions);
    assert.equal(result.risks.length, 0, `${input} に余計な注意書きが出ている: ${JSON.stringify(result.risks)}`);
  }
});

test("まとめて処理したときも、内訳と注意書きが集まる", () => {
  const input = [
    "https://example.com/?utm_source=a",
    "http://bit.ly/xyz",
    "https://x.com/u/status/1?t=b"
  ].join(NL);

  const batch = api.cleanBatch(input, defaultOptions);
  assert.equal(batch.removed.length, 2);
  const ids = batch.risks.map((r) => r.id);
  assert.ok(ids.includes("shortener"));
  assert.ok(ids.includes("plainHttp"));
});

test("内訳と注意書きに使うキーが、辞書にそろっている", () => {
  const { read, loadMessages } = require("./helper");
  const source = read("script.js");
  const { MESSAGES } = loadMessages();

  // script.js が参照する note.* が、日英の辞書にある
  const noteKeys = new Set([...source.matchAll(/"(note\.[a-zA-Z]+)"/g)].map((m) => m[1]));
  assert.ok(noteKeys.size > 15);
  for (const key of noteKeys) {
    for (const lang of ["ja", "en"]) {
      assert.ok(MESSAGES[lang][key], `${lang} に ${key} がない`);
    }
  }

  // 危険サインの id ごとに label と body がある
  const riskIds = new Set([...source.matchAll(/id: "([a-zA-Z]+)", detail/g)].map((m) => m[1]));
  assert.ok(riskIds.size >= 5);
  for (const id of riskIds) {
    for (const lang of ["ja", "en"]) {
      assert.ok(MESSAGES[lang][`risk.${id}.label`], `${lang} に risk.${id}.label がない`);
      assert.ok(MESSAGES[lang][`risk.${id}.body`], `${lang} に risk.${id}.body がない`);
    }
  }
});
