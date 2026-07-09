import type { LayoutServerLoad } from './$types';
import type { Category, CompanyInfo } from '$lib/components/layout/types';

/**
 * 쇼핑몰 공통 레이아웃(Header/Gnb/Footer)이 쓰는 데이터.
 * publishable 키 기반 RLS public read 이므로 비회원도 조회 가능해야 한다.
 */
export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const [{ data: categories }, { data: companySetting }] = await Promise.all([
		supabase
			.from('categories')
			.select('id,name,sort_order')
			.eq('is_visible', true)
			.order('sort_order'),
		supabase.from('site_settings').select('value').eq('key', 'company').maybeSingle()
	]);

	return {
		categories: (categories ?? []) as Category[],
		company: (companySetting?.value as CompanyInfo | null | undefined) ?? null
	};
};
