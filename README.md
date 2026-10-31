# ミスター秘密侵入VR 公式マニュアルサイト

公開URL: https://mr-vr-jp.github.io/mrsecret-vr/ （英語 `/en/`、簡体字中国語 `/zh/`）

## 公開の仕組み

- GitHub Pages（リポジトリ `mr-vr-jp/mrsecret-vr`）。`main` ブランチの直下をそのまま公開する（Pages の設定は「Deploy from a branch」・`main` / `(root)`）。
- `main` へ push すると、GitHub が自動でサイトを作り直して公開する。手元から別の経路で公開する仕組みは無いので、本番とGitの `main` は同じ内容になる。
- `main` への push で `.github/workflows/remove-comments.yml` も動くが、途中で作る `node_modules` まで変更と見なし、GitHubの権限で push を拒否されて失敗する（2026-11-01に確認。どの push でも同じ）。公開には影響しない。書き込み権限を与えると `node_modules` が `main` へ入るので、権限だけを変えない。
- push の成功と公開の成功は別。push 後に、リポジトリの Actions の「pages build and deployment」が成功したことと、公開URLで変更が見えることを確かめる。

## ページの作り方

各ページのHTMLは手で直さず、作業フォルダ `既存サイト/ウェブサイト/mrsecret-vr-redesign-work` のツールで書き出す。

- 本文: `src/ja/`・`src/en/`・`src/zh/`
- 書き出し: `python -I -X utf8 tools/build.py`
- 確認: `tools/shoot.py`（画面幅ごとの表示）、`tools/interact.py`（タブ・折りたたみ等を実際に押す）

詳しくは作業フォルダの README を参照。

## 確認用に手元で見る

`既存サイト/ウェブサイト` を起点に簡単なWebサーバーを立てて開く。

```
python -m http.server 8737 --bind 127.0.0.1
```

`http://127.0.0.1:8737/mrsecret-vr-redesign/index.html`
