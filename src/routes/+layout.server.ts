import type { LayoutServerLoad } from './$types';

/**
 * 세션/유저와 쿠키를 클라이언트 로드로 전달한다.
 * (+layout.ts 의 서버 클라이언트가 data.cookies 로 세션을 복원)
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
	const { session, user } = await safeGetSession();
	return {
		session,
		user,
		cookies: cookies.getAll()
	};
};
