import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { InquiryType } from '../+page.server';

export type InquiryDetail = {
	id: string;
	type: InquiryType;
	title: string;
	content: string;
	is_secret: boolean;
	status: 'waiting' | 'answered';
	answer: string | null;
	answered_at: string | null;
	hope_date: string | null;
	site_address: string | null;
	created_at: string;
	authorName: string;
	authorPhone: string | null;
};

type InquiryRawRow = {
	id: string;
	type: InquiryType;
	title: string;
	content: string;
	is_secret: boolean;
	status: 'waiting' | 'answered';
	answer: string | null;
	answered_at: string | null;
	hope_date: string | null;
	site_address: string | null;
	created_at: string;
	user_id: string | null;
	guest_name: string | null;
	guest_phone: string | null;
};

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data, error: dbError } = await supabase
		.from('inquiries')
		.select(
			'id, type, title, content, is_secret, status, answer, answered_at, hope_date, site_address, created_at, user_id, guest_name, guest_phone'
		)
		.eq('id', params.id)
		.maybeSingle();

	if (dbError || !data) error(404, '문의를 찾을 수 없습니다.');

	const row = data as InquiryRawRow;

	let authorName = row.guest_name ?? '비회원';
	let authorPhone = row.guest_phone;
	if (row.user_id) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('name, phone')
			.eq('id', row.user_id)
			.maybeSingle();
		authorName = profile?.name ?? '회원';
		authorPhone = profile?.phone ?? null;
	}

	const inquiry: InquiryDetail = {
		id: row.id,
		type: row.type,
		title: row.title,
		content: row.content,
		is_secret: row.is_secret,
		status: row.status,
		answer: row.answer,
		answered_at: row.answered_at,
		hope_date: row.hope_date,
		site_address: row.site_address,
		created_at: row.created_at,
		authorName,
		authorPhone
	};

	return { inquiry };
};

export const actions: Actions = {
	answer: async ({ request, params, locals: { supabase } }) => {
		const fd = await request.formData();
		const answer = fd.get('answer')?.toString().trim() ?? '';

		if (!answer) return fail(400, { answer, message: '답변 내용을 입력해 주세요.' });

		const { error: updErr } = await supabase
			.from('inquiries')
			.update({ answer, status: 'answered', answered_at: new Date().toISOString() })
			.eq('id', params.id);

		if (updErr) return fail(500, { answer, message: '답변 저장 중 오류가 발생했습니다.' });
		return { success: true, message: '답변이 등록되었습니다.' };
	}
};
