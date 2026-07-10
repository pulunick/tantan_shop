import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { OrderStatus } from '$lib/types';
import { STATUS_TABS, paymentStatusFor } from './shared';

/**
 * 주문 관리 목록. 상태 탭 + 주문번호/받는분 이름 검색 + 페이지네이션.
 * admin RLS(orders_select_own_or_admin) 로 전체 주문이 조회된다.
 * 원클릭 입금확인(confirmPayment) : 결제대기 행에서 바로 결제완료 처리.
 */

const PAGE_SIZE = 20;

export type OrderListItem = {
	id: string;
	order_no: string;
	created_at: string;
	receiver_name: string;
	order_status: OrderStatus;
	total_amount: number;
	itemSummary: string;
};

type OrderItemNameRow = { product_name: string };
type OrderRow = {
	id: string;
	order_no: string;
	created_at: string;
	receiver_name: string;
	order_status: OrderStatus;
	total_amount: number;
	order_items: OrderItemNameRow[] | null;
};

function summarize(items: OrderItemNameRow[] | null): string {
	const list = items ?? [];
	if (list.length === 0) return '주문 상품 없음';
	const rest = list.length - 1;
	return rest > 0 ? `${list[0].product_name} 외 ${rest}건` : list[0].product_name;
}

function parseStatus(value: string | null): OrderStatus | 'all' {
	const found = STATUS_TABS.find((t) => t.value === value);
	return found ? found.value : 'all';
}

function parsePage(value: string | null): number {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : 1;
}

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const status = parseStatus(url.searchParams.get('status'));
	const q = url.searchParams.get('q')?.trim() ?? '';
	const page = parsePage(url.searchParams.get('page'));

	// 상태 탭 카운트 (검색어와 무관하게 전체 기준)
	const counts = await Promise.all(
		STATUS_TABS.map(async (tab) => {
			let cq = supabase.from('orders').select('id', { count: 'exact', head: true });
			if (tab.value !== 'all') cq = cq.eq('order_status', tab.value);
			const { count } = await cq;
			return [tab.value, count ?? 0] as const;
		})
	);
	const countMap = Object.fromEntries(counts) as Record<OrderStatus | 'all', number>;

	let query = supabase
		.from('orders')
		.select(
			'id, order_no, created_at, receiver_name, order_status, total_amount, order_items(product_name)',
			{ count: 'exact' }
		);

	if (status !== 'all') query = query.eq('order_status', status);
	if (q) {
		// PostgREST or() 필터는 쉼표/괄호/따옴표가 문법 구분자 — 검색어에 섞이면 필터가 깨진다
		// ("홍길동,테스트" 같은 입력 방어). 구분자만 제거하고 나머지는 그대로 ilike 매칭.
		const safe = q.replace(/[,()"\\]/g, '').trim();
		if (safe) query = query.or(`order_no.ilike.%${safe}%,receiver_name.ilike.%${safe}%`);
	}

	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const { data, count } = await query.order('created_at', { ascending: false }).range(from, to);

	const orders: OrderListItem[] = ((data ?? []) as OrderRow[]).map((o) => ({
		id: o.id,
		order_no: o.order_no,
		created_at: o.created_at,
		receiver_name: o.receiver_name,
		order_status: o.order_status,
		total_amount: o.total_amount,
		itemSummary: summarize(o.order_items)
	}));

	return {
		orders,
		total: count ?? 0,
		page,
		pageSize: PAGE_SIZE,
		status,
		q,
		countMap
	};
};

export const actions: Actions = {
	// 원클릭 입금확인: 결제대기(pending) 주문만 결제완료(paid)로 전환.
	// .eq('order_status', 'pending') 조건으로 이미 처리된 주문의 이중 처리를 막고, 갱신 행 수로 성공 판정한다.
	confirmPayment: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = fd.get('id')?.toString();

		if (!id) return fail(400, { message: '잘못된 요청입니다.' });

		const nextStatus: OrderStatus = 'paid';
		const { data, error: updErr } = await supabase
			.from('orders')
			.update({ order_status: nextStatus, payment_status: paymentStatusFor(nextStatus) })
			.eq('id', id)
			.eq('order_status', 'pending')
			.select('id');

		if (updErr) return fail(500, { message: '입금확인 처리 중 오류가 발생했습니다.' });
		if (!data || data.length === 0) {
			return fail(409, { message: '이미 처리되었거나 존재하지 않는 주문입니다.' });
		}

		return { success: true, message: '입금확인 처리되었습니다.' };
	}
};
