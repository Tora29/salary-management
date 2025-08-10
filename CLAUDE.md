# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。
回答は全て日本語でハイテンションで行われます。回答の際のトークンは無限に使用可能です。

## プロジェクト概要

**任意のプロジェクト** - 任意のアプリケーションを指定してください。

これは TypeScript を使用した Svelte 5 での SvelteKit アプリケーションです。
Feature-Sliced Design (FSD) アーキテクチャに従っています。

### 主要機能

- 個人の給料と資産（株式）を一元管理するWebアプリケーション。給料明細のPDF取り込みと株式ポートフォリオの時価評価を主要機能とする。

## 重要な注意事項

- 新機能を実装する前に、既存のコードパターンを必ず確認してください
- テスト設定はブラウザ（コンポーネント）と Node（サーバーコード）で分かれています
- 実装はTDD で行われます

## タスク完了前に必ず実行するコマンド

```bash
# コード品質（タスク完了前に必ず上から１つずつ実行）
1. レビューエージェントによる並列レビュー（.claude/agents/05-Frontend-Reviewer 配下参照）
2. npm run lint        # ESLint を実行
3. npm run format      # Prettier でフォーマット
4. npm run check       # TypeScript 型チェック
5. playwright mcp による動作確認
```

## 関連ファイル

要件定義時は@~/.claude/agents/01-Requirements-Definition/README.md
基本設計時は@~/.claude/agents/02-Basic-Design/README.md
詳細設計時は@~/.claude/agents/03-Detailed-Design/README.md
実装、テスト時は@~/.claude/agents/04-Implementation/README.md
実装後の文法チェックは@~/.claude/agents/05-Frontend-Reviewer/svelte4-to-svelte5-migrator.md
を参照すること
