/**
 * ユーザー登録APIエンドポイント
 * POST /api/auth/register
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { registerRequestSchema } from '$features/auth-register/model/registerSchema';
import { getServerSupabaseClient } from '$shared/lib/server-supabase';
import { prisma } from '$shared/lib/prisma';
import type { RegisterResponse, RegisterErrorResponse } from '$features/auth-register/model/types';
import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { SUCCESS_MESSAGES } from '$shared/consts/successMessages';
import { ROUTE_WITH_PARAMS } from '$shared/consts/routes';

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
		const supabase = getServerSupabaseClient();
		
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
			await prisma.user.create({
				data: {
					authId: data.user.id,
					email: data.user.email!,
					name: null,
					avatarUrl: null
				}
			});
		} catch (dbError) {
			console.error('Database error creating user:', dbError);
			console.error('Error details:', JSON.stringify(dbError, null, 2));
			// 注意: admin権限が必要なので、ここではユーザー削除をスキップ
			// TODO: Service Role Keyを使用してロールバック処理を実装
			
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
