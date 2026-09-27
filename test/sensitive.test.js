const assert = require("node:assert/strict");
const test = require("node:test");

const { loadScript, defaultOptions } = require("./helper");

const api = loadScript();
const risksOf = (url) => api.cleanOne(url, defaultOptions).risks;
const idsOf = (url) => risksOf(url).map((r) => r.id);

test("共有前に外したい名前のパラメーターを挙げる", () => {
  for (const name of ["email", "token", "access_token", "apikey", "password", "session", "sig", "otp"]) {
    assert.ok(idsOf(`https://example.com/?${name}=x`).includes("sensitiveName"), `${name} を挙げていない`);
  }
});

test("値そのものが見られると困る形なら挙げる", () => {
  const cases = [
    ["https://example.com/?contact=taro@example.com", "email"],
    ["https://example.com/?t=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc", "jwt"],
    ["https://example.com/?ref_id=abcdefghijklmnopqrstuvwxyz0123456789", "longRandom"]
  ];
  for (const [url, kind] of cases) {
    const risk = risksOf(url).find((r) => r.id === "sensitiveValue");
    assert.ok(risk, `${url} を挙げていない`);
    assert.equal(risk.kind, kind);
  }
});

test("ふつうのパラメーターは挙げない", () => {
  for (const url of [
    "https://example.com/?q=cat&page=2",
    "https://example.com/?id=7",
    "https://example.com/?sort=desc&view=list"
  ]) {
    assert.deepEqual(risksOf(url), [], `${url} に余計な指摘が出ている`);
  }
});

test("消さずに指摘だけをする", () => {
  // 消すとリンクが動かなくなるので、出力からは落とさない
  const result = api.cleanOne("https://example.com/?token=abc&utm_source=x", defaultOptions);
  assert.equal(result.cleaned, "https://example.com/?token=abc");
  assert.ok(result.risks.some((r) => r.id === "sensitiveName"));
});

test("連れているURLの行き先を取り出す", () => {
  const cases = [
    ["https://example.com/go?url=https%3A%2F%2Fevil.example%2Fx", "evil.example"],
    ["https://example.com/go?next=//evil.example/x", "evil.example"],
    ["https://example.com/go?redirect_uri=https://evil.example/", "evil.example"]
  ];
  for (const [url, host] of cases) {
    const risk = risksOf(url).find((r) => r.id === "openRedirect");
    assert.ok(risk, `${url} を挙げていない`);
    assert.match(risk.detail, new RegExp(host), `行き先を見せていない: ${risk.detail}`);
  }
});

test("行き先自体の問題も1段だけ見る", () => {
  // 行き先が、ラテン文字に見せかけたホスト名
  const lookalike = risksOf("https://example.com/go?url=https%3A%2F%2Fxn--80ak6aa92e.com%2F")
    .find((r) => r.id === "openRedirect");
  assert.ok(lookalike.targetNotes.includes("lookalike"));
  assert.match(lookalike.detail, /аррӏе\.com/, "読める形で見せていない");

  // 行き先が http のまま
  const plain = risksOf("https://example.com/go?url=http%3A%2F%2Fexample.org%2F")
    .find((r) => r.id === "openRedirect");
  assert.ok(plain.targetNotes.includes("plainHttp"));
});

test("行き先がURLでなければ、連れているとは言わない", () => {
  for (const url of [
    "https://example.com/go?url=notaurl",
    "https://example.com/go?url=/local/path",
    "https://example.com/go?url=javascript:alert(1)"
  ]) {
    assert.ok(!idsOf(url).includes("openRedirect"), `${url} を誤って挙げている`);
  }
});
