import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import type { LayoutLoad } from './$types';

/**
 * 브라우저/서버 양쪽에서 쓰는 isomorphic Supabase 클라이언트.
 * 서버에서는 요청 쿠키를 읽고, 브라우저에서는 document.cookie 를 사용한다.
 */
export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(
				publicEnv.PUBLIC_SUPABASE_URL,
				publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
				{ global: { fetch } }
			)
		: createServerClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				global: { fetch },
				cookies: { getAll: () => data.cookies }
			});

	return { supabase, session: data.session, user: data.user };
};
