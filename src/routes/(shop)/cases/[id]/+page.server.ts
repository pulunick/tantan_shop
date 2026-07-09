import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export type CaseDetail = {
	id: string;
	title: string;
	content_html: string | null;
	created_at: string;
};

export type CaseImage = {
	url: string;
	sort_order: number;
};

type CaseDetailRow = {
	id: string;
	title: string;
	content_html: string | null;
	is_visible: boolean;
	board_type: string;
	created_at: string;
	post_images: CaseImage[] | null;
};

/** 시공사례 상세. 존재하지 않거나 board_type!=='case' 이거나 비노출이면 404. */
export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data, error: dbError } = await supabase
		.from('posts')
		.select('id,title,content_html,is_visible,board_type,created_at,post_images(url,sort_order)')
		.eq('id', params.id)
		.maybeSingle();

	if (dbError || !data) error(404, '시공사례를 찾을 수 없습니다.');

	const row = data as unknown as CaseDetailRow;

	if (row.board_type !== 'case' || !row.is_visible) {
		error(404, '시공사례를 찾을 수 없습니다.');
	}

	const images: CaseImage[] = [...(row.post_images ?? [])].sort(
		(a, b) => a.sort_order - b.sort_order
	);

	const caseItem: CaseDetail = {
		id: row.id,
		title: row.title,
		content_html: row.content_html,
		created_at: row.created_at
	};

	return { caseItem, images };
};
