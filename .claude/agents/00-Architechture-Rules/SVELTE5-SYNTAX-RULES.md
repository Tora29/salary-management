# Svelte 5 Syntax Rules - 必ず厳守！

このファイルは、Svelte 5の最新記法を使用し、Svelte 4の古い記法が混入しないようにするための厳格なルールを定義します。
**全ての実装において、これらのルールを必ず遵守してください。**

## 🚨 最重要ルール - 違反は絶対禁止！

### 1. リアクティビティはRunes APIのみを使用

#### ❌ 禁止 (Svelte 4の記法)
```svelte
<script>
  // 絶対禁止：export letを使った古いprops定義
  export let prop = 'default';
  
  // 絶対禁止：$:を使った反応性宣言
  $: doubled = count * 2;
  
  // 絶対禁止：$:を使った副作用
  $: if (count > 5) {
    alert('Count is too high!');
  }
  
  // 絶対禁止：$$propsや$$restPropsの使用
  const rest = $$restProps;
</script>
```

#### ✅ 必須 (Svelte 5の記法)
```svelte
<script>
  // 必須：$props()を使ったprops定義
  let { prop = 'default', ...rest } = $props();
  
  // 必須：$derivedを使った派生ステート
  let doubled = $derived(count * 2);
  
  // 必須：$effectを使った副作用
  $effect(() => {
    if (count > 5) {
      alert('Count is too high!');
    }
  });
</script>
```

### 2. State管理はRunesを使用

#### ❌ 禁止
```svelte
<script>
  // 禁止：通常のlet宣言（リアクティブではない）
  let count = 0;
  
  // 禁止：writable/readableストアの使用（レガシー）
  import { writable } from 'svelte/store';
  const store = writable(0);
</script>
```

#### ✅ 必須
```svelte
<script>
  // 必須：$stateを使ったリアクティブな状態管理
  let count = $state(0);
  
  // 必須：深くリアクティブなオブジェクト/配列
  let todos = $state([
    { done: false, text: 'Learn Svelte 5' }
  ]);
  
  // 必須：非リアクティブな大規模データは$state.raw
  let largeData = $state.raw({
    // 大量のimmutableデータ
  });
</script>
```

## 📝 Runes API完全ガイド

### $state - リアクティブステート

```svelte
<script>
  // 基本的な使用
  let count = $state(0);
  
  // オブジェクト・配列は深くリアクティブ
  let user = $state({
    name: 'John',
    address: {
      city: 'Tokyo'
    }
  });
  
  // クラスでの使用
  class Todo {
    done = $state(false);
    text = $state('');
    
    constructor(text) {
      this.text = text;
    }
  }
  
  // $state.raw - 浅いリアクティビティ（パフォーマンス向上）
  let data = $state.raw({ large: 'dataset' });
  
  // $state.snapshot - プロキシから静的な値を取得
  let snapshot = $state.snapshot(user);
</script>
```

### $derived - 派生ステート

```svelte
<script>
  let count = $state(0);
  
  // シンプルな派生
  let doubled = $derived(count * 2);
  
  // 複雑な派生は$derived.by
  let total = $derived.by(() => {
    let sum = 0;
    for (const item of items) {
      sum += item.value;
    }
    return sum;
  });
  
  // 派生ステートの分割代入
  let { x, y } = $derived(getCoordinates());
</script>
```

### $effect - 副作用

```svelte
<script>
  // DOM操作や外部APIとの連携
  $effect(() => {
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, size, size);
  });
  
  // クリーンアップ関数
  $effect(() => {
    const interval = setInterval(() => {
      count += 1;
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  });
  
  // DOM更新前に実行
  $effect.pre(() => {
    // スクロール位置の調整など
  });
  
  // 独立したエフェクトルート
  const cleanup = $effect.root(() => {
    // ネストされたエフェクト
  });
</script>
```

### $props - コンポーネントプロパティ

```svelte
<script>
  // 基本的な使用
  let { name, age = 18 } = $props();
  
  // rest propsの取得
  let { title, ...rest } = $props();
  
  // 全props取得
  let props = $props();
</script>
```

### $bindable - 双方向バインディング

```svelte
<!-- Child.svelte -->
<script>
  let { value = $bindable() } = $props();
</script>

<!-- Parent.svelte -->
<Child bind:value={parentValue} />
```

### $inspect - デバッグ（開発環境のみ）

```svelte
<script>
  let state = $state({ count: 0 });
  
  // 値の変更を監視
  $inspect(state);
  
  // カスタムログ関数
  $inspect(state).with((type, value) => {
    console.log(type, value);
  });
  
  // 関数のトレース
  $effect(() => {
    $inspect.trace();
    // この関数を再実行させた状態変更を追跡
  });
</script>
```

## 🔄 共有ステート管理パターン

### ❌ 禁止パターン
```javascript
// state.svelte.js
// 禁止：直接エクスポート（importで正しく動作しない）
export let count = $state(0);
```

### ✅ 推奨パターン

#### パターン1: オブジェクトでラップ
```javascript
// state.svelte.js
export const counter = $state({
  count: 0
});

export function increment() {
  counter.count += 1;
}
```

#### パターン2: ゲッター関数を提供
```javascript
// state.svelte.js
let count = $state(0);

export function getCount() {
  return count;
}

export function increment() {
  count += 1;
}
```

## 🚫 よくある間違いと対処法

### 1. 派生ステート内での状態変更
```svelte
<!-- ❌ 間違い -->
<script>
  let even = $state(true);
  let odd = $derived.by(() => {
    even = count % 2 === 0; // エラー：派生内で状態変更
    return !even;
  });
</script>

<!-- ✅ 正解 -->
<script>
  let even = $derived(count % 2 === 0);
  let odd = $derived(!even);
</script>
```

### 2. エフェクトの同期化アンチパターン
```svelte
<!-- ❌ 間違い：$effectで状態同期 -->
<script>
  let doubled = $state();
  $effect(() => {
    doubled = count * 2;
  });
</script>

<!-- ✅ 正解：$derivedを使用 -->
<script>
  let doubled = $derived(count * 2);
</script>
```

### 3. eachブロック引数の再代入
```svelte
<!-- ❌ Svelte 5では禁止 -->
{#each items as item}
  <button onclick={() => item = newValue}>変更</button>
{/each}

<!-- ✅ インデックスを使用 -->
{#each items as item, i}
  <button onclick={() => items[i] = newValue}>変更</button>
{/each}
```

## 📋 チェックリスト

実装前に必ず確認：

- [ ] `export let`を使っていない
- [ ] `$:`を使っていない
- [ ] `$$props`/`$$restProps`を使っていない
- [ ] すべてのリアクティブな値に`$state()`を使用
- [ ] 派生値には`$derived()`を使用
- [ ] 副作用には`$effect()`を使用
- [ ] propsは`$props()`で受け取る
- [ ] 双方向バインディングには`$bindable()`を使用
- [ ] `.svelte.js`/`.svelte.ts`ファイルでRunesを使用する際は適切にエクスポート

## 🔍 ESLintルール設定

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Svelte 4の記法を検出して警告
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExportNamedDeclaration > VariableDeclaration[kind="let"]',
        message: 'Use $props() instead of export let in Svelte 5'
      },
      {
        selector: 'LabeledStatement[label.name="$"]',
        message: 'Use $derived() or $effect() instead of $: in Svelte 5'
      }
    ]
  }
};
```

## 📚 参考リンク

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte/runes)
- [Migration Guide from Svelte 4](https://svelte.dev/docs/svelte/migration-guide)
- [What are Runes?](https://svelte.dev/docs/svelte/what-are-runes)

---

**重要**: このファイルのルールは、プロジェクト全体で統一されたSvelte 5の記法を保証するために**絶対に遵守**してください。
違反はコードレビューで必ず指摘され、修正が必要になります。