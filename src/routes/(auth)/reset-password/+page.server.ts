import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();

		if (!email || !EMAIL_RE.test(email)) {
			return fail(400, { email, message: '올바른 이메일 주소를 입력해 주세요.' });
		}

		// 이메일 존재 여부와 무관하게 항상 같은 성공 응답을 준다 (계정 존재 여부 노출 방지).
		await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/login`
		});

		return { success: true, email };
	}
};
