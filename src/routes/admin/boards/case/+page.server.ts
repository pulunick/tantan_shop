import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** 시공사례 관리 목록. */

const PAGE_SIZE = 20;

export type CaseRow = {
	id: string;
	title: string;
	is_visible: boolean;
	created_at: string;
	thumbnailUrl: string | null;
};

type CaseImageRow = { url: string; sort_order: number };
type RawCaseRow = {
	id: string;
	title: string;
	is_visible: boolean;
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
		.select('id, title, is_visible, created_at, post_images(url,sort_order)', { count: 'exact' })
		.eq('board_type', 'case')
		.order('created_at', { ascending: false })
		.range(from, to);

	const rows = (data ?? []) as unknown as RawCaseRow[];
	const cases: CaseRow[] = rows.map((row) => {
		const sorted = [...(row.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
		return {
			id: row.id,
			title: row.title,
			is_visible: row.is_visible,
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

export const actions: Actions = {
	toggleVisible: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		const next = fd.get('next') === 'true';
		if (!id) return fail(400, { message: '잘못된 요청입니다.' });

		const { error: updErr } = await supabase
			.from('posts')
			.update({ is_visible: next })
			.eq('id', id);
		if (updErr) return fail(500, { message: '노출 상태 변경 중 오류가 발생했습니다.' });
		return { success: true };
	}
};
