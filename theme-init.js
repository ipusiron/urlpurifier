/**
 * theme-init - 最初の描画の前にテーマを決める。<head> で同期読み込みする。
 *
 * style.css の既定はダークで、ライトは <html> の data-theme="light" で切り替える。
 * この判定を </body> 直前の script.js で行うと、ダークで描いたあとにライトへ
 * 切り替わって見える（ライトを保存した人だけに起きる）。
 *
 * 保存した選択（localStorage の theme が "light"）だけを使う。
 * それ以外（"dark"・保存なし・想定外の値）はダークのまま。OS の設定には従わない。
 * Storage を拒否するブラウザーでも落ちないよう try/catch で囲む。
 */
(function (global) {
  "use strict";

  var saved = null;
  try {
    saved = global.localStorage.getItem("theme");
  } catch (e) {
    // 保存した設定が戻らないだけなので、ダークのまま進む
  }

  if (saved === "light") {
    global.document.documentElement.setAttribute("data-theme", "light");
  }
})(typeof window !== "undefined" ? window : globalThis);
