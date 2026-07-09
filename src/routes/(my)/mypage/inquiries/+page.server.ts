import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export type MyInquiry = {
	id: string;
	type: 'general' | 'quote' | 'reservation';
	title: string;
	status: 'waiting' | 'answered';
	answer: string | null;
	answered_at: string | null;
	created_at: string;
};

/** 내 문의 — 본인이 작성한 문의만 (RLS 로도 이미 본인/admin 만 조회 가능). */
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?redirect=%2Fmypage%2Finquiries');

	const { data } = await supabase
		.from('inquiries')
		.select('id, type, title, status, answer, answered_at, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	return { inquiries: (data ?? []) as MyInquiry[] };
};
