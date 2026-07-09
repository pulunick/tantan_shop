/**
 * 사용자 주문 취소 요청 (서버 전용).
 * 정책: 배송준비 전(order_status가 pending/paid)에만 취소 가능, 이후는 전화 협의.
 * 주문 상태 변경은 admin/서버만 가능(RLS)하므로 secret 키 클라이언트(supabaseAdmin)로 수행하되,
 * 소유권·상태를 코드에서 검증한다.
 */
import { supabaseAdmin } from './supabase-admin';

export type CancelResult = { ok: true } | { ok: false; message: string };

const CANCELLABLE = ['pending', 'paid'];

export async function requestOrderCancel(userId: string, orderId: string): Promise<CancelResult> {
	const { data: order, error } = await supabaseAdmin
		.from('orders')
		.select('id, user_id, order_status, payment_status')
		.eq('id', orderId)
		.maybeSingle();

	if (error || !order) return { ok: false, message: '주문을 찾을 수 없습니다.' };
	if (order.user_id !== userId) return { ok: false, message: '본인 주문만 취소할 수 있습니다.' };
	if (!CANCELLABLE.includes(order.order_status)) {
		return {
			ok: false,
			message: '이미 배송 준비가 시작되어 온라인 취소가 불가합니다. 전화로 문의해 주세요.'
		};
	}

	// 입금완료(paid) 상태면 환불 대상으로 표시 (실제 환불은 관리자가 처리)
	const payment_status = order.payment_status === 'paid' ? 'refunded' : 'cancelled';
	// 확인-업데이트 사이 race 제거: WHERE 에 order_status IN CANCELLABLE 를 함께 걸고
	// 실제 갱신된 행 수로 판정한다(그 사이 배송준비/배송중으로 바뀌었으면 0행 → 실패).
	const { data: updated, error: updErr } = await supabaseAdmin
		.from('orders')
		.update({ order_status: 'cancelled', payment_status })
		.eq('id', orderId)
		.in('order_status', CANCELLABLE)
		.select('id');

	if (updErr) return { ok: false, message: '취소 처리 중 오류가 발생했습니다.' };
	if (!updated || updated.length === 0) {
		return {
			ok: false,
			message: '이미 배송 준비가 시작되어 온라인 취소가 불가합니다. 전화로 문의해 주세요.'
		};
	}
	return { ok: true };
}
