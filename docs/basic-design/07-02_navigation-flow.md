# ナビゲーションフロー詳細設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: UI/UXアーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 初版

---

## 1. ナビゲーション構造

### 1.1 グローバルナビゲーション

```typescript
// ナビゲーション構造定義
interface NavigationStructure {
  primary: {
    items: [
      { id: 'dashboard', label: 'ダッシュボード', path: '/', icon: 'home' },
      { id: 'salary', label: '給料明細', path: '/salary-slips', icon: 'document' },
      { id: 'portfolio', label: 'ポートフォリオ', path: '/portfolio', icon: 'chart' },
      { id: 'settings', label: '設定', path: '/settings', icon: 'cog' }
    ];
    position: 'header' | 'sidebar';
    behavior: 'fixed' | 'collapsible';
  };
  
  secondary: {
    breadcrumbs: boolean;
    backButton: boolean;
    contextualActions: boolean;
  };
  
  mobile: {
    type: 'drawer' | 'bottom-navigation';
    trigger: 'hamburger' | 'swipe';
  };
}
```

### 1.2 ナビゲーション階層

```mermaid
graph TD
    subgraph "第1階層 - プライマリナビゲーション"
        Dashboard[ダッシュボード]
        SalarySlips[給料明細]
        Portfolio[ポートフォリオ]
        Settings[設定]
    end
    
    subgraph "第2階層 - セカンダリナビゲーション"
        SalarySlips --> SalaryTabs[タブ: 一覧 | 統計 | エクスポート]
        Portfolio --> PortfolioTabs[タブ: 保有株式 | 取引履歴 | 分析]
        Settings --> SettingsTabs[タブ: プロファイル | 環境設定 | データ管理]
    end
    
    subgraph "第3階層 - コンテキストナビゲーション"
        SalaryTabs --> SalaryActions[アクション: 新規作成 | PDFアップロード | フィルター]
        PortfolioTabs --> PortfolioActions[アクション: 株式追加 | 更新 | エクスポート]
    end
```

---

## 2. ナビゲーションパターン

### 2.1 デスクトップナビゲーション

```typescript
// デスクトップ用ナビゲーション設定
const desktopNavigation: NavigationConfig = {
  layout: 'sidebar-fixed',
  header: {
    height: '64px',
    items: ['logo', 'search', 'notifications', 'user-menu'],
    sticky: true,
  },
  sidebar: {
    width: '240px',
    collapsible: true,
    collapsedWidth: '64px',
    items: primaryNavItems,
    footer: ['help', 'logout'],
  },
  breadcrumbs: {
    enabled: true,
    maxItems: 4,
    separator: '/',
  },
};
```

**視覚的レイアウト:**
```
┌─────────────────────────────────────────────────────┐
│ Logo  │          Search Bar          │ 🔔 │ User ▼ │ ← Header (64px)
├───────┼─────────────────────────────────────────────┤
│   🏠  │                                             │
│ ﾀﾞｯｼｭ │  ┌──────────────────────────────────────┐  │
│       │  │  Home > 給料明細 > 2025年1月        │  │ ← Breadcrumbs
│   📄  │  ├──────────────────────────────────────┤  │
│ 給料  │  │                                      │  │
│       │  │         Main Content Area          │  │
│   📊  │  │                                      │  │
│ ﾎﾟｰﾄ  │  │                                      │  │
│       │  │                                      │  │
│   ⚙️  │  │                                      │  │
│ 設定  │  └──────────────────────────────────────┘  │
│       │                                             │
├───────┤                                             │
│  ❓   │                                             │
│  🚪   │                                             │
└───────┴─────────────────────────────────────────────┘
  ↑ Sidebar (240px)              ↑ Content Area
```

### 2.2 モバイルナビゲーション

```typescript
// モバイル用ナビゲーション設定
const mobileNavigation: NavigationConfig = {
  layout: 'drawer-overlay',
  header: {
    height: '56px',
    items: ['hamburger', 'logo', 'actions'],
    sticky: true,
  },
  drawer: {
    width: '280px',
    position: 'left',
    overlay: true,
    swipeToOpen: true,
    items: [
      ...primaryNavItems,
      'divider',
      ...secondaryNavItems,
    ],
  },
  bottomBar: {
    enabled: true,
    height: '56px',
    maxItems: 4,
    items: primaryNavItems.slice(0, 4),
  },
};
```

**視覚的レイアウト (モバイル):**
```
┌──────────────────┐
│ ☰  Logo     ⋮  │ ← Header (56px)
├──────────────────┤
│                  │
│   Content Area   │
│                  │
│                  │
├──────────────────┤
│ 🏠 │ 📄 │ 📊 │ ⚙️│ ← Bottom Navigation (56px)
└──────────────────┘

[ドロワー展開時]
┌──────────────────┐
│ ☰  Logo     ⋮  │
├──────────────────┤
│▓▓▓▓▓▓▓▓▓▓│       │
│▓ダッシュ ▓│       │
│▓給料明細 ▓│ Semi- │
│▓ﾎﾟｰﾄﾌｫﾘｵ▓│ trans │
│▓設定     ▓│ parent│
│▓─────────▓│ overlay│
│▓ヘルプ   ▓│       │
│▓ログアウト▓│       │
└──────────────────┘
```

### 2.3 タブレットナビゲーション

```typescript
// タブレット用ナビゲーション設定
const tabletNavigation: NavigationConfig = {
  layout: 'sidebar-collapsible',
  header: {
    height: '64px',
    items: ['logo', 'search-icon', 'user-menu'],
  },
  sidebar: {
    width: '200px',
    collapsedWidth: '64px',
    defaultState: 'collapsed',
    expandOnHover: true,
    items: primaryNavItems.map(item => ({
      ...item,
      showLabelWhenCollapsed: false,
    })),
  },
};
```

---

## 3. ナビゲーション動作仕様

### 3.1 遷移アニメーション

```typescript
// アニメーション設定
const navigationAnimations = {
  pageTransition: {
    type: 'fade',
    duration: 300,
    easing: 'ease-in-out',
    config: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
  },
  
  drawerTransition: {
    type: 'slide',
    duration: 250,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    config: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
  },
  
  modalTransition: {
    type: 'scale-fade',
    duration: 200,
    config: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
  },
};
```

### 3.2 ナビゲーション状態管理

```typescript
// Svelteストアによる状態管理
import { writable, derived } from 'svelte/store';

interface NavigationState {
  currentPath: string;
  previousPath: string;
  isNavigating: boolean;
  navigationHistory: string[];
  breadcrumbs: BreadcrumbItem[];
  activeMenuItem: string;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
}

// ナビゲーションストア
export const navigationStore = writable<NavigationState>({
  currentPath: '/',
  previousPath: null,
  isNavigating: false,
  navigationHistory: [],
  breadcrumbs: [],
  activeMenuItem: 'dashboard',
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
});

// 派生ストア
export const canGoBack = derived(
  navigationStore,
  $nav => $nav.navigationHistory.length > 1
);

export const isAuthenticated = derived(
  navigationStore,
  $nav => !$nav.currentPath.startsWith('/login')
);
```

### 3.3 ルート保護とリダイレクト

```typescript
// ルートガード実装
interface RouteGuard {
  path: string;
  canActivate: () => boolean | Promise<boolean>;
  redirectTo?: string;
}

const routeGuards: RouteGuard[] = [
  {
    path: '/salary-slips',
    canActivate: () => authStore.isAuthenticated(),
    redirectTo: '/login',
  },
  {
    path: '/portfolio',
    canActivate: () => authStore.isAuthenticated(),
    redirectTo: '/login',
  },
  {
    path: '/settings',
    canActivate: () => authStore.isAuthenticated(),
    redirectTo: '/login',
  },
  {
    path: '/login',
    canActivate: () => !authStore.isAuthenticated(),
    redirectTo: '/',
  },
];

// ナビゲーション前のチェック
export async function beforeNavigate(to: string): Promise<boolean> {
  const guard = routeGuards.find(g => to.startsWith(g.path));
  
  if (guard) {
    const canActivate = await guard.canActivate();
    if (!canActivate && guard.redirectTo) {
      await goto(guard.redirectTo);
      return false;
    }
  }
  
  return true;
}
```

---

## 4. パンくずリスト仕様

### 4.1 パンくずリスト生成ロジック

```typescript
// パンくずリスト生成
interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
  active: boolean;
}

const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  '/': {
    label: 'ホーム',
    icon: 'home',
  },
  '/salary-slips': {
    label: '給料明細',
    parent: '/',
  },
  '/salary-slips/[id]': {
    label: (params) => `${params.id}の詳細`,
    parent: '/salary-slips',
  },
  '/portfolio': {
    label: 'ポートフォリオ',
    parent: '/',
  },
  '/portfolio/stocks/[symbol]': {
    label: (params) => params.symbol,
    parent: '/portfolio',
  },
  '/settings': {
    label: '設定',
    parent: '/',
  },
};

export function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  let currentPath = path;
  
  while (currentPath) {
    const config = breadcrumbConfig[currentPath];
    if (config) {
      items.unshift({
        label: typeof config.label === 'function' 
          ? config.label(extractParams(currentPath))
          : config.label,
        path: currentPath,
        icon: config.icon,
        active: currentPath === path,
      });
      currentPath = config.parent;
    } else {
      break;
    }
  }
  
  return items;
}
```

### 4.2 パンくずリスト表示例

```
ホーム > 給料明細 > 2025年1月
ホーム > ポートフォリオ > 7203（トヨタ自動車）
ホーム > 設定 > プロファイル
```

---

## 5. コンテキストメニューとアクション

### 5.1 画面別コンテキストアクション

```typescript
// コンテキストアクション定義
interface ContextAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  visible?: () => boolean;
  enabled?: () => boolean;
  shortcut?: string;
}

const contextActions: Record<string, ContextAction[]> = {
  '/salary-slips': [
    {
      id: 'upload-pdf',
      label: 'PDFアップロード',
      icon: 'upload',
      action: () => openPDFUploadModal(),
      shortcut: 'Ctrl+U',
    },
    {
      id: 'create-new',
      label: '新規作成',
      icon: 'plus',
      action: () => goto('/salary-slips/new'),
      shortcut: 'Ctrl+N',
    },
    {
      id: 'export',
      label: 'エクスポート',
      icon: 'download',
      action: () => openExportDialog(),
      visible: () => hasData(),
    },
  ],
  '/portfolio': [
    {
      id: 'add-stock',
      label: '株式追加',
      icon: 'plus',
      action: () => openStockAddModal(),
    },
    {
      id: 'update-prices',
      label: '株価更新',
      icon: 'refresh',
      action: () => updateStockPrices(),
      enabled: () => !isUpdating(),
    },
  ],
};
```

### 5.2 フローティングアクションボタン (FAB)

```typescript
// モバイル用FAB設定
const fabConfig = {
  '/salary-slips': {
    primary: {
      icon: 'plus',
      label: '追加',
      action: () => openActionMenu(),
    },
    menu: [
      { icon: 'upload', label: 'PDFアップロード' },
      { icon: 'edit', label: '手動入力' },
    ],
  },
  '/portfolio': {
    primary: {
      icon: 'add',
      label: '株式追加',
      action: () => openStockAddModal(),
    },
  },
};
```

---

## 6. 検索とフィルタリング

### 6.1 グローバル検索

```typescript
// グローバル検索設定
interface SearchConfig {
  enabled: boolean;
  placeholder: string;
  hotkey: string;
  searchableRoutes: string[];
  resultTypes: SearchResultType[];
}

const globalSearchConfig: SearchConfig = {
  enabled: true,
  placeholder: '検索（Ctrl+K）',
  hotkey: 'ctrl+k',
  searchableRoutes: ['/', '/salary-slips', '/portfolio'],
  resultTypes: [
    { type: 'salary-slip', icon: 'document', route: '/salary-slips' },
    { type: 'stock', icon: 'chart', route: '/portfolio/stocks' },
    { type: 'setting', icon: 'cog', route: '/settings' },
  ],
};

// 検索結果のルーティング
function navigateToSearchResult(result: SearchResult) {
  switch (result.type) {
    case 'salary-slip':
      goto(`/salary-slips/${result.id}`);
      break;
    case 'stock':
      goto(`/portfolio/stocks/${result.symbol}`);
      break;
    case 'setting':
      goto(`/settings#${result.anchor}`);
      break;
  }
}
```

### 6.2 ローカルフィルタリング

```typescript
// 画面固有のフィルター
const pageFilters = {
  '/salary-slips': {
    filters: [
      { key: 'year', type: 'select', options: generateYearOptions() },
      { key: 'month', type: 'select', options: generateMonthOptions() },
      { key: 'status', type: 'checkbox', options: ['確定', '仮'] },
    ],
    sort: [
      { key: 'date', label: '支払日', directions: ['asc', 'desc'] },
      { key: 'amount', label: '金額', directions: ['asc', 'desc'] },
    ],
  },
  '/portfolio': {
    filters: [
      { key: 'gainLoss', type: 'toggle', options: ['利益', '損失', 'すべて'] },
    ],
    sort: [
      { key: 'value', label: '評価額' },
      { key: 'gainLoss', label: '損益' },
      { key: 'ratio', label: '構成比' },
    ],
  },
};
```

---

## 7. ナビゲーションのアクセシビリティ

### 7.1 キーボードショートカット

```typescript
// キーボードショートカット定義
const keyboardShortcuts: KeyboardShortcut[] = [
  // グローバルショートカット
  { keys: 'Alt+D', action: () => goto('/'), description: 'ダッシュボードへ' },
  { keys: 'Alt+S', action: () => goto('/salary-slips'), description: '給料明細へ' },
  { keys: 'Alt+P', action: () => goto('/portfolio'), description: 'ポートフォリオへ' },
  { keys: 'Ctrl+K', action: () => openGlobalSearch(), description: '検索' },
  { keys: 'Escape', action: () => closeAllModals(), description: '閉じる' },
  
  // ナビゲーション操作
  { keys: 'Alt+←', action: () => history.back(), description: '戻る' },
  { keys: 'Alt+→', action: () => history.forward(), description: '進む' },
  { keys: 'Alt+↑', action: () => navigateToParent(), description: '親階層へ' },
  
  // リスト操作
  { keys: 'J', action: () => selectNext(), description: '次の項目', when: 'list' },
  { keys: 'K', action: () => selectPrevious(), description: '前の項目', when: 'list' },
  { keys: 'Enter', action: () => openSelected(), description: '選択項目を開く', when: 'list' },
];
```

### 7.2 フォーカス管理

```typescript
// フォーカス管理
class FocusManager {
  private focusableElements: HTMLElement[] = [];
  private currentIndex: number = 0;
  
  // ページ遷移時のフォーカス設定
  onNavigate(to: string) {
    const mainContent = document.querySelector('main');
    const heading = mainContent?.querySelector('h1');
    
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
      heading.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  // モーダル表示時のフォーカストラップ
  trapFocus(container: HTMLElement) {
    this.focusableElements = Array.from(
      container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }
  
  // タブキーのハンドリング
  handleTab(event: KeyboardEvent) {
    if (this.focusableElements.length === 0) return;
    
    if (event.shiftKey) {
      this.currentIndex--;
      if (this.currentIndex < 0) {
        this.currentIndex = this.focusableElements.length - 1;
      }
    } else {
      this.currentIndex++;
      if (this.currentIndex >= this.focusableElements.length) {
        this.currentIndex = 0;
      }
    }
    
    this.focusableElements[this.currentIndex].focus();
    event.preventDefault();
  }
}
```

### 7.3 ARIA属性

```html
<!-- ナビゲーション要素のARIA属性 -->
<nav aria-label="メインナビゲーション">
  <ul role="list">
    <li role="listitem">
      <a 
        href="/"
        aria-current={$page.url.pathname === '/' ? 'page' : undefined}
        aria-label="ダッシュボードへ移動"
      >
        <span aria-hidden="true">🏠</span>
        <span>ダッシュボード</span>
      </a>
    </li>
  </ul>
</nav>

<!-- パンくずリスト -->
<nav aria-label="パンくずリスト">
  <ol role="list">
    {#each breadcrumbs as crumb, i}
      <li role="listitem">
        {#if i < breadcrumbs.length - 1}
          <a href={crumb.path}>{crumb.label}</a>
          <span aria-hidden="true">/</span>
        {:else}
          <span aria-current="page">{crumb.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
```

---

## 8. エラー処理とフィードバック

### 8.1 ナビゲーションエラー

```typescript
// エラーハンドリング
interface NavigationError {
  type: 'not-found' | 'forbidden' | 'network' | 'timeout';
  message: string;
  recovery?: () => void;
}

function handleNavigationError(error: NavigationError) {
  switch (error.type) {
    case 'not-found':
      goto('/404');
      break;
      
    case 'forbidden':
      showToast({
        type: 'error',
        message: 'このページへのアクセス権限がありません',
        action: { label: 'ログイン', onClick: () => goto('/login') },
      });
      break;
      
    case 'network':
      showOfflineIndicator();
      cacheNavigation(getCurrentPath());
      break;
      
    case 'timeout':
      showToast({
        type: 'warning',
        message: 'ページの読み込みに時間がかかっています',
        action: { label: 'リトライ', onClick: () => location.reload() },
      });
      break;
  }
}
```

### 8.2 ローディング状態

```typescript
// ローディング状態管理
interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

const loadingStore = writable<LoadingState>({
  isLoading: false,
});

// ナビゲーション開始時
beforeNavigate(() => {
  loadingStore.set({ isLoading: true, message: '読み込み中...' });
});

// ナビゲーション完了時
afterNavigate(() => {
  loadingStore.set({ isLoading: false });
});

// プログレスバー表示
export function NavigationProgress() {
  return {
    start: () => nprogress.start(),
    done: () => nprogress.done(),
    set: (value: number) => nprogress.set(value),
  };
}
```

---

## 9. パフォーマンス最適化

### 9.1 プリフェッチ戦略

```typescript
// リンクプリフェッチ設定
const prefetchConfig = {
  strategy: 'hover', // 'hover' | 'viewport' | 'immediate'
  delay: 100, // hover時の遅延(ms)
  
  // 画面別プリフェッチルール
  rules: [
    {
      from: '/',
      prefetch: ['/salary-slips', '/portfolio'],
      priority: 'high',
    },
    {
      from: '/salary-slips',
      prefetch: (data) => data.recentSlips.map(s => `/salary-slips/${s.id}`),
      priority: 'medium',
    },
  ],
};

// プリフェッチ実装
function setupPrefetch() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    if (prefetchConfig.strategy === 'hover') {
      link.addEventListener('mouseenter', () => {
        setTimeout(() => {
          prefetch(link.href);
        }, prefetchConfig.delay);
      });
    } else if (prefetchConfig.strategy === 'viewport') {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            prefetch(entry.target.href);
          }
        });
      });
      observer.observe(link);
    }
  });
}
```

### 9.2 ルートの遅延読み込み

```typescript
// 動的インポートによる遅延読み込み
const routes = {
  '/': () => import('$routes/+page.svelte'),
  '/salary-slips': () => import('$routes/salary-slips/+page.svelte'),
  '/portfolio': () => import('$routes/portfolio/+page.svelte'),
  '/settings': () => import('$routes/settings/+page.svelte'),
};

// チャンク最適化
export const chunkConfig = {
  // 共通チャンク
  vendor: ['svelte', 'svelte/store'],
  common: ['$lib/components', '$lib/utils'],
  
  // 機能別チャンク
  features: {
    dashboard: ['$features/dashboard'],
    salarySlip: ['$features/salary-slip'],
    portfolio: ['$features/portfolio'],
  },
};
```

---

## 10. 実装チェックリスト

### 10.1 必須実装項目

- [ ] グローバルナビゲーション実装
- [ ] モバイルドロワーメニュー実装
- [ ] パンくずリスト自動生成
- [ ] ルートガード実装
- [ ] キーボードナビゲーション
- [ ] フォーカス管理
- [ ] ローディング状態表示
- [ ] エラーハンドリング
- [ ] プリフェッチ実装
- [ ] アニメーション実装

### 10.2 推奨実装項目

- [ ] ボトムナビゲーション（モバイル）
- [ ] グローバル検索
- [ ] ショートカットヘルプ
- [ ] ナビゲーション履歴管理
- [ ] オフライン対応
- [ ] PWA対応
- [ ] ディープリンク対応

---

## 11. 次のステップ

1. ✅ 画面遷移図
2. ✅ ナビゲーションフロー詳細（本書）
3. → UI状態管理仕様
4. → コンポーネント設計
5. → 実装

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| UI/UXアーキテクト | UI/UXアーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | UI/UXアーキテクト |