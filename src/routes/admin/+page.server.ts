import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/**
 * 관리자 대시보드: 요약카드 4(신규주문/미답변문의/신규가입/판매중 상품) + 최근 주문 5.
 * 카운트는 head:true 조회로 행 데이터 없이 개수만 가져온다.
 */
export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

	const [pendingOrders, waitingInquiries, newMembers, onSaleProducts, recentOrders] =
		await Promise.all([
			supabase
				.from('orders')
				.select('*', { count: 'exact', head: true })
				.eq('order_status', 'pending'),
			supabase
				.from('inquiries')
				.select('*', { count: 'exact', head: true })
				.eq('status', 'waiting'),
			supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.gte('created_at', sevenDaysAgoIso),
			supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'on_sale'),
			supabase
				.from('orders')
				.select('id, order_no, receiver_name, total_amount, order_status, created_at')
				.order('created_at', { ascending: false })
				.limit(5)
		]);

	return {
		counts: {
			pendingOrders: pendingOrders.count ?? 0,
			waitingInquiries: waitingInquiries.count ?? 0,
			newMembers: newMembers.count ?? 0,
			onSaleProducts: onSaleProducts.count ?? 0
		},
		recentOrders: recentOrders.data ?? []
	};
};

export const actions: Actions = {
	// 관리자 셸 상단바의 로그아웃 폼이 /admin?/logout 으로 명시 지정해 호출한다.
	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/login');
	}
};
