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
  if (!input) return { cleaned: "", original: "", error: null, changed: false };

  // URL的な形式かどうかを判定（ドメイン形式または既にスキーマがある）
  const looksLikeUrl = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(input) || // スキーマあり
                       /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*/.test(input); // ドメイン形式
  
  if (!looksLikeUrl) {
    // URLらしくない文字列はそのまま返す
    return { cleaned: input, original: input, error: null, changed: false };
  }

  let urlObj;
  try {
    // スキーマ欠落に対応（例: example.com）
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(input)) {
      // ドメイン形式の場合のみ https:// を補う
      urlObj = new URL(`https://${input}`);
    } else {
      urlObj = new URL(input);
    }
  } catch (err) {
    // URLとして解釈できなければ、エラー情報付きで返す
    return { 
      cleaned: input, 
      original: input, 
      error: "無効なURL形式です", 
      changed: false 
    };
  }

  const originalUrl = urlObj.toString();
  const originalParamCount = urlObj.searchParams.size;
  const host = urlObj.hostname.toLowerCase();
  const isAmazon = AMAZON_HOST_RE.test(host);

  // クエリ除去
  stripParams(urlObj, { strong: opts.strongBlocklist, amazonMode: opts.amazonMode });

  // Amazon 専用最短化
  let amazonNormalized = false;
  if (opts.amazonMode && isAmazon) {
    const originalPathname = urlObj.pathname;
    normalizeAmazon(urlObj);
    amazonNormalized = originalPathname !== urlObj.pathname;
  }

  // 末尾のスラッシュ整形（クエリがない場合のみ）
  if (!urlObj.search && urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, "");
  }

  const cleanedUrl = urlObj.toString();
  const newParamCount = urlObj.searchParams.size;
  const paramsRemoved = originalParamCount - newParamCount;
  const changed = originalUrl !== cleanedUrl || amazonNormalized;

  return { 
    cleaned: cleanedUrl, 
    original: originalUrl, 
    error: null, 
    changed: changed,
    stats: {
      paramsRemoved: paramsRemoved,
      amazonNormalized: amazonNormalized
    }
  };
}

/** 複数行クリーン化 */
function cleanBatch(multiline, opts) {
  const lines = multiline.split(/\r?\n/);
  const results = [];
  let totalParamsRemoved = 0;
  let totalChanged = 0;
  let totalErrors = 0;

  for (const line of lines) {
    const result = cleanOne(line, opts);
    results.push(result);
    
    if (result.stats) {
      totalParamsRemoved += result.stats.paramsRemoved;
    }
    if (result.changed) totalChanged++;
    if (result.error) totalErrors++;
  }

  return {
    results: results,
    stats: {
      totalUrls: lines.filter(line => line.trim()).length,
      totalChanged: totalChanged,
      totalParamsRemoved: totalParamsRemoved,
      totalErrors: totalErrors
    }
  };
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

  $btnClean.addEventListener("click", async () => {
    const inputText = $in.value || "";
    const lines = inputText.split(/\r?\n/).filter(line => line.trim());
    const isLargeJob = lines.length > 10;
    
    const options = {
      amazonMode: $amazonMode.checked,
      strongBlocklist: $strong.checked,
    };

    // 大量処理の場合はローディング表示
    if (isLargeJob) {
      showLoading(`${lines.length}個のURLを処理中...`);
      $btnClean.disabled = true;
      $btnClean.textContent = "処理中...";
      
      // UIブロックを避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    try {
      const batchResult = cleanBatch(inputText, options);
      
      // 結果テキストエリアに表示
      const outputText = batchResult.results.map(result => result.cleaned).join("\n");
      $out.value = outputText;
      
      // 統計表示を更新
      updateStats(batchResult.stats);
      
      // エラーがあれば表示
      const errors = batchResult.results.filter(r => r.error);
      if (errors.length > 0) {
        const errorMsg = `${errors.length}件のエラーがありました: ${errors[0].error}${errors.length > 1 ? ' など' : ''}`;
        showToast(errorMsg, "error");
      } else if (batchResult.stats.totalChanged > 0) {
        showToast(`${batchResult.stats.totalChanged}個のURLを浄化しました`);
      } else {
        showToast("変更の必要なURLはありませんでした", "info");
      }
    } catch (error) {
      showToast("処理中にエラーが発生しました", "error");
      console.error("Clean error:", error);
    } finally {
      // ローディング終了
      hideLoading();
      $btnClean.disabled = false;
      $btnClean.textContent = "クリーン化";
    }
  });

  $btnCopy.addEventListener("click", async () => {
    if (!$out.value) return;
    const originalText = $btnCopy.textContent;
    try {
      await navigator.clipboard.writeText($out.value);
      $btnCopy.textContent = "コピーしました";
      $btnCopy.classList.add("copied");
      showToast("クリップボードにコピーしました");
      setTimeout(() => {
        $btnCopy.classList.remove("copied");
        $btnCopy.textContent = originalText;
      }, 1500);
    } catch {
      // フォールバック
      $out.select();
      document.execCommand("copy");
      $btnCopy.textContent = "コピーしました";
      $btnCopy.classList.add("copied");
      showToast("クリップボードにコピーしました");
      setTimeout(() => {
        $btnCopy.classList.remove("copied");
        $btnCopy.textContent = originalText;
      }, 1500);
    }
  });

  $btnClear.addEventListener("click", () => {
    $in.value = "";
    $out.value = "";
  });

  // ヘルプモーダル制御
  const $btnHelp = document.getElementById("btnHelp");
  const $modal = document.getElementById("helpModal");
  const $modalClose = $modal.querySelector(".modal-close");

  $btnHelp.addEventListener("click", () => {
    $modal.classList.add("show");
  });

  $modalClose.addEventListener("click", () => {
    $modal.classList.remove("show");
  });

  // モーダル外クリックで閉じる
  $modal.addEventListener("click", (e) => {
    if (e.target === $modal) {
      $modal.classList.remove("show");
    }
  });

  // Escキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $modal.classList.contains("show")) {
      $modal.classList.remove("show");
    }
  });

  // テーマ切り替え
  const $btnTheme = document.getElementById("btnTheme");
  
  // 保存されたテーマを復元
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  $btnTheme.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    // テーマをローカルストレージに保存
    localStorage.setItem('theme', newTheme);
  });

  // URLプレビュー機能
  let previewTimeout;
  $in.addEventListener('input', () => {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
      updateUrlPreview($in.value);
    }, 300); // 300ms の遅延でプレビュー更新
  });

  $in.addEventListener('focus', () => {
    updateUrlPreview($in.value);
  });

  $in.addEventListener('blur', () => {
    hideUrlPreview();
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

/** 統計表示更新 */
function updateStats(stats) {
  let statsEl = document.getElementById("stats");
  if (!statsEl) {
    // 統計表示要素が存在しない場合は作成
    statsEl = document.createElement("div");
    statsEl.id = "stats";
    statsEl.className = "stats";
    
    // 結果テキストエリアの後に挿入
    const outputRow = document.querySelector('#outputUrls').closest('.form-row');
    outputRow.insertAdjacentElement('afterend', statsEl);
  }
  
  if (stats.totalUrls === 0) {
    statsEl.style.display = 'none';
    return;
  }
  
  statsEl.style.display = 'block';
  statsEl.innerHTML = `
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">${stats.totalUrls}</span>
        <span class="stat-label">処理URL数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.totalChanged}</span>
        <span class="stat-label">変更URL数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.totalParamsRemoved}</span>
        <span class="stat-label">削除パラメータ数</span>
      </div>
      ${stats.totalErrors > 0 ? `
      <div class="stat-item error">
        <span class="stat-value">${stats.totalErrors}</span>
        <span class="stat-label">エラー数</span>
      </div>` : ''}
    </div>
  `;
}

/** URLプレビュー表示更新 */
function updateUrlPreview(text) {
  if (!text.trim()) {
    hideUrlPreview();
    return;
  }

  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const longUrls = lines.filter(line => line.length > 80);
  
  if (longUrls.length === 0) {
    hideUrlPreview();
    return;
  }

  let previewEl = document.getElementById("urlPreview");
  if (!previewEl) {
    previewEl = document.createElement("div");
    previewEl.id = "urlPreview";
    previewEl.className = "url-preview";
    
    const inputRow = document.querySelector('#inputUrls').closest('.form-row');
    inputRow.appendChild(previewEl);
  }

  previewEl.style.display = 'block';
  previewEl.innerHTML = `
    <div class="preview-header">
      <span class="preview-title">📝 プレビュー（${longUrls.length}個の長いURL）</span>
    </div>
    <div class="preview-list">
      ${longUrls.slice(0, 3).map(url => {
        const truncated = truncateUrl(url, 60);
        return `<div class="preview-item">${escapeHtml(truncated)}</div>`;
      }).join('')}
      ${longUrls.length > 3 ? `<div class="preview-more">他${longUrls.length - 3}個...</div>` : ''}
    </div>
  `;
}

/** URLプレビュー非表示 */
function hideUrlPreview() {
  const previewEl = document.getElementById("urlPreview");
  if (previewEl) {
    previewEl.style.display = 'none';
  }
}

/** HTMLエスケープ（XSS対策） */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** URLを短縮表示 */
function truncateUrl(url, maxLength = 50) {
  if (url.length <= maxLength) return url;
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = urlObj.hostname;
    const path = urlObj.pathname + urlObj.search;
    
    if (domain.length + 10 >= maxLength) {
      return domain + "...";
    }
    
    const remainingLength = maxLength - domain.length - 3; // "..." の分
    const truncatedPath = path.length > remainingLength 
      ? path.substring(0, remainingLength) + "..." 
      : path;
    
    return domain + truncatedPath;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
  }
}

/** ローディング表示 */
function showLoading(message) {
  let loadingEl = document.getElementById("loading");
  if (!loadingEl) {
    loadingEl = document.createElement("div");
    loadingEl.id = "loading";
    loadingEl.className = "loading-overlay";
    document.body.appendChild(loadingEl);
  }
  
  loadingEl.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    </div>
  `;
  
  loadingEl.style.display = 'flex';
  setTimeout(() => {
    loadingEl.classList.add('show');
  }, 10);
}

/** ローディング非表示 */
function hideLoading() {
  const loadingEl = document.getElementById("loading");
  if (loadingEl) {
    loadingEl.classList.remove('show');
    setTimeout(() => {
      loadingEl.style.display = 'none';
    }, 300);
  }
}

/** Toast 表示 */
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  
  // アニメーション表示
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  // 3秒後に非表示
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

document.addEventListener("DOMContentLoaded", setupUI);
