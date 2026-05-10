# 開発ドキュメント

UE長崎公式サイトの開発情報です。

## 技術スタック

- **3D**: Three.js (CDN) — ローポリ群島シーン、海・星・光柱アニメーション
- **静的サイト生成**: Pelican + Markdown — イベント記事管理
- **スタイル**: Pure CSS (Noto Sans JP) — カスタムプロパティ、レスポンシブ
- **パッケージ管理**: uv — Python依存管理
- **デプロイ先**: GitHub Pages — gh-pagesブランチ

## 開発

専用のスクリプト `serve.sh` を使用して、環境構築・ビルド・サーバー起動を行うことができます。実行権限がない場合は `chmod +x serve.sh` で付与してください。

```bash
# 初回セットアップ〜ビルド〜ローカルサーバー起動までを一括実行する場合
./serve.sh setup-serve

# 通常の開発時（変更を反映してビルドし、サーバーを起動）
./serve.sh

# 特定のポートで起動する場合
./serve.sh serve 8181
```

## ディレクトリ構成

```
content/
  events/       ← Markdownイベント記事 (ue01.md, ue02.md, ...)
  images/       ← 画像アセット (favicon.svg, ogp.svg)
themes/
  ue_nagasaki/
    templates/  ← Jinja2テンプレート (base, index, archives, article)
    static/
      css/      ← style.css (トップ), events.css (イベント)
      js/       ← main.js (Three.jsシーン)
pelicanconf.py  ← Pelican開発設定
publishconf.py  ← Pelican本番設定
build.py        ← events.json生成スクリプト
```

## 3Dシーン仕様

- **群島構成**: 4つの島（Top / About / Event / Contact）を円環配置
- **操作**: ホイール・キーボード（←→）・タッチスワイプ・島クリック
- **オートプレイ**: 6秒放置で次の島へ回転
- **ビジュアル**: ローポリプリミティブ組み合わせ、夜・霧・星・波アニメーション
- **各島モチーフ**:
  - Top: 灯台・桟橋・船影
  - About: 階段状台地・工房・小屋・暖色窓
  - Event: ステージ・旗（揺れ）・コンテナ・屋台
  - Contact: 通信塔・アンテナ・点滅信号灯・桟橋
- **中央海域**: 半透明光柱・台座・パルスアニメーション

## イベント管理

### 新規イベントの追加手順

1. `content/events/` に新しいMarkdownファイルを作成
2. `content/events/sample/` のテンプレート `_template_event.md` をコピーして使用
3. フロントマターを記入：

```markdown
Title: 【長崎】イベント名
Date: 2026-06-14
Slug: event-slug
Thumbnail: images/events/ue01.jpg
Summary: イベントの概要
Connpass: https://ue-ngs.connpass.com/event/000000/
```

4. サムネイル画像を `content/images/events/` に配置
5. `./serve.sh build` でビルド
6. `output/events.json` が更新され、トップページの「NEXT EVENT」に反映

### イベント実施後のレポート追加手順

1. 既存のイベントファイルを開く
2. フロントマターに `EventStatus: report` を追加
3. 本文に「開催レポート」セクションを追加：

```markdown
## 開催レポート {#report}

### 参加者

- 参加人数: X名
- 初参加: X名

### 活動内容

- 活動内容1
- 活動内容2

### 写真

（イベント写真を追加）
```

4. `content/events/sample/` のテンプレート `_template_report.md` を参考に構成
5. `./serve.sh build` でビルド
6. イベント詳細ページに「開催済み」バッジが表示される

### イベントデータ構造

各イベント記事は以下のフロントマターを含みます:

```markdown
Title: UE長崎 #01 もくもく会
Date: 2026-06-14
Slug: ue01
Thumbnail: images/events/ue01.jpg
Summary: 初回もくもく会の様子です。
Connpass: https://ue-ngs.connpass.com/event/388933/
EventStatus: report  # 実施後に追加
```

`build.py` がこれらを解析し `output/events.json` を生成します。トップページのEvent島はこのJSONをfetchして「NEXT EVENT」を動的に表示します。

## URL構成

- `/` — トップページ（3D群島）
- `/events/` — イベント一覧
- `/events/{slug}/` — イベント詳細
