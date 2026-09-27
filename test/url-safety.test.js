const assert = require("node:assert/strict");
const test = require("node:test");

const { loadScript, defaultOptions } = require("./helper");

const api = loadScript();

test("http と https 以外のスキームは出力しない", () => {
  const dangerous = [
    "javascript://alert(1)",
    "javascript:alert(1)",
    "javascript://comment%0aalert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "data://text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com/file.txt",
    "blob:https://example.com/abc"
  ];

  for (const input of dangerous) {
    const result = api.cleanOne(input, defaultOptions);
    assert.equal(result.error, "scheme", `${input} を拒否していない`);
    assert.equal(result.cleaned, "", `${input} の出力が空でない`);
  }
});

test("URLとして読めない文字列から、実在しないURLを作らない", () => {
  for (const input of ["hello world", "not a url at all", "これはURLではありません", "12345", "user@example"]) {
    const result = api.cleanOne(input, defaultOptions);
    assert.equal(result.error, "notUrl", `${input} を通している`);
    assert.doesNotMatch(result.cleaned, /^https?:/, `${input} から偽のURLを作っている`);
  }
});

test("正しいURLはこれまでどおり浄化される", () => {
  const cases = [
    ["https://example.com/path/?utm_source=x&utm_medium=y&id=1", "https://example.com/path/?id=1"],
    ["example.com/page?fbclid=abc", "https://example.com/page"],
    ["https://example.com/foo/", "https://example.com/foo"],
    ["http://example.com/?gclid=1&q=2", "http://example.com/?q=2"]
  ];
  for (const [input, expected] of cases) {
    const result = api.cleanOne(input, defaultOptions);
    assert.equal(result.error, null, `${input} でエラーになった`);
    assert.equal(result.cleaned, expected);
  }
});

test("ホスト判定は末尾までアンカーされている", () => {
  assert.ok(api.looksLikeHost("example.com"));
  assert.ok(api.looksLikeHost("sub.example.co.jp/path?a=1"));
  assert.ok(api.looksLikeHost("example.com:8080/x"));
  assert.ok(!api.looksLikeHost("hello world"));
  assert.ok(!api.looksLikeHost("example"));
  assert.ok(!api.looksLikeHost("a.b"), "TLDが1文字のものを通している");
});

test("パラメーターの数え方に URLSearchParams.size を使わない", () => {
  // size は2023年追加で、古い環境では undefined になり統計が NaN になる。
  // 手元のChromiumでは再現しなかったが、数え方は互換のある形にそろえる。
  const { read } = require("./helper");
  assert.doesNotMatch(read("script.js"), /searchParams\.size/);
});

test("対象外の行は # で始め、URLと取り違えないようにする", () => {
  const result = api.cleanOne("javascript://alert(1)", defaultOptions);
  const line = api.formatOutputLine(result);
  assert.match(line, /^# /);
  assert.doesNotMatch(line, /^javascript:/);
});

test("複数行のうち1行が対象外でも、残りは浄化される", () => {
  const input = [
    "https://example.com/?utm_source=a",
    "javascript://alert(1)",
    "example.org/?fbclid=b"
  ].join(String.fromCharCode(10));

  const batch = api.cleanBatch(input, defaultOptions);
  assert.equal(batch.results.length, 3);
  assert.equal(batch.results[0].cleaned, "https://example.com/");
  assert.equal(batch.results[1].error, "scheme");
  assert.equal(batch.results[2].cleaned, "https://example.org/");
  assert.equal(batch.stats.totalErrors, 1);
});
