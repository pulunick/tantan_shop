import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { OrderStatus } from '$lib/types';

/** 회원 상세 — 프로필 정보 + 해당 회원의 주문 이력. role 수정 없음(조회 전용). */

export type MemberDetail = {
	id: string;
	name: string | null;
	phone: string | null;
	role: string;
	created_at: string;
};

export type MemberOrderRow = {
	id: string;
	order_no: string;
	created_at: string;
	order_status: OrderStatus;
	total_amount: number;
};

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: profile, error: dbError } = await supabase
		.from('profiles')
		.select('id, name, phone, role, created_at')
		.eq('id', params.id)
		.maybeSingle();

	if (dbError || !profile) error(404, '회원을 찾을 수 없습니다.');

	const { data: orders } = await supabase
		.from('orders')
		.select('id, order_no, created_at, order_status, total_amount')
		.eq('user_id', params.id)
		.order('created_at', { ascending: false });

	return {
		member: profile as MemberDetail,
		orders: (orders ?? []) as MemberOrderRow[]
	};
};
