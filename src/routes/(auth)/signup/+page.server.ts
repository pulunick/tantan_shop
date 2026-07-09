import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

export type SignupFieldErrors = Partial<
	Record<'email' | 'password' | 'passwordConfirm' | 'name' | 'phone' | 'terms', string>
>;

/** fail() 응답 형태를 모든 분기에서 동일하게 유지 (message 는 항상 optional 로 취급). */
type SignupFailPayload = {
	email: string;
	name: string;
	phone: string;
	errors: SignupFieldErrors;
	message?: string;
};

// 리터럴 타입이 satisfies/직접 대입 시 좁아지는 것을 막기 위해 함수 반환 타입으로 강제 고정한다.
function signupFailPayload(payload: SignupFailPayload): SignupFailPayload {
	return payload;
}

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		const passwordConfirm = String(formData.get('passwordConfirm') ?? '');
		const name = String(formData.get('name') ?? '').trim();
		const phone = String(formData.get('phone') ?? '').trim();
		const terms = formData.get('terms') === 'on';

		const errors: SignupFieldErrors = {};

		if (!email) errors.email = '이메일을 입력해 주세요.';
		else if (!EMAIL_RE.test(email)) errors.email = '올바른 이메일 형식이 아닙니다.';

		if (!password) errors.password = '비밀번호를 입력해 주세요.';
		else if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.';

		if (!passwordConfirm) errors.passwordConfirm = '비밀번호 확인을 입력해 주세요.';
		else if (password !== passwordConfirm) errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';

		if (!name) errors.name = '이름을 입력해 주세요.';

		if (!phone) errors.phone = '휴대폰 번호를 입력해 주세요.';
		else if (!PHONE_RE.test(phone))
			errors.phone = '올바른 휴대폰 번호 형식이 아닙니다. (예: 010-0000-0000)';

		if (!terms) errors.terms = '이용약관 및 개인정보처리방침에 동의해 주세요.';

		if (Object.keys(errors).length > 0) {
			return fail(400, signupFailPayload({ email, name, phone, errors }));
		}

		// profiles 는 handle_new_user 트리거(SECURITY DEFINER)가 raw_user_meta_data.name/phone 으로 자동 생성한다.
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { name, phone } }
		});

		const duplicateEmailErrors: SignupFieldErrors = { email: '이미 가입된 이메일입니다.' };
		const noFieldErrors: SignupFieldErrors = {};

		if (error) {
			if (/registered|exists|already/i.test(error.message)) {
				return fail(400, signupFailPayload({ email, name, phone, errors: duplicateEmailErrors }));
			}
			return fail(
				400,
				signupFailPayload({
					email,
					name,
					phone,
					errors: noFieldErrors,
					message: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
				})
			);
		}

		// 이메일 인증이 활성화된 상태에서 이미 가입된(확인 완료) 이메일로 재가입 시도하면
		// supabase 가 에러 없이 성공처럼 응답하되 identities 가 빈 배열로 온다 — 이 경우도 중복 처리.
		if (data.user && data.user.identities && data.user.identities.length === 0) {
			return fail(400, signupFailPayload({ email, name, phone, errors: duplicateEmailErrors }));
		}

		redirect(303, '/login?registered=1');
	}
};
