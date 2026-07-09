import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** 공지사항 관리 목록. 고정/노출 토글은 목록에서 바로 처리한다. */

const PAGE_SIZE = 20;

export type NoticeRow = {
	id: string;
	title: string;
	is_pinned: boolean;
	is_visible: boolean;
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
		.select('id, title, is_pinned, is_visible, created_at', { count: 'exact' })
		.eq('board_type', 'notice')
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

export const actions: Actions = {
	togglePinned: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		const next = fd.get('next') === 'true';
		if (!id) return fail(400, { message: '잘못된 요청입니다.' });

		const { error: updErr } = await supabase.from('posts').update({ is_pinned: next }).eq('id', id);
		if (updErr) return fail(500, { message: '고정 상태 변경 중 오류가 발생했습니다.' });
		return { success: true };
	},

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
