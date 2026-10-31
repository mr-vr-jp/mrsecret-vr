# ミスター秘密侵入VR 公式マニュアルサイト

公開URL: https://mr-vr-jp.github.io/mrsecret-vr/ （英語 `/en/`、簡体字中国語 `/zh/`）

## 公開の仕組み

- GitHub Pages（リポジトリ `mr-vr-jp/mrsecret-vr`）。`main` ブランチの直下をそのまま公開する（Pages の設定は「Deploy from a branch」・`main` / `(root)`）。
- `main` へ push すると、GitHub が自動でサイトを作り直して公開する。手元から別の経路で公開する仕組みは無いので、本番とGitの `main` は同じ内容になる。
- push の成功と公開の成功は別。push 後に、リポジトリの Actions の「pages build and deployment」が成功したことと、公開URLで変更が見えることを確かめる。

## ページの作り方

このリポジトリのHTMLは書き出し物なので、手で直さない。直すと次の書き出しで上書きされる。正本は非公開リポジトリ `mr-vr-jp/vr-private-monorepo` の `作品制作/mrsecret-vr-site`。

1. `作品制作/mrsecret-vr-site/src/ja`・`src/en`・`src/zh` の本文を直す。
2. `python -I -X utf8 tools/build.py` で、このリポジトリへ書き出す。
3. `tools/shoot.py`（画面幅ごとの表示）と `tools/interact.py`（タブ・折りたたみ等を実際に押す）で確かめる。
4. このリポジトリで変更をコミットし、`main` へ push する。

詳しくは生成元の README を参照。

## 確認用に手元で見る

`既存サイト/ウェブサイト` を起点に簡単なWebサーバーを立てて開く。

```
python -m http.server 8737 --bind 127.0.0.1
```

`http://127.0.0.1:8737/mrsecret-vr/index.html`
