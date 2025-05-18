---
mode: "agent"
tools:
  [
    "codebase",
    "githubRepo",
    "getProblems",
    "terminalSelection",
    "terminalLastCommand",
  ]
---

`pnpm test:ci`を実行し、テストカバレッジが不足している機能を特定して、不足しているテストケースを作成してください。
`pnpm test:ci`の実行は時間がかかるので、結果が出るまでは待機してください。
main関数のテストは不要です。

# 補足

`index.ts`などでまとめられている場合は、一番コンパクトになるパスからインポートするようにしてください。indexからインポートするとエラーが発生するのでやめてください。
テストの実行は`pnpm test:ci`で実行し、プレフィックスなどの追加のオプションをつけないでください。
`it`ではなく`test`を使用してください。
