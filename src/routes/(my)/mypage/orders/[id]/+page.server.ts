import { error, fail, redirect } from '@sveltejs/kit';
import { requestOrderCancel } from '$lib/server/order-cancel';
import type { Actions, PageServerLoad } from './$types';
import type { OrderStatus } from '$lib/types';

export type OrderItemRow = {
	id: string;
	product_name: string;
	option_name: string | null;
	unit_price: number;
	quantity: number;
};

export type OrderDetail = {
	id: string;
	order_no: string;
	created_at: string;
	receiver_name: string;
	receiver_phone: string;
	zip: string | null;
	addr1: string | null;
	addr2: string | null;
	memo: string | null;
	payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded';
	order_status: OrderStatus;
	total_amount: number;
	depositor_name: string | null;
	tracking_company: string | null;
	tracking_no: string | null;
};

/** 주문 상세 — 본인 주문이 아니거나 없으면 404 (RLS 로 이미 본인 것만 조회되지만 명시적으로도 필터). */
export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, `/login?redirect=${encodeURIComponent(`/mypage/orders/${params.id}`)}`);

	const { data, error: dbError } = await supabase
		.from('orders')
		.select(
			`id, order_no, created_at, receiver_name, receiver_phone, zip, addr1, addr2, memo,
			 payment_status, order_status, total_amount, depositor_name, tracking_company, tracking_no,
			 order_items ( id, product_name, option_name, unit_price, quantity )`
		)
		.eq('id', params.id)
		.eq('user_id', user.id)
		.maybeSingle();

	if (dbError || !data) error(404, '주문을 찾을 수 없습니다.');

	const { order_items, ...order } = data as OrderDetail & { order_items: OrderItemRow[] | null };

	return {
		order: order as OrderDetail,
		items: (order_items ?? []) as OrderItemRow[]
	};
};

export const actions: Actions = {
	// 배송준비 전(pending/paid) 주문 취소. 본인·상태 검증은 requestOrderCancel 내부에서 수행.
	cancel: async ({ params, locals: { safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');

		const result = await requestOrderCancel(user.id, params.id);
		if (!result.ok) return fail(400, { message: result.message });
		return { success: true, message: '주문이 취소되었습니다.' };
	}
};
