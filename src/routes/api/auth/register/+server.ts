/**
 * ユーザー登録APIエンドポイント
 * POST /api/auth/register
 */

import { json } from '@sveltejs/kit';

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { ROUTE_WITH_PARAMS } from '$shared/consts/routes';
import { SUCCESS_MESSAGES } from '$shared/consts/successMessages';
import { prisma } from '$shared/lib/prisma';
import { createSupabaseClient } from '$shared/lib/supabase';

import { registerRequestSchema } from '$features/auth/register/model/registerSchema';

import type { RegisterResponse, RegisterErrorResponse } from '$features/auth/register/model/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// リクエストボディを取得
		const body = await request.json();

		// バリデーション
		const validationResult = registerRequestSchema.safeParse(body);
		if (!validationResult.success) {
			const errors = validationResult.error.flatten().fieldErrors;
			return json(
				{
					error: ERROR_MESSAGES.INVALID_INPUT,
					code: 'VALIDATION_ERROR',
					details: Object.fromEntries(
						Object.entries(errors).map(([key, value]) => [key, value?.[0] || ''])
					)
				} as RegisterErrorResponse,
				{ status: 400 }
			);
		}

		const { email, password, agreedToTerms } = validationResult.data;

		// 利用規約への同意チェック
		if (!agreedToTerms) {
			return json(
				{
					error: ERROR_MESSAGES.TERMS_REQUIRED,
					code: 'VALIDATION_ERROR',
					details: { agreedToTerms: ERROR_MESSAGES.TERMS_REQUIRED }
				} as RegisterErrorResponse,
				{ status: 400 }
			);
		}

		// Supabase Authでユーザー作成
		const origin = new URL(request.url).origin;
		const supabase = createSupabaseClient({ isServer: true });

		// 開発環境ではメール確認をスキップ
		const isDevelopment = import.meta.env.MODE === 'development';

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${origin}${ROUTE_WITH_PARAMS.LOGIN_CONFIRMED}`,
				data: {
					agreed_to_terms: true,
					agreed_at: new Date().toISOString(),
					email_confirm: isDevelopment // 開発環境では自動確認
				}
			}
		});

		// エラーハンドリング
		if (error) {
			// メールアドレス重複チェック
			if (
				error.message.includes('already registered') ||
				error.message.includes('already exists')
			) {
				return json(
					{
						error: ERROR_MESSAGES.EMAIL_EXISTS,
						code: 'EMAIL_EXISTS'
					} as RegisterErrorResponse,
					{ status: 409 }
				);
			}

			// パスワードが弱い場合
			if (error.message.includes('password')) {
				return json(
					{
						error: ERROR_MESSAGES.PASSWORD_TOO_WEAK,
						code: 'PASSWORD_WEAK',
						details: {
							password: `${ERROR_MESSAGES.PASSWORD_TOO_SHORT}、${ERROR_MESSAGES.PASSWORD_NO_UPPERCASE}、${ERROR_MESSAGES.PASSWORD_NO_LOWERCASE}、${ERROR_MESSAGES.PASSWORD_NO_NUMBER}`
						}
					} as RegisterErrorResponse,
					{ status: 422 }
				);
			}

			// その他のエラー
			return json(
				{
					error: ERROR_MESSAGES.REGISTRATION_FAILED,
					code: 'SERVER_ERROR'
				} as RegisterErrorResponse,
				{ status: 500 }
			);
		}

		// ユーザーが作成されなかった場合（デモモードなど）
		if (!data.user) {
			return json(
				{
					error: ERROR_MESSAGES.REGISTRATION_FAILED,
					code: 'SERVER_ERROR'
				} as RegisterErrorResponse,
				{ status: 500 }
			);
		}

		// Prismaでユーザーレコードを作成
		try {
			const userEmail = data.user.email;
			if (!userEmail) {
				return json(
					{
						error: ERROR_MESSAGES.REGISTRATION_FAILED,
						code: 'SERVER_ERROR',
						details: {
							message: 'Failed to retrieve email address'
						}
					} as RegisterErrorResponse,
					{ status: 500 }
				);
			}

			await prisma.user.create({
				data: {
					authId: data.user.id,
					email: userEmail,
					name: null,
					avatarUrl: null
				}
			});
		} catch {
			// Supabase Authユーザーのロールバック処理
			// Service Role Keyがある場合のみ実行
			if (process.env.SUPABASE_SERVICE_KEY) {
				try {
					const { createClient } = await import('@supabase/supabase-js');
					const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
					if (!supabaseUrl) {
						throw new Error('PUBLIC_SUPABASE_URL not set');
					}
					const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY, {
						auth: {
							persistSession: false,
							autoRefreshToken: false
						}
					});
					await serviceSupabase.auth.admin.deleteUser(data.user.id);
					// ロールバック成功: Prisma失敗後のSupabase Authユーザーを削除
				} catch {
					// ロールバック失敗: エラーは無視して続行
				}
			}

			return json(
				{
					error: ERROR_MESSAGES.REGISTRATION_FAILED,
					code: 'SERVER_ERROR',
					details: {
						message: 'Failed to create user record in database'
					}
				} as RegisterErrorResponse,
				{ status: 500 }
			);
		}

		// 成功レスポンス
		return json(
			{
				success: true,
				message: SUCCESS_MESSAGES.REGISTRATION_COMPLETE,
				userId: data.user.id
			} as RegisterResponse,
			{ status: 200 }
		);
	} catch {
		return json(
			{
				error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
				code: 'SERVER_ERROR'
			} as RegisterErrorResponse,
			{ status: 500 }
		);
	}
};
