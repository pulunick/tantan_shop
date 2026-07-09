import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * 마이페이지 공통 레이아웃 데이터 — 사이드 내비 상단에 표시할 이름/이메일.
 * /mypage/* 는 hooks.server.ts authGuard 가 이미 로그인 여부를 검사하지만,
 * user.id 를 안전하게 다루기 위해 여기서도 방어적으로 재확인한다.
 */
export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?redirect=%2Fmypage');

	const { data: profile } = await supabase
		.from('profiles')
		.select('name')
		.eq('id', user.id)
		.maybeSingle();

	return {
		profileName: profile?.name ?? null,
		email: user.email ?? null
	};
};
