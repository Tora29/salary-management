import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	// 新規登録ページは誰でもアクセス可能
	// 特別な処理は不要
	return {};
};
