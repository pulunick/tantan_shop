import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { OrderStatus } from '$lib/types';

/**
 * 주문 상세 + 상태 플로우.
 * 상태 플로우: 결제대기(pending)→결제완료(paid)→배송준비(preparing)→배송중(shipping)→배송완료(delivered)
 * + 취소(cancelled)/환불(refunded). 배송중 전환 시 택배사·송장번호 필수.
 * 결제 관련 payment_status 는 order_status 에 맞춰 함께 갱신한다(클라이언트 값 신뢰 안 함, 서버에서 매핑).
 */

const ORDER_STATUSES: OrderStatus[] = [
	'pending',
	'paid',
	'preparing',
	'shipping',
	'delivered',
	'cancelled',
	'refunded'
];

function paymentStatusFor(orderStatus: OrderStatus): 'pending' | 'paid' | 'cancelled' | 'refunded' {
	if (orderStatus === 'pending') return 'pending';
	if (orderStatus === 'cancelled') return 'cancelled';
	if (orderStatus === 'refunded') return 'refunded';
	return 'paid'; // paid/preparing/shipping/delivered
}

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
	user_id: string;
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

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data, error: dbError } = await supabase
		.from('orders')
		.select(
			`id, order_no, created_at, user_id, receiver_name, receiver_phone, zip, addr1, addr2, memo,
			 payment_status, order_status, total_amount, depositor_name, tracking_company, tracking_no,
			 order_items ( id, product_name, option_name, unit_price, quantity )`
		)
		.eq('id', params.id)
		.maybeSingle();

	if (dbError || !data) error(404, '주문을 찾을 수 없습니다.');

	const { order_items, ...order } = data as OrderDetail & { order_items: OrderItemRow[] | null };

	return {
		order: order as OrderDetail,
		items: (order_items ?? []) as OrderItemRow[]
	};
};

export const actions: Actions = {
	// 상태 변경(결제대기~배송완료). 배송중 전환은 택배사/송장번호 필수.
	updateStatus: async ({ request, params, locals: { supabase } }) => {
		const fd = await request.formData();
		const nextStatus = fd.get('order_status')?.toString() as OrderStatus | undefined;
		const trackingCompany = fd.get('tracking_company')?.toString().trim() || null;
		const trackingNo = fd.get('tracking_no')?.toString().trim() || null;

		if (!nextStatus || !ORDER_STATUSES.includes(nextStatus)) {
			return fail(400, { message: '잘못된 주문 상태입니다.' });
		}

		if (nextStatus === 'shipping' && (!trackingCompany || !trackingNo)) {
			return fail(400, {
				message: '배송중으로 변경하려면 택배사와 송장번호를 입력해야 합니다.',
				trackingCompany,
				trackingNo
			});
		}

		const { error: updErr } = await supabase
			.from('orders')
			.update({
				order_status: nextStatus,
				payment_status: paymentStatusFor(nextStatus),
				tracking_company: trackingCompany,
				tracking_no: trackingNo
			})
			.eq('id', params.id);

		if (updErr) return fail(500, { message: '상태 변경 중 오류가 발생했습니다.' });

		return { success: true, message: '주문 상태가 변경되었습니다.' };
	},

	// 목록으로 돌아가지 않고 상세에 머무는 취소 처리 (빠른 버튼)
	cancel: async ({ params, locals: { supabase } }) => {
		const { error: updErr } = await supabase
			.from('orders')
			.update({ order_status: 'cancelled', payment_status: 'cancelled' })
			.eq('id', params.id);
		if (updErr) return fail(500, { message: '취소 처리 중 오류가 발생했습니다.' });
		return { success: true, message: '주문이 취소 처리되었습니다.' };
	},

	refund: async ({ params, locals: { supabase } }) => {
		const { error: updErr } = await supabase
			.from('orders')
			.update({ order_status: 'refunded', payment_status: 'refunded' })
			.eq('id', params.id);
		if (updErr) return fail(500, { message: '환불 처리 중 오류가 발생했습니다.' });
		return { success: true, message: '주문이 환불 처리되었습니다.' };
	}
};
