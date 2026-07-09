import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export type RecentAddress = {
	receiver_name: string;
	receiver_phone: string;
	zip: string | null;
	addr1: string | null;
	addr2: string | null;
	created_at: string;
};

/**
 * 배송지 관리 — Phase 1 에는 별도 배송지 관리 테이블이 없다(정보 안내 페이지).
 * 참고용으로 최근 주문에서 사용한 배송지를 읽기전용으로 보여준다.
 */
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?redirect=%2Fmypage%2Faddresses');

	const { data } = await supabase
		.from('orders')
		.select('receiver_name, receiver_phone, zip, addr1, addr2, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(20);

	const rows = (data ?? []) as RecentAddress[];

	// 동일 주소(도로명+상세) 중복 제거, 최근 것 우선, 최대 5건.
	const seen = new Set<string>();
	const addresses: RecentAddress[] = [];
	for (const row of rows) {
		const key = `${row.addr1 ?? ''}|${row.addr2 ?? ''}`;
		if (seen.has(key)) continue;
		seen.add(key);
		addresses.push(row);
		if (addresses.length >= 5) break;
	}

	return { addresses };
};
