const assert = require("node:assert/strict");
const test = require("node:test");

const { read } = require("./helper");

const html = read("index.html");
const css = read("style.css");
const js = read("script.js");
const NL = String.fromCharCode(10);

test("CSPを置き、不要なunsafe-inlineを含まない", () => {
  const match = html.match(/Content-Security-Policy" content="([^"]+)"/);
  assert.ok(match, "meta CSPがない");
  const csp = match[1];
  assert.doesNotMatch(csp, /'unsafe-inline'/);
  assert.doesNotMatch(csp, /'unsafe-eval'/);
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
});

test("style属性とインラインハンドラーを書かない", () => {
  // style属性は CSP の style-src-attr に触れる。出し入れは hidden 属性で行う
  for (const [name, source] of [["index.html", html], ["script.js", js]]) {
    assert.doesNotMatch(source, /\sstyle\s*=\s*"/, `${name} にstyle属性がある`);
    assert.doesNotMatch(source, /\son[a-z]+\s*=\s*"/, `${name} にインラインハンドラーがある`);
  }
  assert.doesNotMatch(js, /\.style\.display\s*=/, "style.display で出し入れしている");
  assert.match(css, /\[hidden\]\{\s*[\r\n]\s*display: none !important;/);
});

test("外部への通信と外部リソースを持ち込まない", () => {
  for (const [name, source] of [["index.html", html], ["script.js", js], ["style.css", css]]) {
    assert.doesNotMatch(source, /https?:\/\/[a-z0-9.-]+\/[^"')\s]*\.(js|css|woff2?)/i, `${name} が外部リソースを読んでいる`);
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket/, `${name} に通信がある`);
  }
});

test("ヘルプはダイアログとして組み立てる", () => {
  assert.match(html, /id="helpModal"[^>]*role="dialog"/);
  assert.match(html, /id="helpModal"[^>]*aria-modal="true"/);
  assert.match(html, /id="helpModal"[^>]*aria-labelledby="helpModalTitle"/);
  assert.match(html, /id="helpModalTitle"/);

  // 開いた元へフォーカスを戻し、開いている間はTabが外へ出ない
  assert.match(js, /lastFocused = document\.activeElement;/);
  assert.match(js, /lastFocused\.focus\(\)/);
  assert.match(js, /if \(e\.key !== "Tab"\) return;/);
  assert.match(js, /aria-hidden", "false"/);
});

test("トーストが読み上げへ伝わる", () => {
  assert.match(html, /id="toast"[^>]*role="status"/);
  assert.match(html, /id="toast"[^>]*aria-live="polite"/);
});

test("操作要素の当たり判定を44pxにそろえる", () => {
  // チェックボックス本体は18pxのままだが、囲うラベルが44pxある。
  // 本文中のリンクは文の一部なので対象外とする。
  assert.match(css, /\.btn,[\s\S]{0,200}min-height: 44px;/);
  assert.match(css, /\.checkbox,[\s\S]{0,200}min-height: 44px;/);
});

test("すべてのbutton要素にtypeがある", () => {
  const buttons = html.match(/<button[^>]*>/g) || [];
  assert.ok(buttons.length > 0);
  for (const button of buttons) {
    assert.match(button, /type="button"|type="submit"/, `type未指定: ${button}`);
  }
});

test("2列に並べる枠は狭い画面で縮む", () => {
  // 1fr のままだと中身の最小幅で押し広げられる
  assert.doesNotMatch(css, /grid-template-columns:\s*1fr 1fr/);
  assert.doesNotMatch(css, /minmax\(\d+px, 1fr\)/);
});
