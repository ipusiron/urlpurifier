const assert = require("node:assert/strict");
const test = require("node:test");
const vm = require("node:vm");

const { read } = require("./helper");

// theme-init.js を、保存値と OS 設定を差し替えた仮の window で動かし、data-theme の値を返す。
function run({ saved = null, prefersDark = false, storageThrows = false } = {}) {
  const attrs = {};
  const window = {
    localStorage: { getItem: () => { if (storageThrows) throw new Error("blocked"); return saved; } },
    matchMedia: () => ({ matches: prefersDark }),
    document: { documentElement: { setAttribute: (name, value) => { attrs[name] = value; } } }
  };
  vm.runInNewContext(read("theme-init.js"), { window });
  return attrs["data-theme"] || null;
}

test("保存値がなければ OS の設定によらずダークのまま", () => {
  assert.equal(run({ prefersDark: true }), null);
  assert.equal(run({ prefersDark: false }), null);
});

test("保存値が light ならライト、dark ならダーク", () => {
  assert.equal(run({ saved: "light", prefersDark: true }), "light");
  assert.equal(run({ saved: "dark", prefersDark: false }), null);
});

test("想定外の保存値は無視してダークのまま", () => {
  assert.equal(run({ saved: "blue" }), null);
  assert.equal(run({ saved: "Light" }), null);
});

test("localStorage が使えなくても落ちず、ダークのまま", () => {
  assert.equal(run({ storageThrows: true, prefersDark: false }), null);
});

test("index.html の <head> で、stylesheet のあとに読み込む", () => {
  const html = read("index.html");
  const head = html.slice(0, html.indexOf("</head>"));
  assert.ok(head.includes('<script src="./theme-init.js"></script>'), "<head> に theme-init.js がない");
  assert.ok(head.indexOf("style.css") < head.indexOf("theme-init.js"));
});
