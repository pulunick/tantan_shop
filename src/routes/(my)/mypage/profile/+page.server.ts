import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type PwFieldErrors = Partial<Record<'current' | 'next' | 'confirm', string>>;

/** 정보수정 — 이름/휴대폰 수정 + 비밀번호 변경. 이메일은 세션에서 읽어 읽기전용으로 표시. */
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
	// 기본 정보(이름/휴대폰) 저장. action 식별자 'profile' 로 비밀번호 폼과 결과 배너를 구분한다.
	profile: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?redirect=%2Fmypage%2Fprofile');

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const phone = String(fd.get('phone') ?? '').trim();

		const errors: Record<string, string> = {};
		if (!name) errors.name = '이름을 입력해 주세요.';
		if (!phone) errors.phone = '휴대폰 번호를 입력해 주세요.';
		if (Object.keys(errors).length > 0)
			return fail(400, { action: 'profile', values: { name, phone }, errors });

		// role 은 절대 함께 보내지 않는다 (트리거가 차단하기도 하지만, 애초에 이 폼에서 다루지 않음).
		const { error } = await supabase.from('profiles').update({ name, phone }).eq('id', user.id);

		if (error) {
			return fail(500, {
				action: 'profile',
				values: { name, phone },
				message: '정보 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
			});
		}

		return { action: 'profile', success: true, values: { name, phone } };
	},

	// 비밀번호 변경. 현재 비밀번호 재검증 후 세션 클라이언트로 updateUser (secret 키/Admin 사용 안 함).
	// 실패/성공 응답에는 어떤 비밀번호 값도 담지 않는다.
	password: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) redirect(303, '/login?redirect=%2Fmypage%2Fprofile');

		const fd = await request.formData();
		const current = String(fd.get('current') ?? '');
		const next = String(fd.get('next') ?? '');
		const confirm = String(fd.get('confirm') ?? '');

		const pwErrors: PwFieldErrors = {};
		// signup 정책과 동일: 필수 + 8자 이상 + 확인 일치.
		if (!current) pwErrors.current = '현재 비밀번호를 입력해 주세요.';
		if (!next) pwErrors.next = '새 비밀번호를 입력해 주세요.';
		else if (next.length < 8) pwErrors.next = '비밀번호는 8자 이상이어야 합니다.';
		if (!confirm) pwErrors.confirm = '새 비밀번호 확인을 입력해 주세요.';
		else if (next && next !== confirm) pwErrors.confirm = '비밀번호가 일치하지 않습니다.';
		// 현재와 동일한 새 비밀번호 금지.
		if (current && next && next.length >= 8 && current === next)
			pwErrors.next = '새 비밀번호는 현재 비밀번호와 다르게 설정해 주세요.';

		if (Object.keys(pwErrors).length > 0) return fail(400, { action: 'password', pwErrors });

		// 본인 세션이므로 계정 열거 위험 없음: 현재 비밀번호를 재검증한다.
		const email = user.email;
		if (!email) {
			return fail(400, {
				action: 'password',
				pwMessage: '비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
			});
		}
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password: current
		});
		if (signInError) {
			const currentErr: PwFieldErrors = { current: '현재 비밀번호가 올바르지 않습니다.' };
			return fail(400, { action: 'password', pwErrors: currentErr });
		}

		const { error: updateError } = await supabase.auth.updateUser({ password: next });
		if (updateError) {
			return fail(400, {
				action: 'password',
				pwMessage: '비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
			});
		}

		return { action: 'password', pwSuccess: true };
	}
};
