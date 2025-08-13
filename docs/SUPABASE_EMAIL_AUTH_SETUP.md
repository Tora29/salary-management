# Supabase メール認証セットアップガイド

## 📧 メール認証機能の有効化

### 1. Supabase Dashboardでの設定

#### メールプロバイダーの有効化

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 対象プロジェクトを選択
3. 左メニューから `Authentication` → `Providers` → `Email` を選択
4. 以下の設定を行う：
   - **Enable Email Provider**: ON
   - **Confirm email**: ON（メール確認を必須にする）
   - **Secure email change**: ON（推奨）
   - **Secure password change**: ON（推奨）

#### メールテンプレートの設定

1. `Authentication` → `Email Templates` を選択
2. **Confirm signup** テンプレートを編集：

```html
<h2>メールアドレスの確認</h2>
<p>給料・資産管理システムへようこそ！</p>
<p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
<p>
	<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">
		メールアドレスを確認
	</a>
</p>
<p>このリンクは24時間有効です。</p>
```

3. **Site URL**の設定を確認：
   - `Authentication` → `URL Configuration`
   - **Site URL**: `https://your-domain.com`（本番環境）
   - **Redirect URLs**:
     - `http://localhost:5173/auth/confirm`（開発環境）
     - `https://your-domain.com/auth/confirm`（本番環境）

### 2. 環境変数の設定

`.env` ファイルに以下を設定：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PUBLIC_APP_URL=http://localhost:5173  # 開発環境
```

## 🔧 開発環境でのテスト

### メール確認なしでテストする場合

1. Supabase Dashboard → `Authentication` → `Providers` → `Email`
2. **Confirm email** を一時的にOFFにする
3. テスト完了後、必ずONに戻す

### メール確認リンクを手動で取得

1. Supabase Dashboard → `Authentication` → `Users`
2. 該当ユーザーの行をクリック
3. `Email` セクションで確認トークンを表示
4. 手動でURLを構築：
   ```
   http://localhost:5173/auth/confirm?token_hash=TOKEN&type=signup
   ```

### カスタムSMTPの設定（任意）

開発環境で実際にメールを送信したい場合：

1. `Authentication` → `Email Templates` → `SMTP Settings`
2. **Enable Custom SMTP** をON
3. SMTPサーバー情報を入力（例：SendGrid, Mailgun等）

## 📝 実装済み機能

### ページとエンドポイント

- ✅ `/auth/confirm` - メール確認ページ
- ✅ `/auth/resend-confirmation` - 確認メール再送信ページ
- ✅ `/api/auth/signup` - 新規登録API（メール送信）
- ✅ `/api/auth/resend-confirmation` - メール再送信API

### ユーザーフロー

1. **新規登録**
   - ユーザーが登録フォームを送信
   - 確認メールが自動送信される
   - ログインページにリダイレクト（確認待ちメッセージ表示）

2. **メール確認**
   - ユーザーがメール内のリンクをクリック
   - `/auth/confirm`でトークンを検証
   - 成功時はダッシュボードへリダイレクト

3. **メール再送信**
   - ログインページから「確認メール再送信」リンク
   - メールアドレスを入力して再送信

## ⚠️ 注意事項

### セキュリティ

- メール確認は本番環境では**必須**にすること
- トークンの有効期限はデフォルト24時間
- 再送信にはレート制限を設定することを推奨

### トラブルシューティング

- **メールが届かない場合**：
  - Supabaseの無料プランではメール送信数に制限あり
  - スパムフォルダを確認
  - SMTP設定を確認

- **リンクが無効な場合**：
  - トークンの有効期限切れ（24時間）
  - URLが正しくない
  - Site URLの設定を確認

## 🚀 本番環境への移行

1. **Site URL**を本番URLに変更
2. **Redirect URLs**に本番URLを追加
3. カスタムSMTPを設定（推奨）
4. メールテンプレートをブランドに合わせてカスタマイズ
5. SPF/DKIM/DMARCレコードを設定（メール到達率向上）
