import type { PageServerLoad } from './$types';

/**
 * 회원 관리 목록. 이름/연락처 검색 + 페이지네이션. role 수정 없음(조회 전용).
 */

const PAGE_SIZE = 20;

export type MemberRow = {
	id: string;
	name: string | null;
	phone: string | null;
	role: string;
	created_at: string;
};

function parsePage(value: string | null): number {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : 1;
}

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const page = parsePage(url.searchParams.get('page'));

	let query = supabase
		.from('profiles')
		.select('id, name, phone, role, created_at', { count: 'exact' });

	if (q) {
		// PostgREST or() 필터는 쉼표/괄호/따옴표가 문법 구분자 — 검색어에서 제거해 필터 깨짐 방지
		const safe = q.replace(/[,()"\\]/g, '').trim();
		if (safe) query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
	}

	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const { data, count } = await query.order('created_at', { ascending: false }).range(from, to);

	return {
		members: (data ?? []) as MemberRow[],
		total: count ?? 0,
		page,
		pageSize: PAGE_SIZE,
		q
	};
};
