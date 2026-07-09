import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actions, PageServerLoad } from './$types';

type CategoryRow = { id: string; name: string; sort_order: number; is_visible: boolean };

/** 목록을 sort_order 기준으로 다시 읽어온다(순서 교체 로직에 필요). */
async function loadOrdered(supabase: SupabaseClient): Promise<CategoryRow[]> {
	const { data } = await supabase
		.from('categories')
		.select('id, name, sort_order, is_visible')
		.order('sort_order', { ascending: true })
		.order('created_at', { ascending: true });
	return data ?? [];
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	return { categories: await loadOrdered(supabase) };
};

export const actions: Actions = {
	// 카테고리 추가 — 항상 맨 뒤(최대 sort_order + 1)에 붙인다. 최상위(parent_id null)만 지원.
	add: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		if (!name) return fail(400, { message: '카테고리명을 입력해 주세요.' });

		const list = await loadOrdered(supabase);
		const nextOrder = list.length > 0 ? Math.max(...list.map((c) => c.sort_order)) + 1 : 0;

		const { error } = await supabase
			.from('categories')
			.insert({ name, sort_order: nextOrder, parent_id: null });
		if (error) return fail(500, { message: `추가에 실패했습니다: ${error.message}` });
		return { success: true };
	},

	// 이름 변경
	rename: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const name = String(fd.get('name') ?? '').trim();
		if (!id || !name) return fail(400, { message: '카테고리명을 입력해 주세요.' });

		const { error } = await supabase.from('categories').update({ name }).eq('id', id);
		if (error) return fail(500, { message: `수정에 실패했습니다: ${error.message}` });
		return { success: true };
	},

	// 노출 여부 토글
	toggleVisible: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const isVisible = fd.get('isVisible') === 'true';
		if (!id) return fail(400, { message: '잘못된 요청입니다.' });

		const { error } = await supabase
			.from('categories')
			.update({ is_visible: !isVisible })
			.eq('id', id);
		if (error) return fail(500, { message: `변경에 실패했습니다: ${error.message}` });
		return { success: true };
	},

	// 순서 변경 — 인접한 카테고리와 sort_order 를 맞바꾼다(드래그 없이 위/아래 버튼으로 처리).
	move: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const direction = String(fd.get('direction') ?? '');
		if (!id || (direction !== 'up' && direction !== 'down')) {
			return fail(400, { message: '잘못된 요청입니다.' });
		}

		const list = await loadOrdered(supabase);
		const idx = list.findIndex((c) => c.id === id);
		const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return { success: true };

		const current = list[idx];
		const target = list[swapIdx];

		const [a, b] = await Promise.all([
			supabase.from('categories').update({ sort_order: target.sort_order }).eq('id', current.id),
			supabase.from('categories').update({ sort_order: current.sort_order }).eq('id', target.id)
		]);
		if (a.error || b.error) return fail(500, { message: '순서 변경에 실패했습니다.' });
		return { success: true };
	}
};
