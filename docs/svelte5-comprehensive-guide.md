# Svelte 5 完全ガイド - 最新仕様詳解

## 📚 目次

1. [概要](#概要)
2. [Runes（ルーン）- 新しいリアクティビティプリミティブ](#runes)
3. [コンポーネントAPI](#コンポーネントapi)
4. [Snippets（スニペット）](#snippets)
5. [ライフサイクル](#ライフサイクル)
6. [イベント処理](#イベント処理)
7. [型システム](#型システム)
8. [移行ガイド](#移行ガイド)
9. [ベストプラクティス](#ベストプラクティス)

---

## 概要

Svelte 5は、より明示的で細かい制御が可能な新しいリアクティビティシステムを導入しました。主な変更点：

- **Runes**: `$state`、`$derived`、`$effect`などの新しいプリミティブ
- **Snippets**: スロットに代わる新しいコンテンツ配信メカニズム
- **型安全性の向上**: TypeScriptとの統合強化
- **パフォーマンス最適化**: より効率的な更新メカニズム

---

## Runes

### $state - リアクティブステート

```svelte
<script>
	// 基本的な使用法
	let count = $state(0);

	// オブジェクト
	let user = $state({
		name: 'Alice',
		age: 30
	});

	// 配列
	let items = $state([1, 2, 3]);
</script>

<button onclick={() => count++}>
	Count: {count}
</button>
```

**特徴：**

- 自動的にリアクティブになる
- プリミティブ値、オブジェクト、配列をサポート
- 直接変更可能（`count++`のように）

### $derived - 派生ステート

```svelte
<script>
	let count = $state(0);

	// シンプルな派生
	let doubled = $derived(count * 2);

	// 複雑な派生
	let summary = $derived(() => {
		return {
			value: count * 2,
			isEven: count % 2 === 0,
			label: `Count is ${count}`
		};
	});
</script>

<p>Count: {count}, Doubled: {doubled}</p><p>Is Even: {summary.isEven}</p>
```

**重要なポイント：**

- 依存する値が変更されると自動的に再計算
- 純粋関数である必要がある（副作用なし）
- 参照の同一性による最適化

### $effect - 副作用の管理

```svelte
<script>
	let count = $state(0);
	let searchQuery = $state('');

	// 基本的なeffect
	$effect(() => {
		console.log('Count changed:', count);
	});

	// クリーンアップ付き
	$effect(() => {
		const timer = setInterval(() => {
			console.log('Tick');
		}, 1000);

		// クリーンアップ関数を返す
		return () => {
			clearInterval(timer);
		};
	});

	// API呼び出しの例
	$effect(() => {
		const controller = new AbortController();

		fetch(`/api/search?q=${searchQuery}`, {
			signal: controller.signal
		})
			.then((res) => res.json())
			.then((data) => {
				// 結果を処理
			});

		return () => {
			controller.abort();
		};
	});
</script>
```

### $effect.pre - DOM更新前の処理

```svelte
<script>
	import { tick } from 'svelte';

	let messages = $state([]);
	let viewport;

	$effect.pre(() => {
		// DOM更新前に実行
		messages; // 依存関係を明示

		const autoscroll =
			viewport && viewport.offsetHeight + viewport.scrollTop > viewport.scrollHeight - 50;

		if (autoscroll) {
			tick().then(() => {
				viewport.scrollTo(0, viewport.scrollHeight);
			});
		}
	});
</script>
```

### $effect.root - 手動制御

```svelte
<script>
	let count = $state(0);

	const cleanup = $effect.root(() => {
		$effect(() => {
			console.log('Count:', count);
		});

		return () => {
			console.log('Root cleanup');
		};
	});

	// 手動でクリーンアップ
	// cleanup();
</script>
```

### $props - プロパティ宣言

```svelte
<script>
  // 基本的な使用法
  let { name, age = 18 } = $props();

  // TypeScript
  interface Props {
    name: string;
    age?: number;
    onUpdate: (value: string) => void;
  }

  let { name, age = 18, onUpdate }: Props = $props();

  // rest propsの使用
  let { title, ...rest } = $props();
</script>

<h1>{name} ({age})</h1>
<button {...rest}>Click</button>
```

### $bindable - 双方向バインディング

```svelte
<!-- Child.svelte -->
<script>
  let { value = $bindable('') } = $props();
</script>

<input bind:value />

<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';
  let text = $state('');
</script>

<Child bind:value={text} />
<p>Parent text: {text}</p>
```

### $inspect - デバッグ用

```svelte
<script>
	let count = $state(0);
	let user = $state({ name: 'Alice' });

	// 開発環境でのみ動作
	$inspect(count); // 値の変更をログ出力

	// カスタムコールバック
	$inspect(user).with((type, value) => {
		if (type === 'update') {
			console.log('User updated:', value);
			debugger;
		}
	});
</script>
```

### $host - カスタムエレメント用

```svelte
<svelte:options customElement="my-element" />

<script>
	// ホスト要素への参照
	let host = $host();

	$effect(() => {
		// ホスト要素にスタイルを適用
		host.style.display = 'block';
	});
</script>
```

---

## コンポーネントAPI

### マウント/アンマウント

```javascript
import App from './App.svelte';

import { hydrate, mount, unmount } from 'svelte';

// マウント
const app = mount(App, {
	target: document.getElementById('app'),
	props: { name: 'World' }
});

// ハイドレーション（SSR用）
const hydratedApp = hydrate(App, {
	target: document.getElementById('app'),
	props: { name: 'World' }
});

// アンマウント
unmount(app, { outro: true }); // トランジション付き
```

### リアクティブなプロパティ更新

```javascript
import App from './App.svelte';

import { mount } from 'svelte';

// リアクティブなpropsオブジェクト
const props = $state({ count: 0 });

const app = mount(App, {
	target: document.getElementById('app'),
	props
});

// プロパティを更新
props.count = 10; // 自動的にコンポーネントが更新される
```

---

## Snippets

### 基本的な使用法

```svelte
<!-- 定義 -->
{#snippet greeting(name)}
	<h1>Hello, {name}!</h1>
{/snippet}

<!-- 使用 -->
{@render greeting('World')}
{@render greeting('Svelte')}
```

### パラメータ付きSnippet

```svelte
{#snippet card(title, description, footer = null)}
	<div class="card">
		<h2>{title}</h2>
		<p>{description}</p>
		{#if footer}
			<footer>{footer}</footer>
		{/if}
	</div>
{/snippet}

{@render card('Title', 'Description')}
{@render card('Title', 'Description', 'Footer text')}
```

### コンポーネント間でのSnippet

```svelte
<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';
</script>

<Child>
  {#snippet header()}
    <h1>Custom Header</h1>
  {/snippet}

  {#snippet content(data)}
    <p>Data: {data}</p>
  {/snippet}
</Child>

<!-- Child.svelte -->
<script>
  let { header, content, children } = $props();
</script>

<header>
  {@render header?.()}
</header>

<main>
  {@render content?.('Some data')}
  {@render children?.()}
</main>
```

### 再帰的Snippet

```svelte
{#snippet tree(node, depth = 0)}
	<div style="padding-left: {depth * 20}px">
		{node.name}
		{#if node.children}
			{#each node.children as child}
				{@render tree(child, depth + 1)}
			{/each}
		{/if}
	</div>
{/snippet}

{@render tree(rootNode)}
```

---

## ライフサイクル

### onMount

```svelte
<script>
	import { onMount } from 'svelte';

	onMount(() => {
		console.log('Component mounted');

		// クリーンアップ関数を返す
		return () => {
			console.log('Component will unmount');
		};
	});

	// 非同期版
	onMount(async () => {
		const data = await fetchData();
		// 処理...
	});
</script>
```

### onDestroy

```svelte
<script>
	import { onDestroy } from 'svelte';

	const interval = setInterval(() => {
		// 定期処理
	}, 1000);

	onDestroy(() => {
		clearInterval(interval);
	});
</script>
```

### tick

```svelte
<script>
	import { tick } from 'svelte';

	async function handleClick() {
		// 状態を更新
		count++;

		// DOM更新を待つ
		await tick();

		// DOM更新後の処理
		console.log('DOM updated');
	}
</script>
```

---

## イベント処理

### コールバックプロップス（推奨）

```svelte
<!-- Child.svelte -->
<script>
  let { onIncrement, onDecrement } = $props();
  let count = $state(0);
</script>

<button onclick={() => onIncrement?.(count)}>+</button>
<button onclick={() => onDecrement?.(count)}>-</button>

<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';

  function handleIncrement(value) {
    console.log('Increment:', value);
  }

  function handleDecrement(value) {
    console.log('Decrement:', value);
  }
</script>

<Child
  onIncrement={handleIncrement}
  onDecrement={handleDecrement}
/>
```

### イベントバブリング

```svelte
<!-- Button.svelte -->
<script>
	let { onclick, ...rest } = $props();
</script>

<button {onclick} {...rest}>
	<slot />
</button>

<!-- 使用例 -->
<Button onclick={() => console.log('Clicked!')}>Click me</Button>
```

---

## 型システム

### Component型

```typescript
import MyComponent from './MyComponent.svelte';

import type { Component, ComponentProps } from 'svelte';

// コンポーネントの型
let DynamicComponent: Component<{ name: string }>;

// プロパティの抽出
type Props = ComponentProps<typeof MyComponent>;

// ジェネリック関数
function renderComponent<T extends Component<any>>(component: T, props: ComponentProps<T>) {
	return mount(component, { target: document.body, props });
}
```

### Snippet型

```typescript
import type { Snippet } from 'svelte';

interface Props {
	header: Snippet;
	content: Snippet<[string]>; // パラメータ付き
	footer?: Snippet; // オプショナル
}

let { header, content, footer }: Props = $props();
```

### HTMLAttributes型

```typescript
import type { HTMLButtonAttributes } from 'svelte/elements';

let { children, ...rest }: HTMLButtonAttributes = $props();
```

---

## 移行ガイド

### Svelte 4 → 5 の主な変更点

#### 1. リアクティビティ

```svelte
<!-- Svelte 4 -->
<script>
  let count = 0;
  $: doubled = count * 2;

  $: {
    console.log('Count changed:', count);
  }
</script>

<!-- Svelte 5 -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

#### 2. プロパティ

```svelte
<!-- Svelte 4 -->
<script>
  export let name;
  export let age = 18;
</script>

<!-- Svelte 5 -->
<script>
  let { name, age = 18 } = $props();
</script>
```

#### 3. スロット → Snippets

```svelte
<!-- Svelte 5 -->
<script>
	let { header, children } = $props();
</script>

<!-- Svelte 4 -->
<slot name="header" />
<slot />

{@render header?.()}
{@render children?.()}
```

#### 4. イベントディスパッチャー

```svelte
<!-- Svelte 4 -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('message', { text: 'Hello' });
  }
</script>

<!-- Svelte 5 -->
<script>
  let { onMessage } = $props();

  function handleClick() {
    onMessage?.({ text: 'Hello' });
  }
</script>
```

### 互換性オプション

```javascript
// svelte.config.js
export default {
	compilerOptions: {
		compatibility: {
			componentApi: 4 // Svelte 4のコンポーネントAPIを使用
		}
	}
};
```

---

## ベストプラクティス

### 1. 状態管理

```svelte
<script>
	// ✅ 良い例：明確な状態定義
	let user = $state({
		name: '',
		email: '',
		preferences: {
			theme: 'dark',
			notifications: true
		}
	});

	// ✅ 良い例：派生値の活用
	let isValid = $derived(user.name.length > 0 && user.email.includes('@'));

	// ❌ 悪い例：$effect内での状態更新
	$effect(() => {
		// 無限ループの原因
		user.name = user.name.toUpperCase();
	});
</script>
```

### 2. パフォーマンス最適化

```svelte
<script>
	// ✅ 良い例：必要な時だけ計算
	let items = $state([]);
	let filter = $state('');

	let filteredItems = $derived(() => {
		if (!filter) return items;
		return items.filter((item) => item.name.includes(filter));
	});

	// ✅ 良い例：適切なクリーンアップ
	$effect(() => {
		const subscription = subscribe();
		return () => subscription.unsubscribe();
	});
</script>
```

### 3. 型安全性

```typescript
// ✅ 良い例：明確な型定義
interface UserData {
	id: string;
	name: string;
	role: 'admin' | 'user';
}

interface Props {
	user: UserData;
	onUpdate: (user: UserData) => void;
	children: Snippet;
}

let { user, onUpdate, children }: Props = $props();
```

### 4. コンポーネント設計

```svelte
<!-- ✅ 良い例：再利用可能なコンポーネント -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary';
		size?: 'small' | 'medium' | 'large';
		disabled?: boolean;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'medium',
		disabled = false,
		onclick,
		children
	}: Props = $props();

	let className = $derived(`btn btn-${variant} btn-${size}`);
</script>

<button class={className} {disabled} {onclick}>
	{@render children()}
</button>
```

### 5. エラーハンドリング

```svelte
<script>
	let data = $state(null);
	let error = $state(null);
	let loading = $state(false);

	async function fetchData() {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/data');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			data = await response.json();
		} catch (e) {
			error = e.message;
			console.error('Fetch error:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		fetchData();
	});
</script>

{#if loading}
	<p>Loading...</p>
{:else if error}
	<p class="error">Error: {error}</p>
{:else if data}
	<div>{JSON.stringify(data)}</div>
{/if}
```

---

## 高度な機能

### カスタムストア with Runes

```javascript
// 使用例
import { createCounter } from './store.svelte.js';

// store.svelte.js
export function createCounter(initial = 0) {
	let count = $state(initial);

	return {
		get value() {
			return count;
		},
		increment() {
			count++;
		},
		decrement() {
			count--;
		},
		reset() {
			count = initial;
		}
	};
}

const counter = createCounter(10);
```

### 複雑な派生状態

```svelte
<script>
	let filters = $state({
		search: '',
		category: 'all',
		sortBy: 'name'
	});

	let items = $state([
		{ id: 1, name: 'Item 1', category: 'A' },
		{ id: 2, name: 'Item 2', category: 'B' }
	]);

	let processedItems = $derived(() => {
		let result = [...items];

		// フィルタリング
		if (filters.search) {
			result = result.filter((item) =>
				item.name.toLowerCase().includes(filters.search.toLowerCase())
			);
		}

		if (filters.category !== 'all') {
			result = result.filter((item) => item.category === filters.category);
		}

		// ソート
		result.sort((a, b) => {
			if (filters.sortBy === 'name') {
				return a.name.localeCompare(b.name);
			}
			return a.id - b.id;
		});

		return result;
	});
</script>
```

### 動的コンポーネント

```svelte
<script>
	import ComponentA from './ComponentA.svelte';
	import ComponentB from './ComponentB.svelte';

	let components = {
		a: ComponentA,
		b: ComponentB
	};

	let selectedType = $state('a');
	let Component = $derived(components[selectedType]);
</script>

<select bind:value={selectedType}>
	<option value="a">Component A</option>
	<option value="b">Component B</option>
</select>

<Component />
```

---

## まとめ

Svelte 5は、より明示的で強力なリアクティビティシステムを提供します：

- **Runes**により、状態管理がより予測可能に
- **Snippets**により、コンテンツの再利用が簡単に
- **型安全性**の向上により、大規模アプリケーションの開発が容易に
- **パフォーマンス**の最適化により、より高速なアプリケーションを実現

既存のSvelte 4プロジェクトは段階的に移行でき、新規プロジェクトではこれらの新機能を最初から活用できます。

## 参考資料

- [Svelte 5 公式ドキュメント](https://svelte.dev/docs)
- [Svelte 5 移行ガイド](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Svelte 5 チュートリアル](https://svelte.dev/tutorial)
