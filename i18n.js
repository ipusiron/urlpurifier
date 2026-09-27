// 画面の文言はここへ集める。モジュール側には直接書かない。
const MESSAGES = {
  ja: {
    "app.title": "URLPurifier - URL浄化ツール",
    "app.subtitle": "URLに付いてくる追跡用の値を落として、短いリンクに戻す",
    "lang.toggle": "English",
    "lang.toggleTitle": "英語表示に切り替える",
    "theme.toggle": "テーマ切り替え",
    "theme.toggleTitle": "ライト／ダークの切り替え",
    "help.open": "ヘルプ",
    "common.close": "閉じる",

    "form.inputLabel": "URLを貼り付け（複数行OK）",
    "form.inputPlaceholder": "例：\nhttps://www.amazon.co.jp/dp/B0XXXXXXX/ref=sr_1_1?keywords=test\nhttps://example.com/article?utm_source=twitter&fbclid=xxx",
    "form.amazonMode": "Amazonのリンクを /dp/ASIN の形まで短くする",
    "form.strictMode": "詳細除去モード（広告や配信まわりの値も落とす）",
    "form.clean": "クリーン化",
    "form.clear": "クリア",
    "form.outputLabel": "結果",
    "form.outputPlaceholder": "ここに結果が出ます",
    "form.copy": "結果をコピー",
    "form.copied": "コピーしました",

    "summary.title": "何を消す？（概要）",
    "summary.common": "共通：utm_* / fbclid / gclid / dclid / msclkid などの追跡用の値",
    "summary.site": "サイト別：YouTube・X・Instagram・Spotify・TikTok・Facebookで、共有時に付く識別子",
    "summary.amazon": "Amazonモード：tag / ref などを落とし、/dp/ASIN へそろえる",
    "summary.strict": "詳細除去モード：メール配信や広告計測まわりの値も落とす",
    "summary.fragment": "＃以降：#utm_source= のような値と、読んでいた位置が残る #:~:text=",

    "toast.cleaned": "{count}本のURLを浄化しました",
    "toast.noChange": "変えるところはありませんでした",
    "toast.errors": "{count}件が対象外でした: {reason}{more}",
    "toast.errorsMore": " など",
    "toast.failed": "処理中にエラーが起きました",
    "toast.copied": "クリップボードにコピーしました",
    "toast.copyFailed": "コピーできませんでした。手で選んでコピーしてください",
    "toast.processing": "{count}本のURLを処理中...",
    "toast.processingShort": "処理中...",

    "error.scheme": "{scheme}: は対象外です（http と https だけを浄化します）",
    "error.notUrl": "URLとして読めません",
    "error.invalid": "URLの形が正しくありません",
    "error.unknown": "処理できません",

    "stats.total": "処理したURL",
    "stats.changed": "変えたURL",
    "stats.removed": "消したパラメーター",
    "stats.errors": "対象外",
    "preview.title": "長いURLが{count}本あります",
    "preview.more": "ほか{count}本",

    "report.removedTitle": "消したもの（{count}件）",
    "report.riskTitle": "貼る前に見ておきたい点（{count}件）",
    "report.inFragment": "＃以降",
    "report.times": "{count}回",

    "note.utm": "流入元の記録。どの広告・投稿から来たかを送り先に伝える",
    "note.fbclid": "Facebookのクリック識別子。個人単位で追跡できる",
    "note.gclid": "Google広告のクリック識別子。広告の成果測定に使われる",
    "note.msclkid": "Microsoft広告のクリック識別子",
    "note.yclid": "Yandexのクリック識別子",
    "note.igshid": "Instagramの共有識別子。誰の共有から来たかがわかる",
    "note.mailchimp": "Mailchimpの配信・購読者の識別子。メールの受信者を特定できる",
    "note.hubspot": "HubSpotの追跡情報。メールや行動の履歴と結び付く",
    "note.ttclid": "TikTokのクリック識別子",
    "note.twclid": "Xのクリック識別子",
    "note.linkedin": "LinkedInの広告識別子",
    "note.matomo": "Matomo（解析ツール）の流入元の記録",
    "note.vero": "メール配信サービスの受信者の識別子",
    "note.spm": "サイト内のどこを押したかの記録（主にアリババ系）",
    "note.scid": "配信サービスの識別子",
    "note.si": "共有時に付く識別子。誰の共有から来たかがわかる",
    "note.shareToken": "共有元をたどるための一時的な値",
    "note.affiliate": "アフィリエイトの識別子。報酬の紐づけに使われる",
    "note.mibextid": "Facebookの内部的な経路の記録",
    "note.appOrigin": "どのアプリから開いたかの記録",
    "note.shareOrigin": "どの経路で共有されたかの記録",
    "note.deviceId": "端末やブラウザーを見分けるための値",
    "note.textFragment": "ページ内のどこを読んでいたかが残る指定",
    "note.generic": "追跡に使われることがある値",

    "risk.userinfo.label": "URLに利用者名が埋め込まれている",
    "risk.userinfo.body": "@ の前は「どのサイトか」ではありません。本物らしい名前を置いて、別のサイトへ誘う手口に使われます。@ の直後のホスト名を見てください。",
    "risk.punycode.label": "別の文字が混ざったホスト名",
    "risk.punycode.body": "見た目が似た文字を使って、本物のドメインに見せかけることがあります。xn-- で始まる部分は、そのまま読める文字ではありません。",
    "risk.port.label": "ふつうと違うポート番号",
    "risk.port.body": "80と443以外が指定されています。おかしいとは限りませんが、公式の案内にあるかを確かめてください。",
    "risk.plainHttp.label": "暗号化されていない通信",
    "risk.plainHttp.body": "http:// は途中で読まれたり書き換えられたりします。https:// の版があるかを確かめてください。",
    "risk.shortener.label": "短縮URL",
    "risk.shortener.body": "行き先が見えません。このツールは展開しないので、開いたあとのURLに追跡用の値が残ることがあります。",
    "risk.openRedirect.label": "別のURLを連れている",
    "risk.openRedirect.body": "パラメーターの中に別のURLが入っています。踏み台にして知らないサイトへ送る手口に使われます。行き先を確かめてください。",

    "modal.title": "URLPurifier のヘルプ",
    "help.about.title": "🎯 このツールについて",
    "help.about.body": "URLに付いてくる追跡用の値を落として、短いリンクに戻します。処理はすべてブラウザーの中で終わり、入力したURLはどこへも送りません。",
    "help.use.title": "📝 使い方",
    "help.use.step1html": "<strong>貼る</strong>：上の欄にURLを貼ります。複数行をまとめて処理できます。",
    "help.use.step2html": "<strong>選ぶ</strong>：必要なら「Amazonのリンクを短くする」と「詳細除去モード」を入れます。",
    "help.use.step3html": "<strong>押す</strong>：「クリーン化」を押すと、結果と、消したものの内訳が出ます。",
    "help.use.step4html": "<strong>確かめる</strong>：「貼る前に見ておきたい点」が出たときは、行き先を確かめてから使ってください。",

    "help.remove.title": "🔍 消すもの",
    "help.remove.commonhtml": "<strong>いつも消す</strong>：<code>utm_*</code>（流入元）、<code>fbclid</code>、<code>gclid</code>、<code>dclid</code>、<code>msclkid</code>、<code>yclid</code>、<code>mc_cid</code>、<code>_hsenc</code>、<code>igshid</code>、<code>spm</code> など。",
    "help.remove.sitehtml": "<strong>サイト別</strong>：YouTube の <code>si</code>・<code>feature</code>、X の <code>t</code>・<code>s</code>、Instagram の <code>igsh</code>、Spotify の <code>si</code>、TikTok の <code>is_from_webapp</code>、Facebook の <code>mibextid</code> など。そのサイトでだけ落とします。",
    "help.remove.strricthtml": "<strong>詳細除去モード</strong>：<code>ttclid</code>、<code>twclid</code>、<code>li_fat_id</code>、<code>campaign</code>、<code>adgroup</code>、<code>ref_src</code> など。サイトによっては動きが変わることがあります。",
    "help.remove.amazonhtml": "<strong>Amazonモード</strong>：<code>tag</code>、<code>ref</code>、<code>psc</code>、<code>keywords</code> などを落とし、<code>/dp/ASIN</code> の形へそろえます。",
    "help.remove.fragmenthtml": "<strong>＃以降</strong>：<code>#utm_source=</code> のような値と、読んでいた位置が残る <code>#:~:text=</code> を外します。ふつうのアンカー（<code>#chapter-2</code>）は残します。",

    "help.keep.title": "🧷 消さないもの",
    "help.keep.body": "消すと意味が変わる値は残します。検索語、記事の番号、ページ番号、YouTubeの再生位置などです。同じ名前でも、サイトが違えば残します。たとえば t= は X では落としますが、ほかのサイトでは触りません。",

    "help.risk.title": "⚠️ 貼る前に見ておきたい点",
    "help.risk.body": "消す対象ではないけれど、知らないと損をするものを挙げます。URLに利用者名が入っている、xn-- で始まるホスト名、ふつうと違うポート番号、http のまま、短縮URL、パラメーターが別のURLを連れている、の6つです。",

    "help.privacy.title": "🔒 プライバシーと、このツールの限界",
    "help.privacy.local": "入力したURLは外へ送りません。保存もしません。Cookieも使いません。",
    "help.privacy.scheme": "http と https 以外は浄化しません。javascript: や data: は、貼った先で動く危険があるため、出力しません。",
    "help.privacy.shortener": "短縮URLは展開しません。開いた先で追跡用の値が付くことがあります。",
    "help.privacy.frame": "クリックジャッキング対策の frame-ancestors は、meta要素のCSPでは効きません。静的ホスティングではHTTPヘッダーを足せないため、このツールでは指定していません。",

    "footer.repo": "🔗 GitHubリポジトリはこちら"
  },

  en: {
    "app.title": "URLPurifier - clean up your links",
    "app.subtitle": "Strip the tracking values that ride along with a URL, and get a short link back",
    "lang.toggle": "日本語",
    "lang.toggleTitle": "Switch to Japanese",
    "theme.toggle": "Switch theme",
    "theme.toggleTitle": "Switch between light and dark",
    "help.open": "Help",
    "common.close": "Close",

    "form.inputLabel": "Paste URLs (one per line)",
    "form.inputPlaceholder": "For example:\nhttps://www.amazon.co.jp/dp/B0XXXXXXX/ref=sr_1_1?keywords=test\nhttps://example.com/article?utm_source=twitter&fbclid=xxx",
    "form.amazonMode": "Shorten Amazon links to the /dp/ASIN form",
    "form.strictMode": "Thorough mode (also drop advertising and mailing values)",
    "form.clean": "Clean",
    "form.clear": "Clear",
    "form.outputLabel": "Result",
    "form.outputPlaceholder": "The result appears here",
    "form.copy": "Copy result",
    "form.copied": "Copied",

    "summary.title": "What gets removed (in short)",
    "summary.common": "Always: tracking values such as utm_*, fbclid, gclid, dclid and msclkid",
    "summary.site": "Per site: the sharing identifiers added by YouTube, X, Instagram, Spotify, TikTok and Facebook",
    "summary.amazon": "Amazon mode: drops tag, ref and friends, and reduces the link to /dp/ASIN",
    "summary.strict": "Thorough mode: also drops values used by mailing and ad measurement",
    "summary.fragment": "After the #: values such as #utm_source=, and #:~:text= which reveals where you were reading",

    "toast.cleaned": "Cleaned {count} URL(s)",
    "toast.noChange": "There was nothing to change",
    "toast.errors": "{count} line(s) were left out: {reason}{more}",
    "toast.errorsMore": " and others",
    "toast.failed": "Something went wrong while processing",
    "toast.copied": "Copied to the clipboard",
    "toast.copyFailed": "Could not copy. Please select the text and copy it by hand",
    "toast.processing": "Processing {count} URLs...",
    "toast.processingShort": "Working...",

    "error.scheme": "{scheme}: is not handled (only http and https are cleaned)",
    "error.notUrl": "This does not read as a URL",
    "error.invalid": "The URL is not well formed",
    "error.unknown": "Cannot process this",

    "stats.total": "URLs processed",
    "stats.changed": "URLs changed",
    "stats.removed": "Parameters removed",
    "stats.errors": "Left out",
    "preview.title": "{count} long URL(s)",
    "preview.more": "and {count} more",

    "report.removedTitle": "What was removed ({count})",
    "report.riskTitle": "Worth a look before you paste this ({count})",
    "report.inFragment": "after the #",
    "report.times": "{count} times",

    "note.utm": "Records where the visit came from, telling the destination which ad or post you clicked",
    "note.fbclid": "Facebook's click identifier. It can follow an individual person",
    "note.gclid": "Google Ads click identifier, used to measure ad performance",
    "note.msclkid": "Microsoft Advertising click identifier",
    "note.yclid": "Yandex click identifier",
    "note.igshid": "Instagram sharing identifier. It reveals whose share you came from",
    "note.mailchimp": "Mailchimp campaign and subscriber identifiers. They identify the recipient",
    "note.hubspot": "HubSpot tracking data, tied to email and behaviour history",
    "note.ttclid": "TikTok click identifier",
    "note.twclid": "X click identifier",
    "note.linkedin": "LinkedIn advertising identifier",
    "note.matomo": "Matomo (analytics) record of where the visit came from",
    "note.vero": "Recipient identifier from an email delivery service",
    "note.spm": "Record of what you clicked inside a site (mainly Alibaba)",
    "note.scid": "Delivery service identifier",
    "note.si": "Identifier added when sharing. It reveals whose share you came from",
    "note.shareToken": "A short-lived value used to trace the share back",
    "note.affiliate": "Affiliate identifier, used to attribute a commission",
    "note.mibextid": "Facebook's internal record of the path you took",
    "note.appOrigin": "Record of which app opened the link",
    "note.shareOrigin": "Record of how the link was shared",
    "note.deviceId": "A value used to tell devices and browsers apart",
    "note.textFragment": "A pointer to the exact passage you were reading",
    "note.generic": "A value that is sometimes used for tracking",

    "risk.userinfo.label": "A user name is embedded in the URL",
    "risk.userinfo.body": "What comes before the @ is not the site. A convincing name can be placed there to lead you somewhere else. Read the host name right after the @.",
    "risk.punycode.label": "The host name contains encoded characters",
    "risk.punycode.body": "Look-alike characters can be used to imitate a real domain. A part starting with xn-- is not what it appears to spell.",
    "risk.port.label": "An unusual port number",
    "risk.port.body": "Something other than 80 or 443 is specified. That is not wrong in itself, but check it against the official instructions.",
    "risk.plainHttp.label": "The connection is not encrypted",
    "risk.plainHttp.body": "With http:// the traffic can be read or altered on the way. Check whether an https:// version exists.",
    "risk.shortener.label": "A shortened URL",
    "risk.shortener.body": "You cannot see where it goes. This tool does not expand it, so tracking values may be waiting at the other end.",
    "risk.openRedirect.label": "It carries another URL",
    "risk.openRedirect.body": "One of the parameters contains a second URL. This is how a trusted link gets used to send you somewhere unknown. Check where it leads.",

    "modal.title": "URLPurifier help",
    "help.about.title": "🎯 About this tool",
    "help.about.body": "It strips the tracking values that ride along with a URL and gives you a short link back. Everything happens inside your browser, and the URLs you type are never sent anywhere.",
    "help.use.title": "📝 How to use it",
    "help.use.step1html": "<strong>Paste</strong>: put your URLs in the box above. Several lines are processed at once.",
    "help.use.step2html": "<strong>Choose</strong>: turn on \"shorten Amazon links\" or \"thorough mode\" if you need them.",
    "help.use.step3html": "<strong>Press</strong>: \"Clean\" gives you the result and a list of what was removed.",
    "help.use.step4html": "<strong>Check</strong>: when something appears under \"worth a look\", confirm where the link goes before you use it.",

    "help.remove.title": "🔍 What gets removed",
    "help.remove.commonhtml": "<strong>Always</strong>: <code>utm_*</code> (where the visit came from), <code>fbclid</code>, <code>gclid</code>, <code>dclid</code>, <code>msclkid</code>, <code>yclid</code>, <code>mc_cid</code>, <code>_hsenc</code>, <code>igshid</code>, <code>spm</code> and similar.",
    "help.remove.sitehtml": "<strong>Per site</strong>: <code>si</code> and <code>feature</code> on YouTube, <code>t</code> and <code>s</code> on X, <code>igsh</code> on Instagram, <code>si</code> on Spotify, <code>is_from_webapp</code> on TikTok, <code>mibextid</code> on Facebook. These are dropped only on those sites.",
    "help.remove.strricthtml": "<strong>Thorough mode</strong>: <code>ttclid</code>, <code>twclid</code>, <code>li_fat_id</code>, <code>campaign</code>, <code>adgroup</code>, <code>ref_src</code> and similar. On some sites this can change how a link behaves.",
    "help.remove.amazonhtml": "<strong>Amazon mode</strong>: drops <code>tag</code>, <code>ref</code>, <code>psc</code>, <code>keywords</code> and reduces the link to <code>/dp/ASIN</code>.",
    "help.remove.fragmenthtml": "<strong>After the #</strong>: values such as <code>#utm_source=</code>, and <code>#:~:text=</code> which records the passage you were reading. An ordinary anchor (<code>#chapter-2</code>) is kept.",

    "help.keep.title": "🧷 What is kept",
    "help.keep.body": "Values that change the meaning of a link are kept: search terms, article and page numbers, the playback position on YouTube. The same name is treated differently per site. For instance t= is dropped on X but left alone elsewhere.",

    "help.risk.title": "⚠️ Worth a look before you paste",
    "help.risk.body": "These are not removed, but they are worth knowing about: a user name embedded in the URL, a host name starting with xn--, an unusual port number, plain http, a shortened URL, and a parameter carrying another URL.",

    "help.privacy.title": "🔒 Privacy, and what this tool cannot do",
    "help.privacy.local": "The URLs you type are not sent anywhere, not stored, and no cookies are used.",
    "help.privacy.scheme": "Only http and https are cleaned. javascript: and data: are never emitted, because they can run wherever you paste them.",
    "help.privacy.shortener": "Shortened URLs are not expanded. Tracking values may be added at the other end.",
    "help.privacy.frame": "frame-ancestors, the clickjacking defence, has no effect in a meta CSP. Static hosting cannot add HTTP headers, so this tool does not set it.",

    "footer.repo": "🔗 GitHub repository"
  }
};

class I18n {
  constructor() {
    // 言語の決め方は、URLの ?lang、保存した設定、ブラウザーの言語の順
    this.storageKey = "urlpurifier:lang";
    this.language = this.detectLanguage();
  }

  detectLanguage() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "ja" || fromUrl === "en") return fromUrl;

    const saved = this.readSaved();
    if (saved === "ja" || saved === "en") return saved;

    const browser = (navigator.language || "").toLowerCase();
    return browser.startsWith("ja") ? "ja" : "en";
  }

  // 保存を拒否する環境（プライベートウィンドウなど）でも画面を止めない
  readSaved() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (e) {
      return null;
    }
  }

  writeSaved(language) {
    try {
      localStorage.setItem(this.storageKey, language);
      return true;
    } catch (e) {
      return false;
    }
  }

  t(key, params = {}) {
    const table = MESSAGES[this.language] || MESSAGES.ja;
    let text = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
    return text;
  }

  apply(root = document) {
    document.documentElement.lang = this.language;

    for (const el of root.querySelectorAll("[data-i18n]")) {
      el.textContent = this.t(el.dataset.i18n);
    }

    // 辞書の中身だけを入れる。利用者の入力はここへ渡さない
    for (const el of root.querySelectorAll("[data-i18n-html]")) {
      el.innerHTML = this.t(el.dataset.i18nHtml);
    }

    for (const el of root.querySelectorAll("[data-i18n-attr]")) {
      for (const pair of el.dataset.i18nAttr.split(",")) {
        const [attr, key] = pair.split(":").map((part) => part.trim());
        if (attr && key) el.setAttribute(attr, this.t(key));
      }
    }

    const title = document.querySelector("title");
    if (title) title.textContent = this.t("app.title");
  }

  // 切り替えは読み込み直し。入力中の文字と結果は window.name で持ち越す。
  // localStorage へ入れないのは、このツールが「保存しない」と言っているため。
  setLanguage(language) {
    if (language !== "ja" && language !== "en") return;
    this.writeSaved(language);

    const valueOf = (id) => {
      const field = document.getElementById(id);
      return field ? field.value : "";
    };
    try {
      window.name = JSON.stringify({ urlpurifier: { input: valueOf("inputUrls"), output: valueOf("outputUrls") } });
    } catch (e) {
      window.name = "";
    }

    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    location.assign(url.toString());
  }

  restoreCarriedState() {
    let carried = null;
    try {
      carried = (JSON.parse(window.name || "{}") || {}).urlpurifier || null;
    } catch (e) {
      carried = null;
    }
    window.name = "";
    if (!carried) return;

    for (const [id, value] of [["inputUrls", carried.input], ["outputUrls", carried.output]]) {
      const field = document.getElementById(id);
      if (field && value) field.value = value;
    }
  }
}

window.MESSAGES = MESSAGES;
window.I18n = I18n;
window.i18n = new I18n();
