# 使用するNode.jsのバージョンを指定
FROM node:20.10.0

# 作業ディレクトリを指定
WORKDIR /usr/src/app

# 依存関係をコピーしてパッケージをインストール
COPY package.json ./
RUN npm install

# TypeScriptのソースコードをコピーしてコンパイル
COPY . .
RUN npm run build

# コンテナ起動時に実行されるコマンドを指定
CMD [ "npm", "start" ]
