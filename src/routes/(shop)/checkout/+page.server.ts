import { redirect, fail } from '@sveltejs/kit';
import { hydrateCart } from '$lib/cart/hydrate';
import { createOrder } from '$lib/server/order';
import { CartValidationError } from '$lib/server/pricing';
import type { Actions, PageServerLoad } from './$types';

const LOGIN_REDIRECT = '/login?redirect=%2Fcheckout';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) redirect(303, LOGIN_REDIRECT);

	const { data: cart } = await supabase
		.from('cart_items')
		.select('product_id, option_id, quantity')
		.eq('user_id', user.id);
	const items = (cart ?? []).map((r) => ({
		productId: r.product_id,
		optionId: r.option_id,
		quantity: r.quantity
	}));
	if (items.length === 0) redirect(303, '/cart');

	const rows = await hydrateCart(supabase, items);
	const summaryTotal = rows.filter((r) => r.orderable).reduce((s, r) => s + r.lineTotal, 0);
	const hasBlocked = rows.some((r) => !r.orderable);

	const [{ data: profile }, { data: bank }] = await Promise.all([
		supabase.from('profiles').select('name, phone').eq('id', user.id).maybeSingle(),
		supabase.from('site_settings').select('value').eq('key', 'bank_account').maybeSingle()
	]);

	return { rows, summaryTotal, hasBlocked, profile: profile ?? null, bank: bank?.value ?? null };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session, user } = await safeGetSession();
		if (!session || !user) redirect(303, LOGIN_REDIRECT);

		const fd = await request.formData();
		const get = (k: string) => (fd.get(k)?.toString() ?? '').trim();
		const values = {
			receiver_name: get('receiver_name'),
			receiver_phone: get('receiver_phone'),
			zip: get('zip'),
			addr1: get('addr1'),
			addr2: get('addr2'),
			memo: get('memo'),
			depositor_name: get('depositor_name')
		};
		const agree = fd.get('agree') != null;

		const errors: Record<string, string> = {};
		if (!values.receiver_name) errors.receiver_name = '받는 분 이름을 입력해 주세요.';
		if (!values.receiver_phone) errors.receiver_phone = '연락처를 입력해 주세요.';
		if (!values.addr1) errors.addr1 = '주소를 입력해 주세요.';
		if (!values.depositor_name) errors.depositor_name = '입금자명을 입력해 주세요.';
		if (!agree) errors.agree = '주문 내용 및 약관에 동의해 주세요.';
		if (Object.keys(errors).length > 0) return fail(400, { values, errors });

		let orderNo: string;
		try {
			const res = await createOrder(supabase, user.id, {
				receiver_name: values.receiver_name,
				receiver_phone: values.receiver_phone,
				zip: values.zip || null,
				addr1: values.addr1 || null,
				addr2: values.addr2 || null,
				memo: values.memo || null,
				depositor_name: values.depositor_name
			});
			orderNo = res.orderNo;
		} catch (e) {
			// 품절/전화문의/숨김 등 주문 불가 → 차단 메시지
			if (e instanceof CartValidationError) return fail(400, { values, message: e.message });
			return fail(500, {
				values,
				message: e instanceof Error ? e.message : '주문 처리 중 오류가 발생했습니다.'
			});
		}

		redirect(303, `/checkout/complete?order=${orderNo}`);
	}
};
