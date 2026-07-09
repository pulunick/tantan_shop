import { describe, it, expect } from 'vitest';
import {
	recalculateCart,
	CartValidationError,
	type ProductRow,
	type OptionRow,
	type ProductFetcher
} from './pricing';
import type { CartItem } from '$lib/cart/ops';

// 테스트용 DB fetcher: 주어진 상품/옵션 목록에서 id 로 조회
function makeFetcher(products: ProductRow[], options: OptionRow[] = []): ProductFetcher {
	return async (productIds, optionIds) => ({
		products: products.filter((p) => productIds.includes(p.id)),
		options: options.filter((o) => optionIds.includes(o.id))
	});
}

const onSale: ProductRow = {
	id: 'p1',
	name: '경사로',
	price: 89000,
	is_price_hidden: false,
	status: 'on_sale'
};
const soldOut: ProductRow = {
	id: 'p2',
	name: '논슬립',
	price: 12000,
	is_price_hidden: false,
	status: 'sold_out'
};
const phoneInquiry: ProductRow = {
	id: 'p3',
	name: '점자블록',
	price: null,
	is_price_hidden: true,
	status: 'on_sale'
};
const hidden: ProductRow = {
	id: 'p4',
	name: '숨김상품',
	price: 5000,
	is_price_hidden: false,
	status: 'hidden'
};

describe('recalculateCart — 서버 가격 재계산', () => {
	it('DB 가격 기준으로 합계를 계산한다 (클라이언트 값 무시)', async () => {
		const items: CartItem[] = [{ productId: 'p1', optionId: null, quantity: 2 }];
		const { lines, total } = await recalculateCart(items, makeFetcher([onSale]));
		expect(total).toBe(178000);
		expect(lines[0].unit_price).toBe(89000);
		expect(lines[0].line_total).toBe(178000);
		expect(lines[0].product_name).toBe('경사로'); // 스냅샷 필드
	});

	it('옵션 추가금을 단가에 더한다', async () => {
		const option: OptionRow = {
			id: 'o1',
			product_id: 'p1',
			name: '120cm',
			extra_price: 25000,
			is_sold_out: false
		};
		const items: CartItem[] = [{ productId: 'p1', optionId: 'o1', quantity: 1 }];
		const { lines, total } = await recalculateCart(items, makeFetcher([onSale], [option]));
		expect(lines[0].unit_price).toBe(114000);
		expect(lines[0].option_name).toBe('120cm');
		expect(total).toBe(114000);
	});

	it('여러 라인의 합계를 더한다', async () => {
		const p5: ProductRow = { ...onSale, id: 'p5', name: '경보기', price: 19000 };
		const items: CartItem[] = [
			{ productId: 'p1', optionId: null, quantity: 1 },
			{ productId: 'p5', optionId: null, quantity: 3 }
		];
		const { total } = await recalculateCart(items, makeFetcher([onSale, p5]));
		expect(total).toBe(89000 + 57000);
	});
});

describe('recalculateCart — 주문 차단', () => {
	it('품절 상품은 NOT_ON_SALE 로 차단', async () => {
		const items: CartItem[] = [{ productId: 'p2', optionId: null, quantity: 1 }];
		await expect(recalculateCart(items, makeFetcher([soldOut]))).rejects.toMatchObject({
			code: 'NOT_ON_SALE'
		});
	});

	it('전화문의 상품은 PHONE_INQUIRY 로 차단', async () => {
		const items: CartItem[] = [{ productId: 'p3', optionId: null, quantity: 1 }];
		await expect(recalculateCart(items, makeFetcher([phoneInquiry]))).rejects.toMatchObject({
			code: 'PHONE_INQUIRY'
		});
	});

	it('숨김 상품은 NOT_ON_SALE 로 차단', async () => {
		const items: CartItem[] = [{ productId: 'p4', optionId: null, quantity: 1 }];
		await expect(recalculateCart(items, makeFetcher([hidden]))).rejects.toMatchObject({
			code: 'NOT_ON_SALE'
		});
	});

	it('존재하지 않는 상품은 NOT_FOUND', async () => {
		const items: CartItem[] = [{ productId: 'nope', optionId: null, quantity: 1 }];
		await expect(recalculateCart(items, makeFetcher([]))).rejects.toBeInstanceOf(
			CartValidationError
		);
	});

	it('품절 옵션은 OPTION_SOLD_OUT 로 차단', async () => {
		const option: OptionRow = {
			id: 'o2',
			product_id: 'p1',
			name: '특대',
			extra_price: 0,
			is_sold_out: true
		};
		const items: CartItem[] = [{ productId: 'p1', optionId: 'o2', quantity: 1 }];
		await expect(recalculateCart(items, makeFetcher([onSale], [option]))).rejects.toMatchObject({
			code: 'OPTION_SOLD_OUT'
		});
	});

	it('수량 0/음수/소수는 INVALID_QUANTITY', async () => {
		const items: CartItem[] = [{ productId: 'p1', optionId: null, quantity: 0 }];
		await expect(recalculateCart(items, makeFetcher([onSale]))).rejects.toMatchObject({
			code: 'INVALID_QUANTITY'
		});
	});

	it('빈 장바구니는 EMPTY', async () => {
		await expect(recalculateCart([], makeFetcher([]))).rejects.toMatchObject({ code: 'EMPTY' });
	});
});
