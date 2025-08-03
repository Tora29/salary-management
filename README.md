# 給料・資産管理アプリ

個人の給料と資産（株式）を一元管理するWebアプリケーション。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

必要に応じて `.env` ファイルの値を変更してください。

### 3. データベースの起動

```bash
# PostgreSQLコンテナの起動
docker-compose up -d

# pgAdminも起動する場合（開発時のデバッグ用）
docker-compose --profile debug up -d
```

### 4. データベースのマイグレーション

```bash
# Prismaクライアントの生成
npx prisma generate

# マイグレーションの実行
npx prisma migrate dev
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:5173 でアプリケーションにアクセスできます。

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# コード品質チェック
npm run lint        # ESLint
npm run format      # Prettier
npm run check       # TypeScript型チェック

# テスト
npm test           # Vitestユニットテスト
npm run test:e2e   # Playwrightテスト
```

## データベース管理

```bash
# Prisma Studio（DBのGUI）
npx prisma studio

# マイグレーション作成
npx prisma migrate dev --name <migration-name>

# DBリセット
npx prisma migrate reset
```

## プロジェクト構造

- `/src/routes` - SvelteKitのルーティング
- `/src/lib/components` - 再利用可能なコンポーネント
- `/src/lib/data` - データ型とダミーデータ
- `/src/lib/utils` - ユーティリティ関数
- `/prisma` - Prismaスキーマとマイグレーション

## 技術スタック

- **Framework**: Svelte 5 + SvelteKit
- **Database**: PostgreSQL (Docker)
- **ORM**: Prisma
- **Styling**: TailwindCSS
- **Icons**: Lucide Svelte
