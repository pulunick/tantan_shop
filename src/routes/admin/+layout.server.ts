import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * 관리자 영역 서버 가드 (hooks.server.ts 의 authGuard 와 이중 방어).
 * profiles.role='admin' 을 서버에서 재검증한다. 프론트 가드만으로 처리 금지 규칙.
 */
export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('role, name')
		.eq('id', user.id)
		.single();

	if (profile?.role !== 'admin') {
		error(403, '관리자 전용 페이지입니다.');
	}

	return { role: profile.role, name: profile.name as string | null };
};
