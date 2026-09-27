const assert = require("node:assert/strict");
const test = require("node:test");

const { loadScript, defaultOptions } = require("./helper");

const api = loadScript();

test("punycodeを読める文字へ戻す", () => {
  const cases = [
    ["xn--wgv71a119e.jp", "日本語.jp"],
    ["xn--r8jz45g.xn--zckzah", "例え.テスト"],
    ["xn--mnchen-3ya.de", "münchen.de"],
    ["xn--e1afmkfd.xn--p1ai", "пример.рф"],
    ["example.com", "example.com"]
  ];
  for (const [input, expected] of cases) {
    assert.equal(api.decodeHostname(input), expected, input);
  }
  // 壊れたラベルは、そのまま残して落ちない
  assert.equal(api.decodeHostname("xn--@@@.com"), "xn--@@@.com");
});

test("正当な国際化ドメインを危険扱いしない", () => {
  for (const input of ["https://日本語.jp/", "https://例え.テスト/", "https://münchen.de/", "https://пример.рф/"]) {
    const result = api.cleanOne(input, defaultOptions);
    assert.ok(!result.risks.some((r) => r.id === "lookalike"), `${input} を誤って指摘している`);
  }
});

test("ラテン文字に見せかけたホスト名を指摘する", () => {
  // аррӏе.com（全部キリル文字）と аpple.com（1文字だけキリル）
  for (const input of ["https://xn--80ak6aa92e.com/", "https://xn--pple-43d.com/"]) {
    const result = api.cleanOne(input, defaultOptions);
    const risk = result.risks.find((r) => r.id === "lookalike");
    assert.ok(risk, `${input} を指摘していない`);
    // 指摘には、読める形を添える
    assert.doesNotMatch(risk.detail, /^xn--/, "punycodeのまま見せている");
  }
});

test("読める文字で入力したホスト名は、その形で返す", () => {
  // new URL() は punycode へ正規化するので、戻さないと見た目が変わる
  assert.equal(api.cleanOne("https://日本語.jp/?utm_source=x", defaultOptions).cleaned, "https://日本語.jp/");
  assert.equal(api.cleanOne("https://münchen.de/x", defaultOptions).cleaned, "https://münchen.de/x");
  // punycodeで入力したものは、punycodeのまま返す
  assert.equal(api.cleanOne("https://xn--wgv71a119e.jp/", defaultOptions).cleaned, "https://xn--wgv71a119e.jp/");
});

test("ポートが付いていても、ホスト名を戻せる", () => {
  assert.equal(api.cleanOne("https://日本語.jp:8443/x", defaultOptions).cleaned, "https://日本語.jp:8443/x");
});
