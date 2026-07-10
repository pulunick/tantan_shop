import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) redirect(303, '/login');

	const orderNo = url.searchParams.get('order');
	if (!orderNo) redirect(303, '/');

	// 두 쿼리는 독립적 — 병렬 실행으로 TTFB 단축 (order 부재 시 bank 결과는 버려짐)
	const [{ data: order }, { data: bank }] = await Promise.all([
		supabase
			.from('orders')
			.select('id, order_no, total_amount, depositor_name, receiver_name, created_at')
			.eq('order_no', orderNo)
			.eq('user_id', user.id)
			.maybeSingle(),
		supabase.from('site_settings').select('value').eq('key', 'bank_account').maybeSingle()
	]);
	if (!order) redirect(303, '/');

	return { order, bank: bank?.value ?? null };
};
