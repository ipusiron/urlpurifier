const assert = require("node:assert/strict");
const test = require("node:test");

const { loadScript, read } = require("./helper");

const api = loadScript();
const script = read("script.js");
const html = read("index.html");

test("自分で足した名前も落とす", () => {
  const opts = { amazonMode: false, strongBlocklist: false, customParams: ["cid", "from"] };
  const result = api.cleanOne("https://example.com/?cid=9&from=mail&keep=1", opts);
  assert.equal(result.cleaned, "https://example.com/?keep=1");
  assert.equal(result.removed.length, 2);
  for (const item of result.removed) {
    assert.equal(item.noteKey, "note.custom", "自分で指定した名前だと示していない");
  }
});

test("自分で足した名前は、大文字小文字を問わない", () => {
  const opts = { amazonMode: false, strongBlocklist: false, customParams: ["CID"] };
  assert.equal(api.cleanOne("https://example.com/?cid=9&a=1", opts).cleaned, "https://example.com/?a=1");
});

test("指定がなければ、これまでどおり動く", () => {
  const opts = { amazonMode: false, strongBlocklist: false, customParams: [] };
  assert.equal(api.cleanOne("https://example.com/?cid=9", opts).cleaned, "https://example.com/?cid=9");
});

test("自分で足した名前は、この端末にだけ保存する", () => {
  // 保存できない環境でも、その場の指定は効く
  const section = script.slice(script.indexOf("const readCustom"), script.indexOf("customParamList"));
  assert.match(section, /try \{[\s\S]*?localStorage\.getItem[\s\S]*?\} catch/);
  assert.match(section, /try \{[\s\S]*?localStorage\.setItem[\s\S]*?\} catch/);
  // 入力欄にはラベルがある
  assert.match(html, /<label[^>]*for="customParams"/);
});

test("URLの部品を分けて出す", () => {
  const rows = api.buildStructureRows(new URL("https://user@xn--wgv71a119e.jp:8443/a/b?q=cat#sec"));
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));

  assert.equal(byKey.scheme.value, "https");
  assert.equal(byKey.userinfo.value, "user");
  assert.ok(byKey.userinfo.warn, "利用者名を目立たせていない");
  // ホスト名は読める形で出し、符号化された形も添える
  assert.equal(byKey.host.value, "日本語.jp");
  assert.equal(byKey.host.note, "xn--wgv71a119e.jp");
  assert.equal(byKey.port.value, "8443");
  assert.ok(byKey.port.warn, "ふつうと違うポートを目立たせていない");
  assert.equal(byKey.path.value, "/a/b");
  assert.equal(byKey.query.name, "q");
  assert.equal(byKey.fragment.value, "sec");
});

test("見せかけのホスト名は、部品の表でも目立たせる", () => {
  const rows = api.buildStructureRows(new URL("https://xn--80ak6aa92e.com/"));
  const host = rows.find((r) => r.key === "host");
  assert.equal(host.value, "аррӏе.com");
  assert.ok(host.warn);
});

test("ふつうのURLでは、どの部品も目立たせない", () => {
  const rows = api.buildStructureRows(new URL("https://example.com/a?b=1"));
  assert.ok(rows.every((r) => !r.warn), "余計に目立たせている");
});

test("部品の表は、1本だけ処理したときに出す", () => {
  // 複数行だと、どのURLの話かがわからなくなる
  const section = script.slice(script.indexOf("function updateStructureReport"), script.indexOf("function updateStructureReport") + 700);
  assert.match(section, /usable\.length !== 1/);
  assert.match(section, /panel\.hidden = true;/);
});
