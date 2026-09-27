const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

/** i18n.js から辞書と I18n クラスを取り出す（document には触れない部分だけを使う） */
function loadMessages(language = "ja") {
  const source = read("i18n.js");
  const body = source.slice(0, source.indexOf("class I18n"));
  const MESSAGES = new Function(`${body} return MESSAGES;`)();
  const t = (key, params = {}) => {
    const table = MESSAGES[language] || MESSAGES.ja;
    let text = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
    return text;
  };
  return { MESSAGES, t };
}

/**
 * script.js は素のスクリプトなので、Node から読むために最小限の document と window を渡す。
 * 読み込み時に document へ触るのは、末尾の DOMContentLoaded 登録だけである。
 */
function loadScript(language = "ja") {
  const source = read("script.js");
  const stub = { addEventListener() {}, getElementById: () => null, querySelector: () => null };
  const { MESSAGES, t } = loadMessages(language);
  const win = { i18n: { language, t }, MESSAGES };
  const factory = new Function(
    "document",
    "window",
    `${source}
     return {
       ALLOWED_PROTOCOLS, looksLikeHost, parseInputUrl, cleanOne, cleanBatch,
       stripParams, normalizeAmazon, extractASIN, describeError, formatOutputLine,
       noteKeyFor, siteRuleFor, stripFragment, analyzeRisks, uiText,
       COMMON_PREFIX_BLOCKS, COMMON_EXACT_BLOCKS, STRONG_EXACT_BLOCKS, AMAZON_EXACT_BLOCKS,
       SITE_PARAM_RULES, PARAM_NOTES, PARAM_NOTE_PREFIXES, SHORTENER_HOSTS
     };`
  );
  return factory(stub, win);
}

const defaultOptions = { amazonMode: false, strongBlocklist: false };

module.exports = { root, read, loadScript, loadMessages, defaultOptions };
