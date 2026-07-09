/**
 * 주문 금액 서버 재계산 + 주문 가능 여부 검증.
 *
 * 절대 규칙: 주문 금액은 클라이언트 값을 신뢰하지 않고 서버에서 DB 가격 기준으로 재계산한다.
 * 품절(sold_out)/전화문의(is_price_hidden)/숨김(hidden) 상품은 주문을 차단한다.
 *
 * DB 접근은 fetcher 로 주입받아 순수 로직으로 검증 가능하게 한다(단위 테스트).
 */
import type { CartItem } from '$lib/cart/ops';

export type ProductRow = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: 'on_sale' | 'sold_out' | 'hidden';
};

export type OptionRow = {
	id: string;
	product_id: string;
	name: string;
	extra_price: number;
	is_sold_out: boolean;
};

export type PricedLine = {
	productId: string;
	optionId: string | null;
	product_name: string; // 주문 스냅샷용
	option_name: string | null; // 주문 스냅샷용
	unit_price: number; // 주문 스냅샷용 (상품가 + 옵션 추가금)
	quantity: number;
	line_total: number;
};

export type CartValidationCode =
	| 'NOT_FOUND'
	| 'NOT_ON_SALE' // 품절 또는 숨김
	| 'PHONE_INQUIRY' // 전화문의 상품 — 주문 불가
	| 'NO_PRICE'
	| 'OPTION_NOT_FOUND'
	| 'OPTION_SOLD_OUT'
	| 'INVALID_QUANTITY'
	| 'EMPTY';

export class CartValidationError extends Error {
	code: CartValidationCode;
	productId?: string;
	constructor(code: CartValidationCode, message: string, productId?: string) {
		super(message);
		this.name = 'CartValidationError';
		this.code = code;
		this.productId = productId;
	}
}

export type ProductFetcher = (
	productIds: string[],
	optionIds: string[]
) => Promise<{ products: ProductRow[]; options: OptionRow[] }>;

/**
 * 장바구니 항목을 DB 가격 기준으로 재계산한다.
 * 검증 실패 시 CartValidationError 를 던진다(주문 차단).
 */
export async function recalculateCart(
	items: CartItem[],
	fetchRows: ProductFetcher
): Promise<{ lines: PricedLine[]; total: number }> {
	if (items.length === 0) throw new CartValidationError('EMPTY', '장바구니가 비어 있습니다.');

	const productIds = [...new Set(items.map((it) => it.productId))];
	const optionIds = [...new Set(items.map((it) => it.optionId).filter((id): id is string => !!id))];

	const { products, options } = await fetchRows(productIds, optionIds);
	const productMap = new Map(products.map((p) => [p.id, p]));
	const optionMap = new Map(options.map((o) => [o.id, o]));

	const lines: PricedLine[] = items.map((item) => {
		if (!Number.isInteger(item.quantity) || item.quantity < 1) {
			throw new CartValidationError(
				'INVALID_QUANTITY',
				'수량이 올바르지 않습니다.',
				item.productId
			);
		}

		const product = productMap.get(item.productId);
		if (!product) {
			throw new CartValidationError('NOT_FOUND', '상품을 찾을 수 없습니다.', item.productId);
		}
		if (product.is_price_hidden) {
			throw new CartValidationError(
				'PHONE_INQUIRY',
				`'${product.name}'은(는) 전화문의 상품이라 주문할 수 없습니다.`,
				product.id
			);
		}
		if (product.status !== 'on_sale') {
			throw new CartValidationError(
				'NOT_ON_SALE',
				`'${product.name}'은(는) 현재 판매 중이 아닙니다.`,
				product.id
			);
		}
		if (product.price == null) {
			throw new CartValidationError('NO_PRICE', `'${product.name}'의 가격이 없습니다.`, product.id);
		}

		let optionName: string | null = null;
		let extra = 0;
		if (item.optionId) {
			const option = optionMap.get(item.optionId);
			if (!option || option.product_id !== product.id) {
				throw new CartValidationError('OPTION_NOT_FOUND', '옵션을 찾을 수 없습니다.', product.id);
			}
			if (option.is_sold_out) {
				throw new CartValidationError(
					'OPTION_SOLD_OUT',
					`'${product.name} - ${option.name}' 옵션이 품절입니다.`,
					product.id
				);
			}
			optionName = option.name;
			extra = option.extra_price;
		}

		const unit_price = product.price + extra;
		return {
			productId: product.id,
			optionId: item.optionId ?? null,
			product_name: product.name,
			option_name: optionName,
			unit_price,
			quantity: item.quantity,
			line_total: unit_price * item.quantity
		};
	});

	const total = lines.reduce((sum, l) => sum + l.line_total, 0);
	return { lines, total };
}
