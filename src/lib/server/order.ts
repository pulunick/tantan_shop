/**
 * 주문 생성 (서버 전용).
 *
 * 절대 규칙 반영:
 *  - 주문 금액은 서버에서 DB 가격 기준으로 재계산(pricing.ts). 클라이언트 값 미신뢰.
 *  - order_items 에 주문 시점의 product_name/option_name/unit_price 스냅샷 저장.
 *  - 품절/전화문의/숨김 상품은 recalculateCart 가 예외를 던져 주문 차단.
 *
 * 주문 대상은 클라이언트가 보낸 목록이 아니라 서버의 cart_items(본인 것) 를 읽어 사용한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartItem } from '$lib/cart/ops';
import { recalculateCart, type ProductFetcher, type PricedLine } from './pricing';
import { supabaseAdmin } from './supabase-admin';

export type ReceiverInfo = {
	receiver_name: string;
	receiver_phone: string;
	zip: string | null;
	addr1: string | null;
	addr2: string | null;
	memo: string | null;
	depositor_name: string;
};

/** 주문번호: T + YYYYMMDD + 6자리. date/rand 주입으로 테스트 가능. */
export function generateOrderNo(date: Date, rand: number): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	const suffix = String(Math.floor(rand * 1_000_000)).padStart(6, '0');
	return `T${y}${m}${d}${suffix}`;
}

/** PricedLine → order_items insert 행 (스냅샷). */
export function toOrderItemRows(orderId: string, lines: PricedLine[]) {
	return lines.map((l) => ({
		order_id: orderId,
		product_id: l.productId,
		product_name: l.product_name,
		option_name: l.option_name,
		unit_price: l.unit_price,
		quantity: l.quantity
	}));
}

function makeFetcher(supabase: SupabaseClient): ProductFetcher {
	return async (productIds, optionIds) => {
		const { data: products } = await supabase
			.from('products')
			.select('id,name,price,is_price_hidden,status')
			.in('id', productIds);
		const { data: options } = optionIds.length
			? await supabase
					.from('product_options')
					.select('id,product_id,name,extra_price,is_sold_out')
					.in('id', optionIds)
			: { data: [] };
		return { products: products ?? [], options: options ?? [] };
	};
}

export type CreateOrderResult = { orderNo: string; total: number };

/**
 * 본인 cart_items 로 주문을 생성한다. 금액/스냅샷은 서버 재계산 결과를 사용한다.
 *
 * 보안: orders/order_items 쓰기는 secret 키(supabaseAdmin)로만 수행한다. 사용자가
 * Data API 로 직접 orders 를 INSERT 해 total_amount/unit_price 를 조작하는 것을 막기 위해
 * orders_insert_own / order_items_insert_own RLS 정책은 제거했다(마이그레이션).
 * cart_items 조회/삭제는 본인 소유이므로 전달받은 user client(RLS) 를 그대로 쓴다.
 */
export async function createOrder(
	supabase: SupabaseClient,
	userId: string,
	receiver: ReceiverInfo
): Promise<CreateOrderResult> {
	// 1) 서버 장바구니 로드 (클라이언트 값 미신뢰) — 본인 것이므로 user client
	const { data: cartRows, error: cartErr } = await supabase
		.from('cart_items')
		.select('product_id, option_id, quantity')
		.eq('user_id', userId);
	if (cartErr) throw new Error('장바구니를 불러오지 못했습니다.');

	const items: CartItem[] = (cartRows ?? []).map((r) => ({
		productId: r.product_id,
		optionId: r.option_id,
		quantity: r.quantity
	}));

	// 2) 서버 재계산 + 검증 (품절/전화문의/숨김이면 여기서 throw → 주문 차단)
	const { lines, total } = await recalculateCart(items, makeFetcher(supabase));

	// 3) 주문 생성 (order_no 충돌 시 최대 3회 재시도)
	let orderId: string | null = null;
	let orderNo = '';
	for (let attempt = 0; attempt < 3 && !orderId; attempt++) {
		orderNo = generateOrderNo(new Date(), Math.random());
		const { data, error } = await supabaseAdmin
			.from('orders')
			.insert({
				order_no: orderNo,
				user_id: userId,
				receiver_name: receiver.receiver_name,
				receiver_phone: receiver.receiver_phone,
				zip: receiver.zip,
				addr1: receiver.addr1,
				addr2: receiver.addr2,
				memo: receiver.memo,
				payment_method: 'bank_transfer',
				payment_status: 'pending',
				order_status: 'pending',
				total_amount: total,
				depositor_name: receiver.depositor_name
			})
			.select('id')
			.single();
		if (!error && data) orderId = data.id;
		else if (error && error.code !== '23505') throw new Error('주문 생성에 실패했습니다.'); // 23505=unique_violation → 재시도
	}
	if (!orderId) throw new Error('주문번호 생성에 실패했습니다. 다시 시도해 주세요.');

	// 4) 주문 상품 스냅샷 저장 (실패 시 주문 롤백) — admin 으로 쓰기/삭제
	const { error: itemsErr } = await supabaseAdmin
		.from('order_items')
		.insert(toOrderItemRows(orderId, lines));
	if (itemsErr) {
		await supabaseAdmin.from('orders').delete().eq('id', orderId);
		throw new Error('주문 상품 저장에 실패했습니다.');
	}

	// 5) 장바구니 비우기 (주문 성공 후) — 본인 것이므로 user client
	await supabase.from('cart_items').delete().eq('user_id', userId);

	return { orderNo, total };
}
