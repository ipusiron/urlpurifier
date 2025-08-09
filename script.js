// URLPurifier - script.js
// すべてクライアントサイドで動作。送信なし。

/** 共通のトラッキング系パラメータ（前方一致 or 完全一致） */
const COMMON_PREFIX_BLOCKS = [
  "utm_",        // utm_source, utm_medium, utm_campaign, ...
  "vero_",       // メール配信系
  "pk_",         // Matomo
];

const COMMON_EXACT_BLOCKS = [
  "fbclid", "gclid", "dclid", "msclkid",
  "mc_cid", "mc_eid", "_hsenc", "_hsmi",
  "igshid", "spm", "scid",
  "yclid", "gbraid", "wbraid",
];

/** 強力ブロック（教育/簡易デモ向けに代表的なものを追加） */
const STRONG_EXACT_BLOCKS = [
  "sr_share", "ttclid", "twclid", "li_fat_id",
  "ef_id", "cmpid", "campaign", "camp", "adgroup", "adid", "creative",
  "ref_src", "ref_url",
];

/** Amazon 関連（明示的に落とすもの） */
const AMAZON_EXACT_BLOCKS = [
  "tag", "ref", "linkCode", "creative", "creativeASIN", "ascsubtag",
  "psc", "th", "smid", "keywords", "qid", "language", "camp",
];

/** Amazon ドメイン判定 */
const AMAZON_HOST_RE = /(^|\.)amazon\.(com|co\.jp|co\.uk|de|fr|it|es|ca|com\.mx|com\.au|nl|sg|in|ae|sa|se|pl|eg|tr)$/i;

/** ASIN 抽出（/dp/ASIN, /gp/product/ASIN, /product/ASIN, クエリasin=） */
function extractASIN(urlObj) {
  const path = urlObj.pathname || "";
  const dpMatch = path.match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (dpMatch) return dpMatch[1];

  const gpMatch = path.match(/\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (gpMatch) return gpMatch[1];

  const prodMatch = path.match(/\/product\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (prodMatch) return prodMatch[1];

  const asinFromQuery = urlObj.searchParams.get("asin") || urlObj.searchParams.get("ASIN");
  if (asinFromQuery && /^[A-Z0-9]{10}$/i.test(asinFromQuery)) return asinFromQuery;

  return null;
}

/** クエリパラメータ削除（前方一致・完全一致の両対応） */
function stripParams(urlObj, { strong=false, amazonMode=false } = {}) {
  const toDelete = new Set();

  // 共通（完全一致）
  for (const k of COMMON_EXACT_BLOCKS) toDelete.add(k.toLowerCase());

  // 強力ブロック追加
  if (strong) {
    for (const k of STRONG_EXACT_BLOCKS) toDelete.add(k.toLowerCase());
  }

  // Amazon モードの明示ブロック
  if (amazonMode) {
    for (const k of AMAZON_EXACT_BLOCKS) toDelete.add(k.toLowerCase());
  }

  // 走査して削除対象を判定
  const keys = Array.from(urlObj.searchParams.keys());
  for (const key of keys) {
    const lower = key.toLowerCase();

    // 前方一致チェック
    let blockedByPrefix = COMMON_PREFIX_BLOCKS.some(pref => lower.startsWith(pref));

    // Amazonっぽいが /dp にできないケースでは、とりあえず ref などは削除
    if (!blockedByPrefix && amazonMode && lower.startsWith("pf_rd_")) {
      blockedByPrefix = true;
    }

    if (blockedByPrefix || toDelete.has(lower)) {
      urlObj.searchParams.delete(key);
    }
  }
}

/** Amazon 正規化（/dp/ASIN に寄せてクエリを空に） */
function normalizeAmazon(urlObj) {
  const asin = extractASIN(urlObj);
  if (!asin) return; // ASINが取れない場合は触らない

  // パスを /dp/ASIN に変更
  urlObj.pathname = `/dp/${asin.toUpperCase()}`;

  // 検索クエリは空に
  urlObj.search = "";
}

/** 1本のURLをクリーン化 */
function cleanOne(raw, opts) {
  const input = raw.trim();
  if (!input) return "";

  let urlObj;
  try {
    // スキーマ欠落に対応（例: example.com）
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(input)) {
      // とりあえず https:// を補う（雑だがUX優先）
      urlObj = new URL(`https://${input}`);
    } else {
      urlObj = new URL(input);
    }
  } catch {
    // URLとして解釈できなければ、そのまま返す
    return input;
  }

  const host = urlObj.hostname.toLowerCase();
  const isAmazon = AMAZON_HOST_RE.test(host);

  // クエリ除去
  stripParams(urlObj, { strong: opts.strongBlocklist, amazonMode: opts.amazonMode });

  // Amazon 専用最短化
  if (opts.amazonMode && isAmazon) {
    normalizeAmazon(urlObj);
  }

  // 末尾のスラッシュ整形（クエリがない場合のみ）
  if (!urlObj.search && urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, "");
  }

  // 表示用に元のスキーマを維持（https 推奨のままでOK）
  return urlObj.toString();
}

/** 複数行クリーン化 */
function cleanBatch(multiline, opts) {
  const lines = multiline.split(/\r?\n/);
  const out = [];

  for (const line of lines) {
    const cleaned = cleanOne(line, opts);
    // 空行は空のまま残す（元の行数を維持）
    out.push(cleaned);
  }
  return out.join("\n");
}

/** UI ハンドラ */
function setupUI() {
  const $in = document.getElementById("inputUrls");
  const $out = document.getElementById("outputUrls");
  const $btnClean = document.getElementById("btnClean");
  const $btnCopy = document.getElementById("btnCopy");
  const $btnClear = document.getElementById("btnClear");
  const $amazonMode = document.getElementById("amazonMode");
  const $strong = document.getElementById("strictBlocklist");

  $btnClean.addEventListener("click", () => {
    const options = {
      amazonMode: $amazonMode.checked,
      strongBlocklist: $strong.checked,
    };
    const result = cleanBatch($in.value || "", options);
    $out.value = result;
  });

  $btnCopy.addEventListener("click", async () => {
    if (!$out.value) return;
    try {
      await navigator.clipboard.writeText($out.value);
      flashButton($btnCopy, "コピーしました");
    } catch {
      // フォールバック
      $out.select();
      document.execCommand("copy");
      flashButton($btnCopy, "コピーしました");
    }
  });

  $btnClear.addEventListener("click", () => {
    $in.value = "";
    $out.value = "";
  });
}

/** 小さなトースト代わりのフィードバック */
function flashButton(btn, text) {
  const original = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 900);
}

document.addEventListener("DOMContentLoaded", setupUI);
