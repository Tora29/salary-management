import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ActivitiesResponse } from '$features/dashboard/model/types';
import { createSupabaseServerClient } from '$shared/utils/supabase';

export const GET: RequestHandler = async (event) => {
	const limit = parseInt(event.url.searchParams.get('limit') || '5', 10);
	const supabase = createSupabaseServerClient(event);

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { data: profile } = await supabase
			.from('profiles')
			.select('id')
			.eq('user_id', user.id)
			.single();

		if (!profile) {
			return json({ error: 'Profile not found' }, { status: 404 });
		}

		const { data: salaries } = await supabase
			.from('salaries')
			.select('id, year_month, net_salary, created_at')
			.eq('profile_id', profile.id)
			.order('created_at', { ascending: false })
			.limit(limit);

		const { data: assets } = await supabase
			.from('assets')
			.select('id, symbol, name, quantity, purchase_date')
			.eq('profile_id', profile.id)
			.eq('asset_type', 'stock')
			.order('purchase_date', { ascending: false })
			.limit(limit);

		type SalaryData = {
			id: string;
			year_month: string;
			net_salary: number;
			created_at: string;
		};

		type AssetData = {
			id: string;
			symbol: string | null;
			name: string;
			quantity: number;
			purchase_date: string;
		};

		const activities = [
			...(salaries || []).map((salary: SalaryData) => ({
				id: salary.id,
				type: 'salary' as const,
				description: `${salary.year_month}の給料が入金されました`,
				amount: Number(salary.net_salary),
				date: salary.created_at
			})),
			...(assets || []).map((asset: AssetData) => ({
				id: asset.id,
				type: 'stock' as const,
				description: `${asset.symbol || asset.name}を${Number(asset.quantity)}株購入しました`,
				amount: 0,
				date: asset.purchase_date
			}))
		]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, limit);

		const response: ActivitiesResponse = {
			activities,
			hasMore: activities.length === limit
		};

		return json(response);
	} catch (error) {
		console.error('Activities error:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
