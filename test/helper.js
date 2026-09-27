const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

/**
 * script.js は素のスクリプトなので、Node から読むために最小限の document を渡す。
 * 末尾の DOMContentLoaded 登録だけが読み込み時に document へ触る。
 */
function loadScript() {
  const source = read("script.js");
  const stub = { addEventListener() {}, getElementById: () => null, querySelector: () => null };
  const factory = new Function(
    "document",
    "window",
    `${source}
     return {
       ALLOWED_PROTOCOLS, looksLikeHost, parseInputUrl, cleanOne, cleanBatch,
       stripParams, normalizeAmazon, extractASIN, describeError, formatOutputLine,
       COMMON_PREFIX_BLOCKS, COMMON_EXACT_BLOCKS, STRONG_EXACT_BLOCKS, AMAZON_EXACT_BLOCKS
     };`
  );
  return factory(stub, {});
}

const defaultOptions = { amazonMode: false, strongBlocklist: false };

module.exports = { root, read, loadScript, defaultOptions };
