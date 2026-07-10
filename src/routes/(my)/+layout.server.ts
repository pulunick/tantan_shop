import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Category, CompanyInfo } from '$lib/components/layout/types';

/**
 * 마이페이지 공통 레이아웃 데이터.
 * - profileName/email: 좌측 메뉴 상단 아바타 영역
 * - categories/company: (shop)과 동일한 공통 셸(Header/Gnb/Footer/MobileDrawer)이 사용
 * - ordersCount/inquiriesCount: 좌측 메뉴·모바일 탭의 개수 배지 (head:true count 쿼리)
 * /mypage/* 는 hooks.server.ts authGuard 가 이미 로그인 여부를 검사하지만,
 * user.id 를 안전하게 다루기 위해 여기서도 방어적으로 재확인한다.
 */
export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/login?redirect=%2Fmypage');

	const [
		{ data: profile },
		{ data: categories },
		{ data: companySetting },
		{ count: ordersCount },
		{ count: inquiriesCount }
	] = await Promise.all([
		supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
		supabase
			.from('categories')
			.select('id,name,sort_order')
			.eq('is_visible', true)
			.order('sort_order'),
		supabase.from('site_settings').select('value').eq('key', 'company').maybeSingle(),
		supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
		supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
	]);

	return {
		profileName: profile?.name ?? null,
		email: user.email ?? null,
		categories: (categories ?? []) as Category[],
		company: (companySetting?.value as CompanyInfo | null | undefined) ?? null,
		ordersCount: ordersCount ?? 0,
		inquiriesCount: inquiriesCount ?? 0
	};
};
