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
	thumbnail_url: string | null;
};

// order_items -> products 는 N:1(FK) 이므로 PostgREST 는 단일 객체를 반환한다(상품 삭제 시 null).
type OrderItemQueryRow = {
	id: string;
	product_name: string;
	option_name: string | null;
	unit_price: number;
	quantity: number;
	products: {
		product_images: { url: string; is_thumbnail: boolean; sort_order: number }[] | null;
	} | null;
};

/** 표시용 썸네일: 대표 이미지(is_thumbnail) 우선, 없으면 정렬순 첫 이미지. 상품이 삭제됐으면 null. */
function pickThumbnail(row: OrderItemQueryRow): string | null {
	const images = row.products?.product_images ?? [];
	if (images.length === 0) return null;
	const thumb = images.find((i) => i.is_thumbnail);
	if (thumb) return thumb.url;
	return [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
}

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

export type BankAccount = { bank: string; holder: string; number: string };

/** 주문 상세 — 본인 주문이 아니거나 없으면 404 (RLS 로 이미 본인 것만 조회되지만 명시적으로도 필터). */
export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, `/login?redirect=${encodeURIComponent(`/mypage/orders/${params.id}`)}`);

	const [{ data, error: dbError }, { data: bankRow }] = await Promise.all([
		supabase
			.from('orders')
			.select(
				`id, order_no, created_at, receiver_name, receiver_phone, zip, addr1, addr2, memo,
				 payment_status, order_status, total_amount, depositor_name, tracking_company, tracking_no,
				 order_items (
				 	id, product_name, option_name, unit_price, quantity,
				 	products ( product_images ( url, is_thumbnail, sort_order ) )
				 )`
			)
			.eq('id', params.id)
			.eq('user_id', user.id)
			.maybeSingle(),
		supabase.from('site_settings').select('value').eq('key', 'bank_account').maybeSingle()
	]);

	if (dbError || !data) error(404, '주문을 찾을 수 없습니다.');

	// select 문자열만으로는 postgrest-js 가 관계 카디널리티를 알 수 없어 중첩 관계를 배열로 추론한다.
	// 위에서 선언한 실제 런타임 형태(OrderItemQueryRow, N:1 은 단일 객체)로 다시 매핑하기 위해
	// unknown 경유로 캐스팅한다.
	const { order_items, ...order } = data as unknown as OrderDetail & {
		order_items: OrderItemQueryRow[] | null;
	};

	return {
		order: order as OrderDetail,
		items: (order_items ?? []).map((row) => ({
			id: row.id,
			product_name: row.product_name,
			option_name: row.option_name,
			unit_price: row.unit_price,
			quantity: row.quantity,
			thumbnail_url: pickThumbnail(row)
		})) as OrderItemRow[],
		bank: (bankRow?.value ?? null) as BankAccount | null
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
