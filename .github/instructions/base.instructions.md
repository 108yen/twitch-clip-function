---
applyTo: "**"
---

# 概要

このリポジトリは、TwitchのClipをランキング形式で表示するアプリケーションで使用するデータを生成するバッチプログラムです。
TwitchAPIを使用してデータを取得、成形し、Firestoreに保管します。
lintエラーが起きた場合は、一度保存してルールを適用してください。

## フォルダ構成

```plaintext
src/                        # アプリケーション本体
  ├─ index.ts               # エントリポイント
  ├─ apis/                  # Twitch APIや独自APIのラッパー
  │   ├─ clip.ts            # クリップ取得API
  │   ├─ streamer.ts        # ストリーマー情報API
  │   └─ twitchApi.ts       # Twitch API共通処理
  ├─ constant/              # 定数管理
  │   ├─ blacklist.ts       # ブラックリスト定義
  │   ├─ clips.ts           # クリップ関連定数
  │   ├─ range-date.ts      # 日付範囲定数
  │   └─ streamer.ts        # ストリーマー定数
  ├─ converters/            # Firestore用データ変換
  │   ├─ clipDocConverter.ts
  │   └─ streamerConverter.ts
  ├─ firebase-functions/    # Firebase Functions関連
  │   ├─ index.ts
  │   ├─ clip/              # クリップ関連Functions
  │   │   ├─ clipFunction.ts
  │   │   ├─ updateEachPeriodsRanking/
  │   │   │   ├─ updateAllRanking.ts
  │   │   │   ├─ updateDayRanking.ts
  │   │   │   ├─ updateMonthRanking.ts
  │   │   │   ├─ updateWeekRanking.ts
  │   │   │   ├─ updateYearRanking.ts
  │   │   │   └─ logic/     # ランキング集計ロジック
  │   │   └─ updatePastRanking/
  │   │       ├─ index.ts
  │   │       └─ updatePastRankingLogic.ts
  │   ├─ revalidate/        # キャッシュ再検証
  │   ├─ streamer/          # ストリーマー関連Functions
  │   │   ├─ index.ts
  │   │   └─ streamerSelection/
  │   │       ├─ index.ts
  │   │       └─ streamerSelectionLogic.ts
  │   └─ twitter/           # Twitter連携
  │       ├─ index.ts
  │       └─ tweet.ts
  ├─ firestore-refs/        # Firestoreリファレンス管理
  │   ├─ clipRefs.ts
  │   ├─ db.ts
  │   └─ streamerRefs.ts
  ├─ models/                # 型定義
  │   ├─ clip.ts
  │   ├─ clipDoc.ts
  │   ├─ stream.ts
  │   ├─ streamer.ts
  │   ├─ team.ts
  │   └─ token.ts
  ├─ repositories/          # Firestore操作リポジトリ
  │   ├─ batch.ts
  │   ├─ clip.ts
  │   └─ streamer.ts
  └─ utils/                 # 汎用ユーティリティ
      ├─ dayjs.ts
      └─ logEntry.ts

test/                       # テストコード
  ├─ apies/                 # APIテスト
  ├─ firebase-functions/    # Functionsテスト
  ├─ streamer-selection/    # ストリーマー選定テスト
  ├─ test_data/             # テスト用データ
  └─ utils/                 # ユーティリティテスト

functions/                  # サービスアカウント等の鍵ファイル
  └─ keys/                  # 各種認証鍵

scripts/                    # バッチ・スクリプト
  └─ update-test-data.ts    # テストデータ更新用スクリプト
```

# 機能

## DB

DBとしてfirestoreを使用しています。
