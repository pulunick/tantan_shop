import { fail } from '@sveltejs/kit';
import { hashPassword } from '$lib/server/password';
import type { Actions, PageServerLoad } from './$types';

export type InquiryType = 'general' | 'quote' | 'reservation';

function parseType(value: string | null): InquiryType {
	return value === 'quote' || value === 'reservation' ? value : 'general';
}

/**
 * 문의하기. CTA(시공·견적 문의)에서 진입 시 ?type=quote 로 프리셀렉트된다.
 * 로그인 여부는 게스트 입력 필드(이름/연락처/비밀번호) 노출 여부를 결정한다.
 */
export const load: PageServerLoad = async ({ url, locals: { session } }) => {
	// 상품 상세 '문의 남기기'에서 ?product=<상품명> 으로 진입 시 제목 프리필 (길이 제한으로 방어)
	const presetProduct = (url.searchParams.get('product') ?? '').trim().slice(0, 100);
	return {
		presetType: parseType(url.searchParams.get('type')),
		presetTitle: presetProduct ? `[${presetProduct}] 상품 문의` : '',
		isLoggedIn: session != null
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		const fd = await request.formData();
		const get = (k: string) => (fd.get(k)?.toString() ?? '').trim();

		const type = parseType(get('type'));
		const values = {
			type,
			title: get('title'),
			content: get('content'),
			is_secret: fd.get('is_secret') != null,
			hope_date: get('hope_date'),
			site_address: get('site_address'),
			guest_name: get('guest_name'),
			guest_phone: get('guest_phone')
		};

		const errors: Record<string, string> = {};
		if (!values.title) errors.title = '제목을 입력해 주세요.';
		if (!values.content) errors.content = '문의 내용을 입력해 주세요.';
		if (type === 'reservation' && !values.hope_date) errors.hope_date = '희망일을 선택해 주세요.';
		if (!user) {
			if (!values.guest_name) errors.guest_name = '이름을 입력해 주세요.';
			if (!values.guest_phone) errors.guest_phone = '연락처를 입력해 주세요.';
			const pw = get('guest_password');
			if (!pw || pw.length < 4) errors.guest_password = '비밀번호(4자 이상)를 입력해 주세요.';
		}
		if (Object.keys(errors).length > 0) return fail(400, { values, errors });

		const row: Record<string, unknown> = {
			user_id: user?.id ?? null,
			type,
			title: values.title,
			content: values.content,
			is_secret: values.is_secret,
			hope_date: type === 'reservation' ? values.hope_date || null : null,
			site_address: type === 'reservation' ? values.site_address || null : null
		};
		if (!user) {
			row.guest_name = values.guest_name;
			row.guest_phone = values.guest_phone;
			row.guest_password_hash = hashPassword(get('guest_password'));
		}

		const { error } = await supabase.from('inquiries').insert(row);
		if (error) {
			return fail(500, {
				values,
				message: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 대표번호로 연락 주세요.'
			});
		}

		return { success: true };
	}
};
