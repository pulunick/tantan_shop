import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/**
 * 일반 회원 로그아웃 전용 라우트.
 * - GET 직접 접근은 홈으로 돌려보낸다(렌더링할 페이지 없음).
 * - POST(default action)가 세션을 종료하고 홈으로 리다이렉트한다.
 * 관리자 로그아웃(`/admin?/logout`)과 동일한 서버 signOut 패턴을 사용한다.
 */
export const load: PageServerLoad = () => {
	redirect(307, '/');
};

export const actions: Actions = {
	default: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/');
	}
};
