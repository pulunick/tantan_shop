import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export type NoticeDetail = {
	id: string;
	title: string;
	content_html: string | null;
	is_pinned: boolean;
	created_at: string;
};

type NoticeDetailRow = {
	id: string;
	title: string;
	content_html: string | null;
	is_pinned: boolean;
	is_visible: boolean;
	board_type: string;
	created_at: string;
};

/**
 * 공지 상세. 존재하지 않거나 board_type!=='notice' 이거나 비노출이면 404.
 * (products/[id] 패턴과 동일하게 admin 세션이어도 쇼핑몰 화면에서는 비노출 글을 숨긴다.)
 */
export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data, error: dbError } = await supabase
		.from('posts')
		.select('id,title,content_html,is_pinned,is_visible,board_type,created_at')
		.eq('id', params.id)
		.maybeSingle();

	if (dbError || !data) error(404, '공지사항을 찾을 수 없습니다.');

	const row = data as unknown as NoticeDetailRow;

	if (row.board_type !== 'notice' || !row.is_visible) {
		error(404, '공지사항을 찾을 수 없습니다.');
	}

	const notice: NoticeDetail = {
		id: row.id,
		title: row.title,
		content_html: row.content_html,
		is_pinned: row.is_pinned,
		created_at: row.created_at
	};

	return { notice };
};
