import type { PageServerLoad } from './$types';

/** 게시판 관리 허브 — 공지/시공사례/자료실/문의 각 관리 화면으로 이동하는 카드 + 간단 카운트. */

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [notice, caseCount, archive, waitingInquiries] = await Promise.all([
		supabase.from('posts').select('id', { count: 'exact', head: true }).eq('board_type', 'notice'),
		supabase.from('posts').select('id', { count: 'exact', head: true }).eq('board_type', 'case'),
		supabase.from('posts').select('id', { count: 'exact', head: true }).eq('board_type', 'archive'),
		supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'waiting')
	]);

	return {
		noticeCount: notice.count ?? 0,
		caseCount: caseCount.count ?? 0,
		archiveCount: archive.count ?? 0,
		waitingInquiryCount: waitingInquiries.count ?? 0
	};
};
