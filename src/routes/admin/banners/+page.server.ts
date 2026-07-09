import type { PageServerLoad } from './$types';

/**
 * 배너 목록만 서버에서 읽어온다. 등록/삭제/토글/순서변경은 관리자 세션의
 * 브라우저 Supabase 클라이언트(RLS banners_admin_write 정책)로 +page.svelte 에서 직접 수행하고,
 * 완료 후 invalidateAll() 로 이 load 를 다시 실행해 최신 목록을 반영한다.
 */
export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('banners')
		.select('id, image_url, link_url, sort_order, is_visible, start_at, end_at')
		.order('sort_order', { ascending: true });

	return { banners: data ?? [] };
};
