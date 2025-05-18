---
applyTo: "test/**"
---

# 概要

テストに関する説明を記載します。

# フォルダ

`test/`配下に配置されます。
`test/`フォルダは以下のような構成になっています。

```bash
test/
  ├─ apies/                 # APIテスト
  ├─ firebase-functions/    # Functionsテスト
  ├─ streamer-selection/    # ストリーマー選定テスト
  ├─ test_data/             # テスト用データ
  └─ utils/                 # ユーティリティテスト
```

# ツール

testはJestを使用して実施しています。
DBにfirestoreを使用しているため、Firestoreのエミュレーターを使用してテストを実施しています。
以下のコマンドでエミュレーターの起動およびテストの実行が可能です。
同時にカバレッジも出力されます。

```bash
pnpm test:ci
```
