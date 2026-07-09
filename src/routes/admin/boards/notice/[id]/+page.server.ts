import { error, fail, redirect } from '@sveltejs/kit';
import { htmlToText, textToHtml } from '../../_text';
import type { Actions, PageServerLoad } from './$types';

export type NoticeEdit = {
	id: string;
	title: string;
	content: string;
	is_pinned: boolean;
	is_visible: boolean;
};

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data, error: dbError } = await supabase
		.from('posts')
		.select('id, title, content_html, is_pinned, is_visible, board_type')
		.eq('id', params.id)
		.maybeSingle();

	if (dbError || !data || data.board_type !== 'notice') {
		error(404, '공지사항을 찾을 수 없습니다.');
	}

	const notice: NoticeEdit = {
		id: data.id,
		title: data.title,
		content: htmlToText(data.content_html),
		is_pinned: data.is_pinned,
		is_visible: data.is_visible
	};

	return { notice };
};

export const actions: Actions = {
	update: async ({ request, params, locals: { supabase } }) => {
		const fd = await request.formData();
		const title = fd.get('title')?.toString().trim() ?? '';
		const content = fd.get('content')?.toString() ?? '';
		const is_pinned = fd.get('is_pinned') != null;
		const is_visible = fd.get('is_visible') != null;

		const values = { title, content, is_pinned, is_visible };
		if (!title) return fail(400, { values, message: '제목을 입력해 주세요.' });

		const { error: updErr } = await supabase
			.from('posts')
			.update({ title, content_html: textToHtml(content), is_pinned, is_visible })
			.eq('id', params.id);

		if (updErr) return fail(500, { values, message: '수정 중 오류가 발생했습니다.' });
		return { success: true, message: '수정되었습니다.' };
	},

	delete: async ({ params, locals: { supabase } }) => {
		const { error: delErr } = await supabase.from('posts').delete().eq('id', params.id);
		if (delErr) return fail(500, { message: '삭제 중 오류가 발생했습니다.' });
		redirect(303, '/admin/boards/notice');
	}
};
