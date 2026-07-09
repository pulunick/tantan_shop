import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) redirect(303, '/login');

	const orderNo = url.searchParams.get('order');
	if (!orderNo) redirect(303, '/');

	const { data: order } = await supabase
		.from('orders')
		.select('order_no, total_amount, depositor_name, receiver_name, created_at')
		.eq('order_no', orderNo)
		.eq('user_id', user.id)
		.maybeSingle();
	if (!order) redirect(303, '/');

	const { data: bank } = await supabase
		.from('site_settings')
		.select('value')
		.eq('key', 'bank_account')
		.maybeSingle();

	return { order, bank: bank?.value ?? null };
};
