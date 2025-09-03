/**
 * ログインカードコンポーネントのプロパティ
 */
export interface LoginCardProps {
	email: string;
	password: string;
	emailError?: string | undefined;
	passwordError?: string | undefined;
	onSubmit: () => void;
	loading?: boolean;
}
