# Supabase MCPセットアップガイド

このガイドでは、Salary ManagementプロジェクトでSupabase MCPを設定する手順を説明します。

## 前提条件

- Node.js v22.14.0以上がインストール済み ✅
- npmがインストール済み ✅
- Supabaseアカウント（無料プランでOK）

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成/ログイン
2. 「New project」をクリックして新しいプロジェクトを作成
3. プロジェクト名: `salary-management`（推奨）
4. データベースパスワードを設定（安全な場所に保存）
5. リージョンを選択（東京リージョン推奨）

### 2. プロジェクト情報の取得

#### Project Reference IDの取得
1. Supabaseダッシュボードで作成したプロジェクトを開く
2. 左サイドバーの「Project Settings」をクリック
3. 「General」タブを選択
4. 「Reference ID」をコピー（例: `abcdefghijklmnop`）

#### Personal Access Tokenの作成
1. [アカウントトークンページ](https://supabase.com/dashboard/account/tokens)にアクセス
2. 「Generate new token」をクリック
3. トークン名を入力（例: `salary-management-mcp`）
4. 生成されたトークンをコピー（**重要**: このトークンは二度と表示されません）

### 3. .mcp.jsonファイルの更新

`.mcp.json`ファイルを開いて、以下の値を更新します：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF_HERE"  // ← ここを更新
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE"  // ← ここを更新
      }
    }
  }
}
```

### 4. 環境変数の設定（オプション）

セキュリティを高めるため、`.env`ファイルに認証情報を保存することも可能です：

```bash
# .env.local（gitignoreに追加済み）
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 管理操作用（オプション）
```

### 5. データベースのマイグレーション

既存のローカルデータベースをSupabaseに移行する場合：

1. Supabaseダッシュボードで「SQL Editor」を開く
2. データベーススキーマをPrismaから生成して実行
3. 必要に応じてテストデータをインポート

### 6. 接続テスト

MCP Serverの動作確認：

```bash
# 直接実行してテスト
npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=YOUR_PROJECT_REF
```

エラーが出なければ設定成功です！

## セキュリティ設定

### Read-Onlyモード（推奨）
デフォルトで`--read-only`フラグが設定されており、データベースへの書き込み操作を防ぎます。

### プロジェクトスコープ
`--project-ref`パラメータにより、特定のプロジェクトのみアクセス可能になります。

## 利用可能なツール

設定が完了すると、AIアシスタント（Claude、Cursor等）から以下のツールが利用可能になります：

- **プロジェクト管理**: プロジェクト一覧、詳細取得
- **データベース操作**: テーブル一覧、SQLクエリ実行（読み取り専用）
- **ログ確認**: 各種サービスのログ取得
- **ドキュメント検索**: Supabaseドキュメントの検索

## トラブルシューティング

### エラー: "Invalid access token"
→ Personal Access Tokenが正しくコピーされているか確認

### エラー: "Project not found"
→ Project Reference IDが正しいか確認

### エラー: "Permission denied"
→ Read-Onlyモードでwrite操作を試みていないか確認

## 次のステップ

1. Supabase Authの設定（ユーザー認証）
2. Row Level Security (RLS)の設定
3. Edge Functionsの活用
4. Realtime機能の実装

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase MCP Server GitHub](https://github.com/supabase-community/supabase-mcp)
- [Model Context Protocol仕様](https://modelcontextprotocol.io)