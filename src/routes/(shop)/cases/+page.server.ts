import type { PageServerLoad } from './$types';

/**
 * 시공사례 갤러리 목록. board_type='case', 최신순. 대표 이미지는 post_images 중 sort_order 최솟값.
 */

const PAGE_SIZE = 9;

export type CaseCard = {
	id: string;
	title: string;
	created_at: string;
	thumbnailUrl: string | null;
};

type CaseImageRow = { url: string; sort_order: number };

type CaseRow = {
	id: string;
	title: string;
	created_at: string;
	post_images: CaseImageRow[] | null;
};

function parsePage(value: string | null): number {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : 1;
}

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const page = parsePage(url.searchParams.get('page'));
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const { data, count } = await supabase
		.from('posts')
		.select('id,title,created_at,post_images(url,sort_order)', { count: 'exact' })
		.eq('board_type', 'case')
		.eq('is_visible', true)
		.order('created_at', { ascending: false })
		.range(from, to);

	const rows = (data ?? []) as unknown as CaseRow[];
	const cases: CaseCard[] = rows.map((row) => {
		const sorted = [...(row.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
		return {
			id: row.id,
			title: row.title,
			created_at: row.created_at,
			thumbnailUrl: sorted[0]?.url ?? null
		};
	});

	return {
		cases,
		total: count ?? 0,
		page,
		pageSize: PAGE_SIZE
	};
};
