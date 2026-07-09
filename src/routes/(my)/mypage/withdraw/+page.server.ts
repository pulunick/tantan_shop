import { fail, redirect } from '@sveltejs/kit';
import { withdrawAccount } from '$lib/server/account';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?redirect=%2Fmypage%2Fwithdraw');
	return {};
};

export const actions: Actions = {
	// 주문 이력이 없으면 계정 완전 삭제 후 로그아웃, 있으면 안내(법정 보존).
	withdraw: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login');

		const fd = await request.formData();
		if (fd.get('confirm') == null) {
			return fail(400, { message: '탈퇴에 동의하셔야 진행할 수 있습니다.' });
		}

		const result = await withdrawAccount(user.id);
		if (!result.ok) return fail(400, { message: result.message });

		await supabase.auth.signOut();
		redirect(303, '/?withdrawn=1');
	}
};
