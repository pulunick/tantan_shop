import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect, error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Supabase 서버 클라이언트를 요청마다 생성해 event.locals 에 심는다.
 * - publishable 키 사용(클라이언트 OK). secret 키는 여기서 쓰지 않는다.
 * - 세션은 쿠키에 저장/복원된다.
 */
const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		publicEnv.PUBLIC_SUPABASE_URL,
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	/**
	 * 세션을 안전하게 조회한다. getSession() 은 쿠키만 읽으므로 위조 가능 →
	 * 세션이 있을 때만 getUser() 로 Auth 서버에 재검증한다.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error: userError
		} = await event.locals.supabase.auth.getUser();
		if (userError) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

/**
 * 인증/인가 가드.
 * - /mypage/* : 로그인 필요
 * - /admin/*  : 로그인 + profiles.role='admin' 서버 검증 (프론트 가드만으로 처리 금지 규칙)
 */
const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const { pathname } = event.url;

	if (pathname.startsWith('/mypage')) {
		if (!session) redirect(303, `/login?redirect=${encodeURIComponent(pathname)}`);
	}

	if (pathname.startsWith('/admin')) {
		if (!session || !user) redirect(303, `/login?redirect=${encodeURIComponent(pathname)}`);
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();
		if (profile?.role !== 'admin') error(403, '관리자 전용 페이지입니다.');
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
