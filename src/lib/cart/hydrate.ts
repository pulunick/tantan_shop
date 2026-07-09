/**
 * 장바구니 항목(CartItem)을 표시용 상세(상품명·썸네일·단가·주문가능 여부)로 채운다.
 * 비회원(로컬)·회원(서버) 공통으로 브라우저 Supabase 클라이언트로 조회한다.
 * 표시 전용 — 실제 주문 금액은 서버(pricing.ts)에서 다시 재계산한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartItem } from './ops';

export type CartDisplayRow = {
	productId: string;
	optionId: string | null;
	productName: string;
	optionName: string | null;
	thumbnailUrl: string | null;
	unitPrice: number; // 상품가 + 옵션 추가금 (전화문의/미가용이면 0)
	quantity: number;
	lineTotal: number;
	orderable: boolean;
	reason: string | null; // 주문 불가 사유(있으면)
};

type ProductRow = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: 'on_sale' | 'sold_out' | 'hidden';
	product_images: { url: string; is_thumbnail: boolean; sort_order: number }[] | null;
	product_options: { id: string; name: string; extra_price: number; is_sold_out: boolean }[] | null;
};

function pickThumb(p: ProductRow): string | null {
	const imgs = p.product_images ?? [];
	if (imgs.length === 0) return null;
	const thumb = imgs.find((i) => i.is_thumbnail);
	if (thumb) return thumb.url;
	return [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
}

export async function hydrateCart(
	supabase: SupabaseClient,
	items: CartItem[]
): Promise<CartDisplayRow[]> {
	if (items.length === 0) return [];
	const productIds = [...new Set(items.map((it) => it.productId))];

	const { data } = await supabase
		.from('products')
		.select(
			'id,name,price,is_price_hidden,status, product_images(url,is_thumbnail,sort_order), product_options(id,name,extra_price,is_sold_out)'
		)
		.in('id', productIds);

	const productMap = new Map<string, ProductRow>((data ?? []).map((p) => [p.id, p as ProductRow]));

	return items.map((item) => {
		const product = productMap.get(item.productId);
		if (!product) {
			return blocked(item, '삭제되었거나 판매 종료된 상품입니다.');
		}
		const option = item.optionId
			? (product.product_options ?? []).find((o) => o.id === item.optionId)
			: null;

		let orderable = true;
		let reason: string | null = null;
		if (product.is_price_hidden) {
			orderable = false;
			reason = '전화문의 상품 (주문 불가)';
		} else if (product.status !== 'on_sale') {
			orderable = false;
			reason = '품절';
		} else if (item.optionId && !option) {
			orderable = false;
			reason = '옵션이 변경되었습니다';
		} else if (option?.is_sold_out) {
			orderable = false;
			reason = '옵션 품절';
		}

		const unitPrice = product.is_price_hidden
			? 0
			: (product.price ?? 0) + (option?.extra_price ?? 0);

		return {
			productId: product.id,
			optionId: item.optionId ?? null,
			productName: product.name,
			optionName: option?.name ?? null,
			thumbnailUrl: pickThumb(product),
			unitPrice,
			quantity: item.quantity,
			lineTotal: unitPrice * item.quantity,
			orderable,
			reason
		};
	});
}

function blocked(item: CartItem, reason: string): CartDisplayRow {
	return {
		productId: item.productId,
		optionId: item.optionId ?? null,
		productName: '(알 수 없는 상품)',
		optionName: null,
		thumbnailUrl: null,
		unitPrice: 0,
		quantity: item.quantity,
		lineTotal: 0,
		orderable: false,
		reason
	};
}
