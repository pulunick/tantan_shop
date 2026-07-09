import type { PageServerLoad } from './$types';

/**
 * 공지사항 목록. is_pinned desc, created_at desc 정렬 (고정 공지가 항상 상단).
 * posts_public_read RLS(is_visible or admin) 와 별개로, 쇼핑몰 화면은 admin 세션이어도
 * 비노출 글은 보이지 않아야 하므로 is_visible=true 를 명시적으로 필터한다.
 */

const PAGE_SIZE = 15;

export type NoticeRow = {
	id: string;
	title: string;
	is_pinned: boolean;
	created_at: string;
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
		.select('id,title,is_pinned,created_at', { count: 'exact' })
		.eq('board_type', 'notice')
		.eq('is_visible', true)
		.order('is_pinned', { ascending: false })
		.order('created_at', { ascending: false })
		.range(from, to);

	return {
		notices: (data ?? []) as NoticeRow[],
		total: count ?? 0,
		page,
		pageSize: PAGE_SIZE
	};
};
