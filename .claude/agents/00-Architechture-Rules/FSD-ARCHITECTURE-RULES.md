# FSD アーキテクチャ厳格ルール定義書 🏗️

このドキュメントは、本プロジェクトにおけるFeature-Sliced Design (FSD)の厳格なルールを定義します。
**これらのルールは絶対的であり、例外は一切認められません。**

## 📁 ディレクトリ構造（絶対ルール）

```
src/
├── app.html          # アプリケーション全体の設定
├── app.css           # アプリケーション全体の設定
├── app.d.ts          # アプリケーション全体の設定
├── routes/           # ルーティングページ
|   └── api/          # API エンドポイント
├── features/         # ビジネス機能
├── entities/         # ビジネスエンティティ
└── shared/           # 共有コード
```

## 🚫 禁止事項（違反即エラー）

### 1. レイヤー間の逆インポート

```typescript
// ❌ 絶対禁止：上位レイヤーから下位レイヤーへのインポート
// features/ から pages/ をインポート
import { something } from '$pages/...'; // 禁止！

// ❌ 絶対禁止：同一レイヤー間の相互インポート
// features/auth から features/user をインポート
import { user } from '$features/user'; // 禁止！
```

### 2. 正しいインポート順序（下位→上位のみ）

```typescript
// ✅ 許可される唯一のインポート方向
shared → entities → features → routes
```

### 3. UIコンポーネントの階層構造

```
shared/components/ui/  ← 基本UIコンポーネント（Button, Input, Card等）
        ↓
entities/[name]/ui/    ← shared/components/uiの集合体でビジネスUIを構成【重要：必須層】
        ↓
features/[name]/ui/    ← entities/uiの集合体で機能UIを構成
        ↓
routes/+page.svelte    ← features/uiをインポートして配置

⚠️ 重要な原則:
- entities/ui = shared/components/uiの集合体
- features/ui = entities/uiの集合体（＋必要最小限のshared/components/ui）
- entities/ui層を必ず経由すること！

❌ 禁止: features/ui → shared/components/ui（直接参照は最小限に）
✅ 正解: features/ui → entities/ui → shared/components/ui

【例】
shared/components/ui/Button.svelte, Card.svelte, Text.svelte, Icon.svelte
        ↓
entities/salary/ui/SalaryCard.svelte（Card + Button + Text + Icon を組み合わせ）
        ↓
features/salary-import/ui/SalaryImportForm.svelte（SalaryCard + Buttonなどを使用）
        ↓
routes/salary/import/+page.svelte（SalaryImportFormをインポート）
```

## 📏 レイヤー別厳格ルール

### `/shared` - 共有レイヤー

- **許可**: 純粋な関数、型定義、定数、UIプリミティブ、グリッドシステム
- **禁止**: ビジネスロジック、外部API呼び出し、stateの保持
- **構造**:
  ```
  shared/
  ├── components/  # 基本UIコンポーネント（Button, Input等）
  |   ├── model/   # 型定義のみ（interface, type）
  |   └── ui/      # UIコンポーネント実装
  |       └── styles/  # スタイルユーティリティ
  |           ├── foundation.css  # デザイントークン
  |           ├── grid.css        # 12グリッドシステム
  |           └── utilities.ts    # スタイルヘルパー
  ├── utils/       # ユーティリティ関数
  ├── consts/      # 定数ファイル
  └── config/      # 設定定数
  ```
- **12グリッドシステムルール**:
  - グリッドシステムは `shared/components/ui/styles/` に配置
  - 全レイヤー（entities、features、routes）から利用可能
  - ビジネスロジックを含まない純粋なレイアウトユーティリティとして実装

### `/entities` - エンティティレイヤー

- **許可**: ビジネスエンティティの型、モデル、基本操作
- **禁止**: ビジネスロジック、フィーチャー固有の処理
- **UIコンポーネントルール**:
  - `entities/ui`は`shared/components/ui`の集合体として実装
  - 複数の`shared/components/ui`を組み合わせてビジネス単位の共通UIを構築
  - 単一の`shared/components/ui`をそのまま使うのではなく、必ず組み合わせて価値を追加
  ```
  entities/
  └── [entity-name]/
      ├── model/   # 型定義のみ（interface, type）
      ├── api/     # エンティティ固有のAPI（セレクトボックスの初期値等ビジネスロジックに関係しない呼出）
      └── ui/      # shared/componentsを組み合わせたビジネスエンティティUI
  ```
- **UIの実装例**:

  ```svelte
  <!-- entities/salary/ui/SalaryCard.svelte -->
  <script>
  	import Card from '$shared/components/ui/Card.svelte';
  	import Button from '$shared/components/ui/Button.svelte';
  	import Text from '$shared/components/ui/Text.svelte';
  	import Icon from '$shared/components/ui/Icon.svelte';

  	export let salary: Salary;
  </script>

  <Card>
  	<Icon name="salary" />
  	<Text variant="title">{salary.amount}</Text>
  	<Text variant="subtitle">{salary.date}</Text>
  	<Button variant="secondary">詳細</Button>
  </Card>
  ```

### `/features` - フィーチャーレイヤー

- **許可**: ユーザーアクション、ビジネスロジック
- **禁止**: ページレイアウト、ルーティング、他フィーチャーへの依存
- **UIコンポーネントルール**:
  - `features/ui`は`entities/ui`の集合体として実装
  - 複数の`entities/ui`を組み合わせて機能単位のUIを構築
  - `shared/components/ui`の直接使用は最小限に留める（基本は`entities/ui`経由）
- **構造**:
  ```
  features/
  └── [feature-name]/
      ├── composable/   # ユースケース単位のビジネスロジック（.svelte.ts必須）
      ├── model/        # 型定義のみ（interface, type）
      ├── api/          # フィーチャー固有API
      └── ui/           # entities/uiを組み合わせた機能UIコンポーネント
  ```
- **UIの実装例**:

  ```svelte
  <!-- features/salary-import/ui/SalaryImportForm.svelte -->
  <script>
  	import SalaryCard from '$entities/salary/ui/SalaryCard.svelte';
  	import Button from '$shared/components/ui/Button.svelte';
  	import FileUpload from '$shared/components/ui/FileUpload.svelte';
  	import { useSalaryImport } from '../composable/useSalaryImport';

  	const { importPDF, salaries, isLoading } = useSalaryImport();
  </script>

  <div class="import-form">
  	<FileUpload on:upload={importPDF} accept=".pdf" />

  	{#each salaries as salary}
  		<SalaryCard {salary} />
  	{/each}

  	<Button variant="primary" disabled={isLoading}>インポート実行</Button>
  </div>
  ```

- **composableの実装例**:

  ```typescript
  // features/salary-import/composable/useSalaryImport.svelte.ts
  import { parsePDF } from '../api/pdfParser';
  import type { Salary } from '$entities/salary/model/types';

  export function useSalaryImport() {
  	// Svelte 5 Runesを使用したリアクティブな状態管理
  	let salaries = $state<Salary[]>([]);
  	let isLoading = $state(false);
  	let error = $state<string | null>(null);

  	// 派生状態
  	const totalAmount = $derived(salaries.reduce((sum, s) => sum + s.amount, 0));

  	async function importPDF(file: File) {
  		isLoading = true;
  		try {
  			const parsed = await parsePDF(file);
  			salaries = [...salaries, ...parsed];
  		} catch (e) {
  			error = e.message;
  		} finally {
  			isLoading = false;
  		}
  	}

  	return {
  		get salaries() {
  			return salaries;
  		},
  		get isLoading() {
  			return isLoading;
  		},
  		get error() {
  			return error;
  		},
  		get totalAmount() {
  			return totalAmount;
  		},
  		importPDF
  	};
  }
  ```

### `/routes` - ページレイヤー

- **許可**: ルーティング、レイアウト構成、+layout.svelteによる共通レイアウト（header/footer等）
- **禁止**: ビジネスロジックの直接実装、UIコンポーネントの直接実装
- **UIコンポーネントルール**: `features/ui`のコンポーネントをインポートして配置するのみ
- **構造**: SvelteKitのファイルベースルーティングに従う
- **+page.svelteの実装例**:

  ```svelte
  <!-- routes/dashboard/+page.svelte -->
  <script>
  	// features/uiから完成されたコンポーネントをインポート
  	import PortfolioDashboard from '$features/portfolio-dashboard/ui/PortfolioDashboard.svelte';
  	import SalaryOverview from '$features/salary-overview/ui/SalaryOverview.svelte';
  </script>

  <!-- レイアウトとコンポーネント配置のみ -->
  <div class="dashboard-layout">
  	<PortfolioDashboard />
  	<SalaryOverview />
  </div>
  ```

- **サーバーサイドコードのルール**:

  ```typescript
  // routes/api/[endpoint]/+server.ts のルール
  // ✅ 許可：features層のAPIを呼び出す
  import { processData } from '$features/[name]/api/server';

  // ❌ 禁止：直接DBアクセス
  // prisma.user.findMany() // 禁止！features層を経由すること

  // ❌ 禁止：ビジネスロジックの直接実装
  // PDFパース処理などを直接書かない
  ```

## 🔧 ESLint設定による強制

FSDアーキテクチャのルールは `eslint.config.js` に実装済みです。
以下の制約が自動的に適用されます：

- **shared層**: 他のレイヤーへの依存を禁止
- **entities層**: features/routesレイヤーへの依存を禁止
- **features層**: routesレイヤーへの依存と、features同士の相互依存を禁止

違反時はビルドエラーとなり、適切なエラーメッセージが表示されます。

## 🤖 エージェント適用ルール

### コード生成時の必須チェック項目

1. **インポートパス検証**: 全インポートがレイヤー順序に従っているか
2. **ファイル配置検証**: 新規ファイルが正しいレイヤーに配置されているか
3. **命名規則検証**: コンポーネント/関数名がレイヤーに適切か
4. **依存関係検証**: 循環依存や不正な依存がないか

### 違反時の動作

```typescript
// エージェントは以下のようなエラーを返す必要がある
throw new Error(`
  FSDアーキテクチャ違反検出！
  違反内容: features/auth が features/user をインポートしています
  修正方法: 共通機能をentitiesまたはsharedレイヤーに抽出してください
`);
```

## 📝 プロジェクト固有のカスタマイズルール

### 1. レイアウト管理ルール（widgetsレイヤー不使用）

- 共通レイアウト（header/footer）は `routes/+layout.svelte` で管理
- ネストされたレイアウトは各ルートディレクトリの `+layout.svelte` を使用
- widgetsレイヤーは設けず、SvelteKitのレイアウトシステムを活用

### 2. Supabase統合ルール

- Supabaseクライアントは `shared/api/supabase.ts` でのみ初期化
- 認証ロジックは `features/auth/` に集約
- データベース操作は各entityの `api/` サブフォルダーに配置

### 3. Svelte 5 Runes使用ルール

- `$state()` は `composable/*.svelte.ts` および UIコンポーネント内で使用
- `$derived()` は `composable/*.svelte.ts` および UIコンポーネント内で使用
- `$effect()` は最小限に抑え、必ずクリーンアップを実装
- `model/` ディレクトリは型定義専用（`export interface`、`export type`のみ）
- `composable/` ディレクトリは必ず`.svelte.ts`拡張子を使用

### 4. 型定義ルール

- グローバル型は `shared/types/` に配置
- エンティティ型は `entities/[name]/model/types.ts` に配置
- フィーチャー固有型は `features/[name]/model/types.ts` に配置

### 5. Composableパターンルール

- **ファイル拡張子**: 必ず`.svelte.ts`を使用（Svelte Runesを活用するため）
- **命名規則**: `use`プレフィックスを必須とする（例：`useSalaryImport`）
- **返り値**: getterを使用してリアクティブな値へのアクセスを提供
- **状態管理**: `$state()`でリアクティブな状態を定義
- **派生状態**: `$derived()`で計算値を定義
- **副作用**: `$effect()`の使用は最小限に、必ずクリーンアップを実装
- **テスタビリティ**: 外部依存は引数で注入可能にする

## 🛡️ 違反防止のためのツール連携

### 1. pre-commitフック

```bash
# .husky/pre-commit
npm run lint:fsd  # FSD構造チェック
npm run check     # TypeScriptチェック
```

### 2. CI/CDパイプライン

```yaml
# GitHub Actions
- name: FSD Architecture Check
  run: npm run validate:architecture
```

### 3. カスタムバリデーションスクリプト

```typescript
// scripts/validate-fsd.ts
// FSD構造を検証し、違反があればビルドを失敗させる
```

## ⚠️ 最重要原則

### 1. **「迷ったら下位レイヤーに配置する」**

機能の配置に迷った場合は、より下位のレイヤー（shared寄り）に配置し、
必要に応じて上位レイヤーに移動させる。逆方向の移動は避ける。

### 2. **「UIコンポーネントは必ず階層を守る」**

- `+page.svelte`は`features/ui`のみをインポート
- `features/ui`は`entities/ui`と`shared/components`を組み合わせる
- `entities/ui`は`shared/components`のみを使用
- UIロジックの複雑さに応じて適切なレイヤーに配置

---

このルールセットは定期的にレビューされ、プロジェクトの成長に応じて
更新されますが、既存ルールの緩和は原則として行いません。
