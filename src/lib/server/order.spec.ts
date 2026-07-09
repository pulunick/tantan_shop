import { describe, it, expect } from 'vitest';
import { generateOrderNo, toOrderItemRows } from './order';
import type { PricedLine } from './pricing';

describe('generateOrderNo', () => {
	it('T + YYYYMMDD + 6자리 형식', () => {
		const no = generateOrderNo(new Date(2026, 6, 9), 0.123456); // 2026-07-09
		expect(no).toBe('T20260709123456');
		expect(no).toMatch(/^T\d{14}$/);
	});

	it('월/일을 0 패딩한다', () => {
		expect(generateOrderNo(new Date(2026, 0, 5), 0)).toBe('T20260105000000');
	});

	it('rand 를 6자리로 패딩한다', () => {
		expect(generateOrderNo(new Date(2026, 0, 1), 0.000042)).toBe('T20260101000042');
	});
});

describe('toOrderItemRows — 주문 스냅샷 매핑', () => {
	it('PricedLine 을 order_items 행으로(스냅샷 필드 보존)', () => {
		const lines: PricedLine[] = [
			{
				productId: 'p1',
				optionId: 'o1',
				product_name: '경사로',
				option_name: '120cm',
				unit_price: 114000,
				quantity: 2,
				line_total: 228000
			}
		];
		expect(toOrderItemRows('order-1', lines)).toEqual([
			{
				order_id: 'order-1',
				product_id: 'p1',
				product_name: '경사로',
				option_name: '120cm',
				unit_price: 114000,
				quantity: 2
			}
		]);
	});
});
