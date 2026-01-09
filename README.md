# 言い訳ジェネレーター

中高大学生をターゲットにした「言い訳ジェネレーター」Webアプリです。
AIが状況に応じた説得力のある言い訳を生成します。

## 機能

- **10個のシチュエーション**: 学校、友達、恋愛、バイトの4カテゴリー
- **もっともらしさレベル調整**: 真面目 / 普通 / ちょいふざけ / 完全ネタ
- **コピー機能**: ワンクリックでクリップボードにコピー
- **再生成機能**: 気に入らなければ何度でも再生成
- **SNSシェア**: X(Twitter)でシェア可能
- **生成履歴**: 過去5件の履歴を保存

## 技術スタック

- **Frontend**: Next.js 16 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **AI**: Claude Haiku 4.5 (Anthropic API)
- **Deploy**: Vercel

## セットアップ

1. リポジトリをクローン

```bash
git clone https://github.com/your-username/iiwake-generator.git
cd iiwake-generator
```

2. 依存関係をインストール

```bash
npm install
```

3. 環境変数を設定

`.env.local` ファイルを作成し、Anthropic APIキーを設定:

```
ANTHROPIC_API_KEY=your_api_key_here
```

4. 開発サーバーを起動

```bash
npm run dev
```

http://localhost:3000 でアプリが起動します。

## デプロイ

Vercelにデプロイする場合:

1. GitHubリポジトリをVercelに接続
2. 環境変数 `ANTHROPIC_API_KEY` を設定
3. デプロイ

## ライセンス

MIT
