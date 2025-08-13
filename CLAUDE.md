# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。
回答は全て日本語で行われます。回答の際のトークンは無限に使用可能です。

## プロジェクト概要

**任意のプロジェクト** - 任意のアプリケーションを指定してください。

これは TypeScript を使用した Svelte 5 での SvelteKit アプリケーションです。
Feature-Sliced Design (FSD) アーキテクチャに従っています。

### 主要機能

- 個人の給料と資産（株式）を一元管理するWebアプリケーション。給料明細のPDF取り込みと株式ポートフォリオの時価評価を主要機能とする。

## 重要な注意事項

- 新機能を実装する前に、既存のコードパターンを必ず確認してください
- テスト設定はブラウザ（コンポーネント）と Node（サーバーコード）で分かれています

## 🏗️ FSDアーキテクチャルール（超重要！必ず厳守！）

**実装時は必ず `.claude/FSD-ARCHITECTURE-RULES.md` を参照し、全てのルールを厳守すること！**

### 絶対に守るべきルール：

1. **レイヤー依存順序**: shared → entities → features → routes（逆方向は禁止）
2. **UIコンポーネント階層**:
   - `routes/+page.svelte` は `features/ui` のみをインポート
   - `features/ui` は `entities/ui` と `shared/components` を使用
   - `entities/ui` は `shared/components` のみを使用
3. **composable拡張子**: `features/*/composable/` 配下は必ず `.svelte.ts` を使用
4. **model配下**: 型定義のみ（interface, type）、ロジック実装禁止
5. **features同士の相互依存**: 絶対禁止（共通機能はentitiesかsharedへ）

違反するとESLintエラーになります。
迷ったら必ず `.claude/agents/00-ARCHITECTURE-RULES/FSD-ARCHITECTURE-RULES.md` を確認！

## タスク完了前に必ず実行するコマンド

```bash
# コード品質（タスク完了前に必ず上から１つずつ実行）
1. レビューエージェントによる並列レビュー（.claude/agents/05-Frontend-Reviewer 配下参照）
2. npm run lint        # ESLint を実行
3. npm run format      # Prettier でフォーマット
4. npm run check       # TypeScript 型チェック
5. playwright mcp による動作確認
```

## 関連ファイル（必ず参照すること）

### アーキテクチャ関連（最重要）

- **FSDアーキテクチャルール**: @.claude/agents/00-ARCHITECTURE-RULES/FSD-ARCHITECTURE-RULES.md 【実装前に必読！】

### 実装フロー

1. **必ず最初に** `.claude/agents/00-ARCHITECTURE-RULES/FSD-ARCHITECTURE-RULES.md` を読む
2. FSDルールに従って実装
3. ESLintでルール違反をチェック
4. テスト実行
