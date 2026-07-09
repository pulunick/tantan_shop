import { fail, redirect } from '@sveltejs/kit';
import { textToHtml } from '../../_text';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const title = fd.get('title')?.toString().trim() ?? '';
		const content = fd.get('content')?.toString() ?? '';
		const is_visible = fd.get('is_visible') != null;

		const values = { title, content, is_visible };
		if (!title) return fail(400, { values, message: '제목을 입력해 주세요.' });

		const { data, error: insErr } = await supabase
			.from('posts')
			.insert({ board_type: 'case', title, content_html: textToHtml(content), is_visible })
			.select('id')
			.single();

		if (insErr || !data) return fail(500, { values, message: '등록 중 오류가 발생했습니다.' });

		redirect(303, `/admin/boards/case/${data.id}`);
	}
};
