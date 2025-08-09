# URLPurifier - URL浄化ツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/urlpurifier?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/urlpurifier?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/urlpurifier)
![GitHub license](https://img.shields.io/github/license/ipusiron/urlpurifier)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/urlpurifier/)

**Day039 - 生成AIで作るセキュリティツール100**

---

## 📝 はじめに

SNSやブログで誰かにAmazonやニュースサイトのリンクを共有するとき、  
「やたら長いリンク」「アフィリエイトタグやトラッキング情報がべったり付いているリンク」に出会ったことはありませんか？

**URLPurifier**は、そんな冗長なURLを1クリックで浄化し、**純粋で安全なリンクだけ**を残すことにこだわったWebツールです。

---

## 🎯 本ツールの狙い・想定シーン

- SNSやチャットで「見栄えの良いリンク」を共有したい
- Amazonアフィリエイトリンクを一発で正規商品URLに直したい
- コミュニティで「トラッキングなしリンク」を推奨している
- URLに付随する`utm_*`や`ref`などの“追跡要素”を排除したい
- セキュリティ啓発やプライバシー教育の教材として活用したい

「余計なものはいらない、**純度100%のリンク**を。」  
そんなニーズに応えます。

---

## 🚀 特徴・仕様

- **主要なトラッキングパラメーターの自動除去**
  - `utm_source`, `utm_medium`, `utm_campaign`, `fbclid`, `gclid` ほか多数
- **Amazon専用最短化モード**
  - アフィリエイトタグ(`tag=`)や`ref=`を削除し、`/dp/ASIN`形式に変換
- **複数URL同時処理＆一括コピー**
- **完全クライアントサイド動作**
  - URLは外部送信されず、ブラウザ内で処理完結
- **軽量でシンプルなUI**
  - 初心者でも迷わず操作可能

---

## ⚙️ 使い方

1. 変換したいURLをテキストエリアに入力（複数行OK）
2. 「Amazonアフィリエイト除去モード」を必要に応じてON
3. 「クリーン化」ボタンを押す
4. 出力結果をコピーして利用

> 📌 **TIP:** このツールはすべてブラウザ内で処理され、サーバへの送信は一切行いません。

---

## 💡 開発の背景・こだわりポイント

- **なぜ作ったか？**  
  URLを短くするだけで情報共有の印象が大きく改善されることを、多くの場面で体感したためです。
- **既存ツールの不満点を解消**
  - 重い、広告が多い、日本語対応が不十分、Amazon最短化が別ツール…  
    そんな不満をまとめて解消しました。
- **教育用途も意識**
  - 余計なパラメーターが何のために付いているのかを学び、URLの構造理解を深められます。

---

## 🏷️ ツール名の由来

**URLPurifier**（ユアールエル・ピュリファイア）は、「浄化する」「純化する」を意味する"Purify"に由来します。  
URLから不要な追跡情報やアフィリエイトタグを取り除き、**ピュアな形**に戻すという目的を表しています。  

TrimURLやURLTrimmerなどの候補もありましたが、「純化」のニュアンスをもっとも的確に表すこの名前を採用しました。

---

## 📂 ディレクトリー構成

```
```

---

## 🛠 技術メモ

- 使用技術: HTML, CSS, JavaScript（Vanilla）
- 正規表現によるパラメーター検出＆削除
- Amazon URL構造解析（ASIN抽出）を実装

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。  
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
