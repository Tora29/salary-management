import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PortfolioData } from '$features/dashboard/model/types';
import { createSupabaseServerClient } from '$shared/utils/supabase';

export const GET: RequestHandler = async (event) => {
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

		type AssetData = {
			id: string;
			asset_type: string;
			symbol: string;
			name: string;
			quantity: number;
			purchase_price: number;
			current_price: number;
			profile_id: string;
		};

		const { data: assets } = await supabase
			.from('assets')
			.select('*')
			.eq('profile_id', profile.id)
			.eq('asset_type', 'stock')
			.order('current_price', { ascending: false })
			.limit(5);

		const totalValue = (assets || []).reduce(
			(sum: number, asset: AssetData) => sum + Number(asset.current_price) * Number(asset.quantity),
			0
		);

		const dailyChangeAmount = (assets || []).reduce(
			(sum: number, asset: AssetData) =>
				sum + (Number(asset.current_price) - Number(asset.purchase_price)) * Number(asset.quantity),
			0
		);

		const totalCost = (assets || []).reduce(
			(sum: number, asset: AssetData) =>
				sum + Number(asset.purchase_price) * Number(asset.quantity),
			0
		);

		const dailyChangePercentage = totalCost > 0 ? (dailyChangeAmount / totalCost) * 100 : 0;

		const topHoldings = (assets || []).map((asset: AssetData) => ({
			symbol: asset.symbol || '',
			name: asset.name || '',
			value: Number(asset.current_price) * Number(asset.quantity),
			change: (Number(asset.current_price) - Number(asset.purchase_price)) * Number(asset.quantity),
			changePercentage:
				Number(asset.purchase_price) > 0
					? ((Number(asset.current_price) - Number(asset.purchase_price)) /
							Number(asset.purchase_price)) *
						100
					: 0
		}));

		const portfolio: PortfolioData = {
			totalValue,
			dailyChange: {
				amount: dailyChangeAmount,
				percentage: dailyChangePercentage
			},
			topHoldings
		};

		return json(portfolio);
	} catch (error) {
		console.error('Portfolio error:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
