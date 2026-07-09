import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// supabaseAdmin(secret 키 클라이언트)을 목으로 대체 — 실제 $env/키 로딩 없이 롤백 경로 검증.
const { ordersDelete, adminMock } = vi.hoisted(() => {
	const ordersDelete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
	const adminMock = {
		from: (table: string) => {
			if (table === 'orders') {
				return {
					insert: () => ({
						select: () => ({
							single: () => Promise.resolve({ data: { id: 'order-1' }, error: null })
						})
					}),
					delete: ordersDelete
				};
			}
			if (table === 'order_items') {
				// 스냅샷 저장 실패를 강제해 롤백 경로를 탄다.
				return { insert: () => Promise.resolve({ error: { message: 'items insert failed' } }) };
			}
			throw new Error(`unexpected admin table: ${table}`);
		}
	};
	return { ordersDelete, adminMock };
});
vi.mock('./supabase-admin', () => ({ supabaseAdmin: adminMock }));

import { generateOrderNo, toOrderItemRows, createOrder } from './order';
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

describe('createOrder — 스냅샷 저장 실패 시 롤백', () => {
	// 본인 cart_items/상품 조회는 user client(목). 주문/스냅샷 쓰기는 supabaseAdmin(목).
	function userClientStub(): SupabaseClient {
		return {
			from: (table: string) => {
				if (table === 'cart_items') {
					return {
						select: () => ({
							eq: () =>
								Promise.resolve({
									data: [{ product_id: 'p1', option_id: null, quantity: 2 }],
									error: null
								})
						}),
						delete: () => ({ eq: () => Promise.resolve({ error: null }) })
					};
				}
				if (table === 'products') {
					return {
						select: () => ({
							in: () =>
								Promise.resolve({
									data: [
										{
											id: 'p1',
											name: '경사로',
											price: 10000,
											is_price_hidden: false,
											status: 'on_sale'
										}
									],
									error: null
								})
						})
					};
				}
				if (table === 'product_options') {
					return { select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) };
				}
				throw new Error(`unexpected user table: ${table}`);
			}
		} as unknown as SupabaseClient;
	}

	const receiver = {
		receiver_name: '홍길동',
		receiver_phone: '010-0000-0000',
		zip: null,
		addr1: '부산',
		addr2: null,
		memo: null,
		depositor_name: '홍길동'
	};

	it('order_items 저장 실패 시 orders delete(롤백)를 호출하고 예외를 던진다', async () => {
		ordersDelete.mockClear();
		await expect(createOrder(userClientStub(), 'user-1', receiver)).rejects.toThrow(
			'주문 상품 저장에 실패했습니다.'
		);
		expect(ordersDelete).toHaveBeenCalledTimes(1);
	});
});
