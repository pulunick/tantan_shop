import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** 정보수정 — 이름/휴대폰만 수정. 이메일은 세션에서 읽어 읽기전용으로 표시. */
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?redirect=%2Fmypage%2Fprofile');

	const { data: profile } = await supabase
		.from('profiles')
		.select('name, phone')
		.eq('id', user.id)
		.maybeSingle();

	return {
		email: user.email ?? null,
		profile: { name: profile?.name ?? '', phone: profile?.phone ?? '' }
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?redirect=%2Fmypage%2Fprofile');

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const phone = String(fd.get('phone') ?? '').trim();

		const errors: Record<string, string> = {};
		if (!name) errors.name = '이름을 입력해 주세요.';
		if (!phone) errors.phone = '휴대폰 번호를 입력해 주세요.';
		if (Object.keys(errors).length > 0) return fail(400, { values: { name, phone }, errors });

		// role 은 절대 함께 보내지 않는다 (트리거가 차단하기도 하지만, 애초에 이 폼에서 다루지 않음).
		const { error } = await supabase.from('profiles').update({ name, phone }).eq('id', user.id);

		if (error) {
			return fail(500, {
				values: { name, phone },
				message: '정보 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
			});
		}

		return { success: true, values: { name, phone } };
	}
};
