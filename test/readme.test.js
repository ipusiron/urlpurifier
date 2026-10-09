const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadScript, defaultOptions } = require("./helper");

test("ユースケースの「このツールならではの使い方」を script.js で再計算（日英）", () => {
  const root = path.join(__dirname, "..");
  const ja = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const en = fs.readFileSync(path.join(root, "README.en.md"), "utf8");
  const S = loadScript("ja");
  const tracking = S.cleanOne("https://example.com/p?id=1&utm_source=x&utm_medium=y&fbclid=z&gclid=w", defaultOptions);
  assert.equal(tracking.cleaned, "https://example.com/p?id=1");
  assert.deepEqual(tracking.removed.map((r) => r.name), ["utm_source", "utm_medium", "fbclid", "gclid"]);
  const js = S.cleanOne("javascript://alert(1)", defaultOptions);
  assert.equal(js.error, "scheme");
  const amazon = S.cleanOne("https://www.amazon.co.jp/gp/product/B08XYZ1234/ref=sr_1_1?keywords=abc", { amazonMode: true, strongBlocklist: false });
  assert.equal(amazon.cleaned, "https://www.amazon.co.jp/dp/B08XYZ1234");
  for (const md of [ja, en]) {
    assert.ok(md.includes("https://example.com/p?id=1"));
    assert.ok(md.includes("javascript://alert(1)") && md.includes("B08XYZ1234"));
  }
});
