# Research Dataset Finder

研究テーマや欲しいデータセット条件を入力すると、OpenAI API + Web Search を使って関連データセット候補を関連度順に表示するWebアプリです。

## Setup

```bash
npm install
cp .env.example .env
```

`.env` にAPIキーを設定してください。

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1
PORT=3000
```

## Run

```bash
npm start
```

ブラウザで `http://localhost:3000` を開いて利用できます。

## Features

- 入力した研究内容に合わせてデータセット候補を複数提案
- 各候補に以下を表示
  - タイトル
  - URL
  - 使われている論文
  - データ形式
  - データセット説明
  - 推薦理由
- 関連度スコア順に並び替え
