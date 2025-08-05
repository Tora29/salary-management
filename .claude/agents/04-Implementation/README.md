# 04-Implementation エージェント

このディレクトリには、実装フェーズで使用する専門的なエージェントが含まれています。

## エージェント一覧

### 実装順序に基づくエージェント

1. **common-components-developer** - 共通UIコンポーネントの実装
2. **data-access-layer-developer** - データベースアクセスとAPI統合
3. **utility-functions-developer** - 汎用ユーティリティ関数の実装
4. **business-logic-developer** - ビジネスルールとドメインロジック
5. **api-endpoint-developer** - SvelteKit APIルートの実装
6. **ui-component-developer** - ユーザーインターフェースの実装
7. **unit-test-writer** - 単体テストとコンポーネントテストの作成

### サポートエージェント

- **build-config-specialist** - ビルド設定の最適化
- **code-generator** - 汎用的なコード生成
- **code-refactoring-specialist** - コードの品質改善とリファクタリング
- **code-review-specialist** - コードレビューと品質チェック
- **dependency-manager** - パッケージ依存関係の管理
- **documentation-writer** - 技術ドキュメントの作成

## 使用方法

実装を開始する前に、[IMPLEMENTATION_ORDER.md](./IMPLEMENTATION_ORDER.md) を参照して、適切な実装順序を確認してください。

### 基本的な流れ

```mermaid
graph LR
    A[要件定義] --> B[実装順序の確認]
    B --> C[適切なエージェントの選択]
    C --> D[実装]
    D --> E[テスト作成]
    E --> F[ドキュメント化]
    F --> G[コードレビュー]
    G --> H[リファクタリング]
```

### エージェント選択の指針

1. **新機能の実装時**
   - まず実装順序ドキュメントを確認
   - 現在のフェーズに適したエージェントを選択
   - 依存関係を考慮して実装順序を決定

2. **既存コードの改善時**
   - `code-refactoring-specialist` を使用
   - その後 `code-review-specialist` でレビュー

3. **問題解決時**
   - ビルドエラー → `build-config-specialist`
   - 依存関係の問題 → `dependency-manager`
   - パフォーマンス問題 → 該当する実装エージェント + `code-refactoring-specialist`

## ベストプラクティス

1. **TDD（テスト駆動開発）**
   - 可能な限り、実装前にテストを作成
   - `unit-test-writer` を活用

2. **段階的な実装**
   - 小さな単位で実装とテストを繰り返す
   - 頻繁にコミットして進捗を記録

3. **継続的なレビュー**
   - 各実装後に `code-review-specialist` を使用
   - フィードバックを次の実装に活かす

4. **ドキュメントの更新**
   - 実装と同時にドキュメントを更新
   - `documentation-writer` で包括的なドキュメントを作成

## 品質チェックリスト

各実装完了時に以下を確認：

- [ ] プロジェクトの規約に従っている
- [ ] 適切なエラーハンドリングが実装されている
- [ ] テストが作成され、パスしている
- [ ] TypeScriptの型エラーがない
- [ ] ESLintエラーがない
- [ ] ドキュメントが更新されている
- [ ] コードレビューが完了している