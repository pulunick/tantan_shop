import { describe, it, expect } from 'vitest';
import { addItem, setQuantity, removeItem, mergeCarts, totalCount, type CartItem } from './ops';

describe('addItem', () => {
	it('새 라인은 추가한다', () => {
		const r = addItem([], { productId: 'p1', optionId: null, quantity: 2 });
		expect(r).toEqual([{ productId: 'p1', optionId: null, quantity: 2 }]);
	});

	it('같은 (상품,옵션) 라인은 수량을 합산한다', () => {
		const start: CartItem[] = [{ productId: 'p1', optionId: 'o1', quantity: 1 }];
		const r = addItem(start, { productId: 'p1', optionId: 'o1', quantity: 2 });
		expect(r).toEqual([{ productId: 'p1', optionId: 'o1', quantity: 3 }]);
	});

	it('옵션이 다르면 별도 라인', () => {
		const start: CartItem[] = [{ productId: 'p1', optionId: 'o1', quantity: 1 }];
		const r = addItem(start, { productId: 'p1', optionId: 'o2', quantity: 1 });
		expect(r).toHaveLength(2);
	});

	it('수량은 최소 1로 보정', () => {
		const r = addItem([], { productId: 'p1', optionId: null, quantity: 0 });
		expect(r[0].quantity).toBe(1);
	});
});

describe('setQuantity / removeItem', () => {
	it('수량을 설정한다(최소 1 클램프)', () => {
		const start: CartItem[] = [{ productId: 'p1', optionId: null, quantity: 5 }];
		expect(setQuantity(start, 'p1', null, 3)[0].quantity).toBe(3);
		expect(setQuantity(start, 'p1', null, 0)[0].quantity).toBe(1);
	});

	it('라인을 제거한다', () => {
		const start: CartItem[] = [
			{ productId: 'p1', optionId: null, quantity: 1 },
			{ productId: 'p2', optionId: null, quantity: 1 }
		];
		expect(removeItem(start, 'p1', null)).toEqual([
			{ productId: 'p2', optionId: null, quantity: 1 }
		]);
	});
});

describe('mergeCarts — 비회원→회원 장바구니 병합', () => {
	it('겹치는 라인은 수량을 합산한다', () => {
		const local: CartItem[] = [{ productId: 'p1', optionId: null, quantity: 2 }];
		const server: CartItem[] = [{ productId: 'p1', optionId: null, quantity: 1 }];
		expect(mergeCarts(local, server)).toEqual([{ productId: 'p1', optionId: null, quantity: 3 }]);
	});

	it('서로 없는 라인은 모두 유지한다', () => {
		const local: CartItem[] = [{ productId: 'p1', optionId: null, quantity: 1 }];
		const server: CartItem[] = [{ productId: 'p2', optionId: 'o1', quantity: 1 }];
		const r = mergeCarts(local, server);
		expect(r).toHaveLength(2);
		expect(totalCount(r)).toBe(2);
	});

	it('옵션이 다르면 합산하지 않는다', () => {
		const local: CartItem[] = [{ productId: 'p1', optionId: 'o2', quantity: 1 }];
		const server: CartItem[] = [{ productId: 'p1', optionId: 'o1', quantity: 1 }];
		expect(mergeCarts(local, server)).toHaveLength(2);
	});

	it('빈 로컬 카트는 서버 카트를 그대로 둔다', () => {
		const server: CartItem[] = [{ productId: 'p1', optionId: null, quantity: 4 }];
		expect(mergeCarts([], server)).toEqual(server);
	});
});
