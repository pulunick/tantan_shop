import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/**
 * redirect 쿼리파라미터를 내부 경로로만 제한한다 (오픈 리다이렉트 방지).
 * '/'로 시작하되 '//'(프로토콜 상대 URL)는 거부.
 */
function safeRedirectTarget(raw: string | null): string {
	if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
	return '/';
}

export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
	const { session } = await safeGetSession();
	if (session) redirect(303, safeRedirectTarget(url.searchParams.get('redirect')));

	return {
		registered: url.searchParams.get('registered') === '1'
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, message: '이메일과 비밀번호를 입력해 주세요.' });
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { email, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
		}

		redirect(303, safeRedirectTarget(url.searchParams.get('redirect')));
	}
};
