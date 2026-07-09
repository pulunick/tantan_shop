import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { OrderStatus } from '$lib/types';

export type OrderListItem = {
	id: string;
	order_no: string;
	created_at: string;
	order_status: OrderStatus;
	total_amount: number;
	itemSummary: string;
};

type OrderItemNameRow = { product_name: string };
type OrderRow = {
	id: string;
	order_no: string;
	created_at: string;
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

/** 주문내역 목록 — 최신순. */
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?redirect=%2Fmypage%2Forders');

	const { data } = await supabase
		.from('orders')
		.select('id, order_no, created_at, order_status, total_amount, order_items(product_name)')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	const orders: OrderListItem[] = ((data ?? []) as OrderRow[]).map((o) => ({
		id: o.id,
		order_no: o.order_no,
		created_at: o.created_at,
		order_status: o.order_status,
		total_amount: o.total_amount,
		itemSummary: summarize(o.order_items)
	}));

	return { orders };
};
