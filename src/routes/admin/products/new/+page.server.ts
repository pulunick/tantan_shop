import type { PageServerLoad } from './$types';
import type { Category } from '$lib/types';

/** 상품 등록 폼 — 카테고리 목록만 서버에서 미리 로드한다. */
export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: categories } = await supabase
		.from('categories')
		.select('id,name,sort_order')
		.order('sort_order');

	return { categories: (categories ?? []) as Category[] };
};
