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
const AMAZON_HOST_RE = /(^|\.)amazon\.(com|co\.jp|co\.uk|de|fr|it|es|ca|com\.mx|com\.au|com\.br|nl|sg|in|ae|sa|se|pl|eg|tr)$/i;

/**
 * サイト別に落とすパラメーター。
 * Amazonモードのような特別扱いをやめ、同じ枠組みでまとめる。
 * ここへ入れるのは「共有リンクに勝手に付いてくる識別子」に限る。
 * 再生位置の t= や検索語のように、消すと意味が変わるものは入れない。
 */
const SITE_PARAM_RULES = [
  { id: "youtube", hostRe: /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i,
    params: ["si", "feature", "pp", "ab_channel", "kw"] },
  { id: "x", hostRe: /(^|\.)(twitter\.com|x\.com)$/i,
    params: ["t", "s", "ref_src", "ref_url", "twclid"] },
  { id: "instagram", hostRe: /(^|\.)instagram\.com$/i,
    params: ["igshid", "img_index", "igsh"] },
  { id: "spotify", hostRe: /(^|\.)spotify\.com$/i,
    params: ["si", "nd", "_branch_match_id"] },
  { id: "tiktok", hostRe: /(^|\.)tiktok\.com$/i,
    params: ["is_from_webapp", "sender_device", "web_id", "_r", "_t"] },
  { id: "facebook", hostRe: /(^|\.)(facebook\.com|fb\.watch)$/i,
    params: ["mibextid", "rdid", "share_url", "__cft__[0]", "__tn__"] }
];

/** 短縮URL。中身が見えないので、展開できないことを伝える。 */
const SHORTENER_HOSTS = [
  "bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "buff.ly", "is.gd",
  "cutt.ly", "rb.gy", "lnkd.in", "amzn.to", "amzn.asia", "a.co", "s.id"
];

/** リダイレクト先を渡しがちなパラメーター名。 */
const REDIRECT_PARAM_NAMES = ["url", "u", "redirect", "redirect_uri", "redirect_url", "next", "dest", "destination", "target", "to", "continue", "returnurl", "return_to", "r"];

/**
 * 消したパラメーターの正体。
 * 見つからない名前は、前方一致のルールで補う。
 */
const PARAM_NOTES = {
  fbclid: "note.fbclid",
  gclid: "note.gclid",
  dclid: "note.gclid",
  gbraid: "note.gclid",
  wbraid: "note.gclid",
  msclkid: "note.msclkid",
  yclid: "note.yclid",
  igshid: "note.igshid",
  igsh: "note.igshid",
  mc_cid: "note.mailchimp",
  mc_eid: "note.mailchimp",
  _hsenc: "note.hubspot",
  _hsmi: "note.hubspot",
  ttclid: "note.ttclid",
  twclid: "note.twclid",
  li_fat_id: "note.linkedin",
  spm: "note.spm",
  scid: "note.scid",
  si: "note.si",
  t: "note.shareToken",
  s: "note.shareToken",
  tag: "note.affiliate",
  ref: "note.affiliate",
  linkCode: "note.affiliate",
  ascsubtag: "note.affiliate",
  mibextid: "note.mibextid",
  is_from_webapp: "note.appOrigin",
  feature: "note.shareOrigin",
  pp: "note.shareOrigin",
  ab_channel: "note.shareOrigin",
  nd: "note.shareOrigin",
  web_id: "note.deviceId",
  rdid: "note.deviceId",
  sender_device: "note.appOrigin"
};

const PARAM_NOTE_PREFIXES = [
  ["utm_", "note.utm"],
  ["pk_", "note.matomo"],
  ["vero_", "note.vero"],
  ["pf_rd_", "note.affiliate"],
  ["ref_", "note.affiliate"]
];

/** パラメーター名から、説明の辞書キーを引く。 */
function noteKeyFor(name) {
  const lower = name.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(PARAM_NOTES, name)) return PARAM_NOTES[name];
  if (Object.prototype.hasOwnProperty.call(PARAM_NOTES, lower)) return PARAM_NOTES[lower];
  for (const [prefix, key] of PARAM_NOTE_PREFIXES) {
    if (lower.startsWith(prefix)) return key;
  }
  return "note.generic";
}

/** ホストに当てはまるサイト別ルールを返す。 */
function siteRuleFor(host) {
  return SITE_PARAM_RULES.find((rule) => rule.hostRe.test(host)) || null;
}

/**
 * フラグメントに紛れ込んだ追跡用の値を落とす。
 * #utm_source=... のように、クエリと同じ書き方で置かれることがある。
 * #:~:text=... は「どこを読んでいたか」が残るので、共有前に外す。
 */
function stripFragment(urlObj) {
  const removed = [];
  const hash = urlObj.hash.replace(/^#/, "");
  if (!hash) return removed;

  if (hash.startsWith(":~:text=")) {
    urlObj.hash = "";
    removed.push({ name: ":~:text", where: "fragment", noteKey: "note.textFragment" });
    return removed;
  }

  if (!hash.includes("=")) return removed;

  const params = new URLSearchParams(hash);
  let changed = false;
  for (const name of [...params.keys()]) {
    const lower = name.toLowerCase();
    const blocked = COMMON_PREFIX_BLOCKS.some((p) => lower.startsWith(p)) ||
      COMMON_EXACT_BLOCKS.includes(lower);
    if (blocked) {
      params.delete(name);
      removed.push({ name, where: "fragment", noteKey: noteKeyFor(name) });
      changed = true;
    }
  }
  if (changed) {
    const rest = params.toString();
    urlObj.hash = rest ? `#${rest}` : "";
  }
  return removed;
}

/**
 * URLに残る「気をつける点」を挙げる。
 * 消す対象ではないが、貼る前に見ておきたいもの。
 */
function analyzeRisks(urlObj) {
  const risks = [];
  const host = urlObj.hostname.toLowerCase();

  if (urlObj.username || urlObj.password) {
    risks.push({ id: "userinfo", detail: urlObj.username });
  }

  if (host.split(".").some((label) => label.startsWith("xn--"))) {
    risks.push({ id: "punycode", detail: host });
  }

  if (urlObj.port && urlObj.port !== "80" && urlObj.port !== "443") {
    risks.push({ id: "port", detail: urlObj.port });
  }

  if (urlObj.protocol === "http:") {
    risks.push({ id: "plainHttp", detail: host });
  }

  if (SHORTENER_HOSTS.includes(host) || SHORTENER_HOSTS.includes(host.replace(/^www\./, ""))) {
    risks.push({ id: "shortener", detail: host });
  }

  for (const [name, value] of urlObj.searchParams) {
    const lower = name.toLowerCase();
    const looksRedirect = REDIRECT_PARAM_NAMES.includes(lower);
    const carriesUrl = /^(https?:\/\/|\/\/)/i.test(value) || /^https?%3a%2f%2f/i.test(value);
    if (looksRedirect && carriesUrl) {
      risks.push({ id: "openRedirect", detail: `${name}=${value.slice(0, 60)}` });
    }
  }

  return risks;
}

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

/** クエリパラメータ削除（前方一致・完全一致・サイト別の3系統）。消したものを返す。 */
function stripParams(urlObj, { strong=false, amazonMode=false } = {}) {
  const removed = [];
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

  // サイト別ルール（そのサイトでだけ落とす名前）
  const rule = siteRuleFor(urlObj.hostname.toLowerCase());
  if (rule) {
    for (const k of rule.params) toDelete.add(k.toLowerCase());
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
      removed.push({ name: key, where: "query", noteKey: noteKeyFor(key), site: rule ? rule.id : null });
    }
  }

  return removed;
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

/** 画面の文言は i18n.js の辞書から引く。ここには文言を置かない。 */
function uiText(key, params = {}) {
  return window.i18n.t(key, params);
}

/** 要素を組み立てる小さなヘルパー。HTML文字列を組み立てないので、値に何が入っても壊れない。 */
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (name === "class") node.className = value;
    else if (name === "text") node.textContent = value;
    else if (value !== null && value !== undefined) node.setAttribute(name, value);
  }
  for (const child of [].concat(children)) {
    if (child) node.append(child);
  }
  return node;
}

/**
 * 報告用のパネルを1つ用意する（なければ作る）。
 * afterId を渡すと、そのパネルの後ろへ置く。
 * 渡さないと、あとから作ったほうが前に来て、内訳より注意書きが上に出てしまう。
 */
function ensurePanel(id, className, afterId = null) {
  let panel = document.getElementById(id);
  if (!panel) {
    panel = el("div", { id, class: className });
    const anchor = (afterId && document.getElementById(afterId)) ||
      document.getElementById("stats") ||
      document.querySelector("#outputUrls").closest(".form-row");
    anchor.insertAdjacentElement("afterend", panel);
  }
  panel.replaceChildren();
  return panel;
}

/**
 * 消したパラメーターの内訳を出す。
 * 同じ名前が複数のURLに出たときは、件数をまとめる。
 */
function updateRemovedReport(removed) {
  const panel = ensurePanel("removedReport", "report-panel");
  if (!removed || removed.length === 0) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;

  const counts = new Map();
  for (const item of removed) {
    const key = `${item.name}\u0000${item.where}`;
    const found = counts.get(key);
    if (found) found.count += 1;
    else counts.set(key, { ...item, count: 1 });
  }

  const rows = [...counts.values()].sort((a, b) => b.count - a.count);

  panel.append(el("h3", { class: "report-title", text: uiText("report.removedTitle", { count: removed.length }) }));

  const list = el("ul", { class: "report-list" });
  for (const row of rows) {
    const name = el("code", { class: "report-name", text: row.name });
    const note = el("span", { class: "report-note", text: uiText(row.noteKey) });
    const where = row.where === "fragment"
      ? el("span", { class: "report-where", text: uiText("report.inFragment") })
      : null;
    const count = row.count > 1
      ? el("span", { class: "report-count", text: uiText("report.times", { count: row.count }) })
      : null;
    list.append(el("li", { class: "report-item" }, [name, where, note, count]));
  }
  panel.append(list);
}

/**
 * 消さないが、貼る前に見ておきたい点を出す。
 * ここで挙げるのは「危険だと決めつけられないが、知らないと損をするもの」である。
 */
function updateRiskReport(risks) {
  const panel = ensurePanel("riskReport", "report-panel risk-panel", "removedReport");
  if (!risks || risks.length === 0) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;

  const seen = new Set();
  const rows = [];
  for (const risk of risks) {
    const key = `${risk.id}\u0000${risk.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(risk);
  }

  panel.append(el("h3", { class: "report-title", text: uiText("report.riskTitle", { count: rows.length }) }));

  const list = el("ul", { class: "report-list" });
  for (const risk of rows) {
    list.append(el("li", { class: "report-item risk-item" }, [
      el("strong", { class: "risk-label", text: uiText(`risk.${risk.id}.label`) }),
      el("span", { class: "risk-body", text: uiText(`risk.${risk.id}.body`) }),
      risk.detail ? el("code", { class: "risk-detail", text: String(risk.detail) }) : null
    ]));
  }
  panel.append(list);
}

/** 浄化してよいスキーム。ここにないものは出力しない。 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * スキームが省略された入力が、ホスト名として読めるかを判定する。
 * 末尾までアンカーし、ドットで区切られた最後のラベル（TLD相当）を2文字以上要求する。
 * 以前は末尾アンカーがなく全グループが省略可だったため、
 * "hello world" のような文字列まで通り、https://hello%20world/ という
 * 実在しないURLを作って返していた（実測で確認）。
 */
function looksLikeHost(input) {
  return /^[^\s/?#@:]+\.[^\s/?#@:.]{2,}(:\d{1,5})?([/?#]\S*)?$/.test(input);
}

/**
 * 入力をURLとして解釈する。
 * 戻り値は { urlObj } か { errorCode, detail }。
 * errorCode は表示のための識別子で、文言は uiText() が決める。
 */
function parseInputUrl(input) {
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input);

  let candidate = input;
  if (!hasScheme) {
    if (!looksLikeHost(input)) return { errorCode: "notUrl" };
    candidate = `https://${input}`;
  }

  let urlObj;
  try {
    urlObj = new URL(candidate);
  } catch (err) {
    return { errorCode: "invalid" };
  }

  // javascript: や data: は、貼り付けた先で実行される危険がある。
  // このツールの出力はコピーして使う前提なので、通さない。
  if (!ALLOWED_PROTOCOLS.has(urlObj.protocol)) {
    return { errorCode: "scheme", detail: urlObj.protocol.replace(":", "") };
  }

  if (!urlObj.hostname) return { errorCode: "invalid" };

  return { urlObj };
}

/** 1本のURLをクリーン化 */
function cleanOne(raw, opts) {
  const input = raw.trim();
  if (!input) return { cleaned: "", original: "", error: null, changed: false };

  const parsed = parseInputUrl(input);
  if (parsed.errorCode) {
    return {
      cleaned: "",
      original: input,
      error: parsed.errorCode,
      errorDetail: parsed.detail || null,
      changed: false
    };
  }

  const urlObj = parsed.urlObj;
  const originalUrl = urlObj.toString();
  const originalParamCount = [...urlObj.searchParams].length;
  const host = urlObj.hostname.toLowerCase();
  const isAmazon = AMAZON_HOST_RE.test(host);

  // クエリ除去。消したものを控えて、あとで内訳を出す
  const removed = stripParams(urlObj, { strong: opts.strongBlocklist, amazonMode: opts.amazonMode });

  // フラグメントに紛れた追跡用の値も落とす
  removed.push(...stripFragment(urlObj));

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

  // 気をつける点は、消したあとの姿で判定する
  const risks = analyzeRisks(urlObj);

  const cleanedUrl = urlObj.toString();
  const newParamCount = [...urlObj.searchParams].length;
  const paramsRemoved = originalParamCount - newParamCount;
  const changed = originalUrl !== cleanedUrl || amazonNormalized;

  return {
    cleaned: cleanedUrl,
    original: originalUrl,
    error: null,
    errorDetail: null,
    changed: changed,
    removed: removed,
    risks: risks,
    stats: {
      paramsRemoved: paramsRemoved,
      amazonNormalized: amazonNormalized
    }
  };
}

/**
 * エラーコードを画面の文言にする。
 * 文言をここへ集めておき、日英の切り替えはこの関数の中だけで済むようにする。
 */
function describeError(result) {
  switch (result.error) {
    case "scheme":
      return uiText("error.scheme", { scheme: result.errorDetail });
    case "notUrl":
      return uiText("error.notUrl");
    case "invalid":
      return uiText("error.invalid");
    default:
      return uiText("error.unknown");
  }
}

/** 出力欄の1行を組み立てる。対象外の行は # で始め、URLと取り違えないようにする。 */
function formatOutputLine(result) {
  if (!result.error) return result.cleaned;
  const original = result.original.length > 60 ? `${result.original.slice(0, 60)}...` : result.original;
  return `# ${describeError(result)} — ${original}`;
}

/** 複数行クリーン化 */
function cleanBatch(multiline, opts) {
  const lines = multiline.split(/\r?\n/);
  const results = [];
  let totalParamsRemoved = 0;
  let totalChanged = 0;
  let totalErrors = 0;

  const allRemoved = [];
  const allRisks = [];

  for (const line of lines) {
    const result = cleanOne(line, opts);
    results.push(result);

    if (result.removed) allRemoved.push(...result.removed);
    if (result.risks) {
      for (const risk of result.risks) allRisks.push({ ...risk, url: result.cleaned });
    }
    
    if (result.stats) {
      totalParamsRemoved += result.stats.paramsRemoved;
    }
    if (result.changed) totalChanged++;
    if (result.error) totalErrors++;
  }

  return {
    results: results,
    removed: allRemoved,
    risks: allRisks,
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
  // 先に静的な文言を差し替えてから、各機能を組み立てる
  window.i18n.apply();
  window.i18n.restoreCarriedState();

  const $btnLang = document.getElementById("btnLang");
  if ($btnLang) {
    $btnLang.addEventListener("click", () => {
      window.i18n.setLanguage(window.i18n.language === "ja" ? "en" : "ja");
    });
  }

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
      showLoading(uiText("toast.processing", { count: lines.length }));
      $btnClean.disabled = true;
      $btnClean.textContent = uiText("toast.processingShort");
      
      // UIブロックを避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    try {
      const batchResult = cleanBatch(inputText, options);
      
      // 結果テキストエリアに表示
      const outputText = batchResult.results.map(formatOutputLine).join("\n");
      $out.value = outputText;
      
      // 統計表示を更新
      updateStats(batchResult.stats);

      // 消したものと、貼る前に見ておきたい点を出す
      updateRemovedReport(batchResult.removed);
      updateRiskReport(batchResult.risks);
      
      // エラーがあれば表示
      const errors = batchResult.results.filter(r => r.error);
      if (errors.length > 0) {
        const errorMsg = uiText("toast.errors", { count: errors.length, reason: describeError(errors[0]), more: errors.length > 1 ? uiText("toast.errorsMore") : "" });
        showToast(errorMsg, "error");
      } else if (batchResult.stats.totalChanged > 0) {
        showToast(uiText("toast.cleaned", { count: batchResult.stats.totalChanged }));
      } else {
        showToast(uiText("toast.noChange"), "info");
      }
    } catch (error) {
      showToast(uiText("toast.failed"), "error");
      console.error("Clean error:", error);
    } finally {
      // ローディング終了
      hideLoading();
      $btnClean.disabled = false;
      $btnClean.textContent = uiText("form.clean");
    }
  });

  // 貼ってすぐ実行できるように、Ctrl+Enter（Macは Cmd+Enter）でも動かす
  $in.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      $btnClean.click();
    }
  });

  $btnCopy.addEventListener("click", async () => {
    if (!$out.value) return;
    const originalText = $btnCopy.textContent;

    const markCopied = () => {
      $btnCopy.textContent = uiText("form.copied");
      $btnCopy.classList.add("copied");
      showToast(uiText("toast.copied"));
      setTimeout(() => {
        $btnCopy.classList.remove("copied");
        $btnCopy.textContent = originalText;
      }, 1500);
    };

    try {
      await navigator.clipboard.writeText($out.value);
      markCopied();
      return;
    } catch (e) {
      // クリップボードが使えない場合（file:// や権限なし）は選択してから試す
    }

    // execCommand は非推奨だが、代わりがない環境が残っている。
    // 失敗したときは黙って終わらせず、手で選ぶように伝える。
    let copied = false;
    try {
      $out.select();
      copied = document.execCommand("copy");
    } catch (e) {
      copied = false;
    }

    if (copied) markCopied();
    else showToast(uiText("toast.copyFailed"), "error");
  });

  $btnClear.addEventListener("click", () => {
    $in.value = "";
    $out.value = "";
    // 前回の内訳と注意書きも消す。残っていると別のURLの話と取り違える
    updateRemovedReport([]);
    updateRiskReport([]);
    updateStats({ totalUrls: 0, totalChanged: 0, totalParamsRemoved: 0, totalErrors: 0 });
  });

  // ヘルプモーダル制御
  const $btnHelp = document.getElementById("btnHelp");
  const $modal = document.getElementById("helpModal");
  const $modalClose = $modal.querySelector(".modal-close");

  // 開いた元の要素へ戻すために控える
  let lastFocused = null;

  const focusableInModal = () =>
    [...$modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((node) => node.offsetParent !== null);

  function openModal() {
    lastFocused = document.activeElement;
    $modal.classList.add("show");
    $modal.setAttribute("aria-hidden", "false");
    $modalClose.focus();
  }

  function closeModal() {
    if (!$modal.classList.contains("show")) return;
    $modal.classList.remove("show");
    $modal.setAttribute("aria-hidden", "true");
    // 開く前に触っていた要素へ戻す。戻さないと、閉じたあとにページの先頭へ飛ぶ
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    lastFocused = null;
  }

  $btnHelp.addEventListener("click", openModal);
  $modalClose.addEventListener("click", closeModal);

  // モーダル外クリックで閉じる
  $modal.addEventListener("click", (e) => {
    if (e.target === $modal) closeModal();
  });

  // 開いている間はTabがモーダルの外へ出ないようにする
  $modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const items = focusableInModal();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Escキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // テーマ切り替え
  const $btnTheme = document.getElementById("btnTheme");

  // Storageを拒否するブラウザー（プライベートウィンドウなど）では
  // localStorage へ触れるだけで例外になる。設定が戻らないだけなので、握って進む。
  const readTheme = () => {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      return null;
    }
  };
  const writeTheme = (value) => {
    try {
      localStorage.setItem("theme", value);
    } catch (e) {
      // 保存できなくても画面は動く
    }
  };

  if (readTheme() === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  }

  $btnTheme.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    if (newTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    writeTheme(newTheme);
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
    statsEl.hidden = true;
    return;
  }
  
  statsEl.hidden = false;
  statsEl.replaceChildren();

  const grid = el("div", { class: "stats-grid" });
  const cards = [
    ["stats.total", stats.totalUrls, ""],
    ["stats.changed", stats.totalChanged, ""],
    ["stats.removed", stats.totalParamsRemoved, ""]
  ];
  if (stats.totalErrors > 0) cards.push(["stats.errors", stats.totalErrors, " error"]);

  for (const [key, value, extra] of cards) {
    grid.append(el("div", { class: `stat-item${extra}` }, [
      el("span", { class: "stat-value", text: String(value) }),
      el("span", { class: "stat-label", text: uiText(key) })
    ]));
  }
  statsEl.append(grid);
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

  previewEl.hidden = false;
  previewEl.replaceChildren();

  const header = el("div", { class: "preview-header" }, [
    el("span", { class: "preview-title", text: `📝 ${uiText("preview.title", { count: longUrls.length })}` })
  ]);

  const list = el("div", { class: "preview-list" });
  for (const url of longUrls.slice(0, 3)) {
    list.append(el("div", { class: "preview-item", text: truncateUrl(url, 60) }));
  }
  if (longUrls.length > 3) {
    list.append(el("div", { class: "preview-more", text: uiText("preview.more", { count: longUrls.length - 3 }) }));
  }

  previewEl.append(header, list);
}

/** URLプレビュー非表示 */
function hideUrlPreview() {
  const previewEl = document.getElementById("urlPreview");
  if (previewEl) {
    previewEl.hidden = true;
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
  
  loadingEl.hidden = false;
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
      loadingEl.hidden = true;
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
