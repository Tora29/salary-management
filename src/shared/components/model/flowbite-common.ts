/**
 * Flowbite Svelte共通Props型定義
 * 全Flowbiteコンポーネントで使用される共通のProps型を定義
 */

// サイズ定義
export type FlowbiteSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// カラー定義
export type FlowbiteColor = 
  | 'default' | 'alternative' | 'dark' | 'light'
  | 'blue' | 'green' | 'red' | 'yellow' | 'purple' 
  | 'indigo' | 'pink' | 'orange' | 'teal'
  | 'gray' | 'cyan' | 'lime' | 'emerald' | 'rose';

// 配置定義
export type FlowbitePlacement = 'top' | 'right' | 'bottom' | 'left';

// トランジション定義
export type FlowbiteTransition = 'fade' | 'slide' | 'blur' | 'scale' | 'fly';

// 共通Props基本型
export interface FlowbiteCommonProps {
  class?: string;
  style?: string;
  id?: string;
}

// サイズを持つコンポーネント用
export interface FlowbiteSizedProps extends FlowbiteCommonProps {
  size?: FlowbiteSize;
}

// カラーを持つコンポーネント用
export interface FlowbiteColoredProps extends FlowbiteCommonProps {
  color?: FlowbiteColor;
}

// アイコン共通Props
export interface FlowbiteIconProps extends FlowbiteCommonProps {
  size?: FlowbiteSize | string | number;
  color?: string;
  ariaLabel?: string;
  strokeWidth?: string;
}

// フォーム要素共通Props
export interface FlowbiteFormProps extends FlowbiteCommonProps {
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  name?: string;
  id?: string;
}

// インタラクティブ要素共通Props
export interface FlowbiteInteractiveProps extends FlowbiteCommonProps {
  disabled?: boolean;
  href?: string;
  onclick?: () => void;
}

// 開閉可能要素共通Props
export interface FlowbiteToggleableProps extends FlowbiteCommonProps {
  open?: boolean;
  dismissable?: boolean;
  transition?: FlowbiteTransition;
  transitionParams?: {
    duration?: number;
    easing?: string;
    delay?: number;
  };
}

// 配置可能要素共通Props
export interface FlowbitePlaceableProps extends FlowbiteCommonProps {
  placement?: FlowbitePlacement;
}

// ステート管理Props
export interface FlowbiteStateProps {
  open?: boolean;
  active?: boolean;
  checked?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

// バリエーションProps
export interface FlowbiteVariantProps extends FlowbiteCommonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  outline?: boolean;
  pill?: boolean;
  border?: boolean;
  gradient?: boolean;
}

// レスポンシブProps
export interface FlowbiteResponsiveProps {
  horizontal?: boolean;
  vertical?: boolean;
  fullWidth?: boolean;
}

// アクセシビリティProps
export interface FlowbiteA11yProps {
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaControls?: string;
  ariaExpanded?: boolean;
  ariaHidden?: boolean;
  role?: string;
  tabindex?: number;
}

// 複合型定義（よく使われる組み合わせ）
export type FlowbiteButtonProps = FlowbiteSizedProps & FlowbiteColoredProps & FlowbiteInteractiveProps & FlowbiteVariantProps;
export type FlowbiteInputProps = FlowbiteSizedProps & FlowbiteColoredProps & FlowbiteFormProps;
export type FlowbiteModalProps = FlowbiteSizedProps & FlowbiteToggleableProps & FlowbitePlaceableProps;
export type FlowbiteAlertProps = FlowbiteColoredProps & FlowbiteToggleableProps & FlowbiteVariantProps;