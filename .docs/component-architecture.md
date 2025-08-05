# コンポーネント設計書

## 概要

本プロジェクトではFeature-Sliced Design (FSD)アーキテクチャに従い、コンポーネントを階層的に整理しています。

## コンポーネント階層構造

### 1. Shared層 (`/src/lib/components/`)

再利用可能な汎用UIコンポーネント群です。ビジネスロジックを持たず、純粋なUI表現のみを担当します。

#### 構成規則

各コンポーネントは以下の構造を持ちます：

```
component-name/
├── index.ts        # エクスポート定義
├── model/          # 型定義・ストア（必要な場合）
│   ├── index.ts
│   ├── types.ts
│   └── store.ts    # 状態管理（必要な場合）
└── ui/             # UIコンポーネント
    └── ComponentName.svelte
```

#### 実装済みコンポーネント

##### Card (`/card/`)

汎用的なカードコンポーネント

- **model/types.ts**: カードの表示バリエーション型定義
- **ui/Card.svelte**: カードUIコンポーネント

##### Chart (`/chart/`)

Chart.jsをラップした汎用グラフコンポーネント

- **ui/Chart.svelte**: Chart.jsの設定を直接受け取る汎用チャートコンポーネント

##### Table (`/table/`)

汎用的なテーブルコンポーネント

- **model/types.ts**: テーブルのカラム・行定義
- **ui/Table.svelte**: テーブルUIコンポーネント

##### Toast (`/toast/`)

通知表示用のトーストコンポーネント

- **model/**: トーストの型定義とグローバルストア管理
- **ui/Toast.svelte**: 個別のトースト表示
- **ui/ToastContainer.svelte**: トースト表示領域の管理

##### Button (`/button/`)

汎用的なボタンコンポーネント

- **model/types.ts**: ボタンのバリアント・サイズ定義
- **ui/Button.svelte**: ボタンUIコンポーネント

##### Input (`/input/`)

汎用的な入力フィールドコンポーネント

- **model/types.ts**: 入力フィールドの型定義
- **ui/Input.svelte**: エラー表示機能付き入力フィールド

##### Label (`/label/`)

フォームラベルコンポーネント

- **model/types.ts**: ラベルの型定義
- **ui/Label.svelte**: 必須項目表示機能付きラベル

##### Form (`/form/`)

フォーム全体を管理するコンポーネント

- **model/types.ts**: フォームの型定義
- **ui/Form.svelte**: フォームコンテナ

##### FormField (`/form-field/`)

ラベル・入力・エラーを統合管理するコンポーネント

- **model/types.ts**: フォームフィールドの型定義
- **ui/FormField.svelte**: 統合フォームフィールド

##### FormGrid (`/form-grid/`)

フォーム内のグリッドレイアウトコンポーネント

- **model/types.ts**: グリッドレイアウトの型定義
- **ui/FormGrid.svelte**: レスポンシブグリッドコンテナ

##### ButtonGroup (`/button-group/`)

ボタンのレイアウト管理コンポーネント

- **model/types.ts**: ボタングループの型定義
- **ui/ButtonGroup.svelte**: ボタン配置コンテナ

##### CardWrapper (`/card/`)

汎用的なコンテナコンポーネント

- **ui/CardWrapper.svelte**: 子要素をラップする汎用カード

### 2. Entities層 (`/src/entities/`)

ビジネスエンティティを表現するコンポーネント群です。特定のドメインに特化した表示を担当します。

#### 実装例

##### SalaryChart (`/salary-chart/`)

給料推移グラフの特化型コンポーネント

```svelte
<!-- 汎用Chartコンポーネントを利用 -->
<Chart {config} {height} />
```

- 日本円フォーマット（¥記号）
- 給料データ専用の型定義
- 青色のカラーテーマ

### 3. Features層 (`/src/features/`)

ユーザーの操作を伴う機能単位のコンポーネント群です。

### 4. Widgets層 (`/src/widgets/`)

複数のFeatureを組み合わせた大きな機能ブロックです。

## 設計原則

### 1. 単一責任の原則

各コンポーネントは1つの明確な責任を持ちます。

### 2. 依存関係の方向

```
Widgets → Features → Entities → Shared
```

上位層は下位層に依存できますが、逆は禁止です。

### 3. 汎用性の判断基準

- 2箇所以上で使用される → Shared層へ
- 特定のドメインに依存する → Entities層以上へ

### 4. Propsインターフェース

全てのコンポーネントは明示的な型定義を持ちます：

```typescript
interface Props {
	data: SomeType;
	onAction?: (value: any) => void;
}
```

## ベストプラクティス

### 1. 汎用コンポーネントの作成

```svelte
<!-- Good: 汎用的で設定可能 -->
<Chart config={chartConfig} />

<!-- Bad: 特定用途に固定 -->
<SalaryChart data={salaryData} />
```

### 2. 型定義の配置

- 汎用型 → `/model/types.ts`
- コンポーネント固有型 → コンポーネント内で定義

### 3. ストア管理

- グローバル状態が必要な場合のみ `/model/store.ts` を作成
- それ以外はpropsによる状態管理を優先

## 今後の拡張指針

新しいコンポーネントを追加する際は：

1. 汎用性を検討
2. 適切な層を選択
3. 既存の構造に従って実装
4. 必要に応じて本設計書を更新
