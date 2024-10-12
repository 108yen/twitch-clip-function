# 使用するNode.jsのバージョンを指定
FROM node:20-slim

# 作業ディレクトリを指定
WORKDIR /usr/src/app

# 依存関係をコピーしてパッケージをインストール
COPY package.json ./
RUN pnpm install

# TypeScriptのソースコードをコピーしてコンパイル
COPY . .
RUN pnpm build

# コンテナ起動時に実行されるコマンドを指定
CMD [ "pnpm", "start" ]
