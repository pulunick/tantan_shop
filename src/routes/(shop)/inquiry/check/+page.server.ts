import { fail } from '@sveltejs/kit';
import { verifyPasswordAsync } from '$lib/server/password';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import type { Actions } from './$types';

/**
 * 비회원 문의 조회.
 *
 * 비회원 문의는 RLS상 본인 조회가 불가하므로(select_own_or_admin) 서버에서
 * supabaseAdmin(secret 키)으로만 조회한다. 반드시:
 *   1) guest_name 일치 + 비회원(user_id is null) 문의만 후보로 조회
 *   2) 각 후보의 guest_password_hash 를 scrypt verify 로 검증
 *   3) 통과한 건만 표시용 최소 필드를 반환. 통과 못 하면 어떤 필드도 반환하지 않는다.
 *
 * 열거 방지: 이름 불일치 / 비밀번호 불일치를 구분하지 않고 동일 메시지로 실패시킨다.
 * 타이밍 완화: 이름 매칭 0건이어도 더미 해시를 1회 검증해 응답 시간을 평탄화한다.
 */

// 표시에 필요한 최소 필드만 노출한다. guest_password_hash·guest_phone 등 민감 필드는 절대 반환 금지.
export type InquiryResult = {
	id: string;
	type: 'general' | 'quote' | 'reservation';
	title: string;
	content: string;
	status: 'waiting' | 'answered';
	answer: string | null;
	answered_at: string | null;
	created_at: string;
};

const NOT_FOUND_MESSAGE = '입력하신 정보와 일치하는 문의를 찾을 수 없습니다.';

// 타이밍 공격 완화용 더미 해시 (실제 어떤 비밀번호와도 일치하지 않는 유효 포맷).
// 이름 매칭이 0건일 때도 scrypt 검증 1회를 수행해 응답 시간을 평탄화한다.
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(128);

/**
 * 간단한 인메모리 레이트리밋 (IP당 분당 시도 제한).
 * ⚠️ 서버리스(Vercel) 환경에서는 인스턴스마다 메모리가 분리되고 콜드스타트 시 초기화되므로
 *    엄밀한 전역 제한이 아니다. 무차별 대입을 "완화"하는 1차 방어일 뿐이며,
 *    강한 보장이 필요하면 Supabase/Upstash 등 외부 스토어 기반으로 대체해야 한다.
 */
const RATE_LIMIT_MAX = 8; // 분당 최대 시도
const RATE_LIMIT_WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const entry = attempts.get(ip);
	if (!entry || now >= entry.resetAt) {
		attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return true;
	}
	if (entry.count >= RATE_LIMIT_MAX) return false;
	entry.count += 1;
	return true;
}

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const ip = getClientAddress();
		if (!checkRateLimit(ip)) {
			return fail(429, {
				name: '',
				message: '잠시 후 다시 시도해 주세요. 짧은 시간에 조회 요청이 많았습니다.'
			});
		}

		const fd = await request.formData();
		const name = (fd.get('name')?.toString() ?? '').trim();
		const password = fd.get('password')?.toString() ?? '';

		if (!name || !password) {
			return fail(400, { name, message: '이름과 비밀번호를 모두 입력해 주세요.' });
		}

		// 1) 비회원(user_id null) + 이름 일치 후보만 조회. 검증에 필요한 guest_password_hash 는
		//    서버 내부에서만 쓰고 절대 반환하지 않는다.
		const { data: candidates, error } = await supabaseAdmin
			.from('inquiries')
			.select(
				'id, type, title, content, status, answer, answered_at, created_at, guest_password_hash'
			)
			.is('user_id', null)
			.eq('guest_name', name)
			.order('created_at', { ascending: false });

		if (error) {
			return fail(500, {
				name,
				message: '조회 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 대표번호로 연락 주세요.'
			});
		}

		// 2) 각 후보의 비밀번호 검증. 통과한 건만 최소 필드로 추린다.
		const results: InquiryResult[] = [];
		if (!candidates || candidates.length === 0) {
			// 타이밍 완화: 후보가 없어도 scrypt 검증 1회 수행
			await verifyPasswordAsync(password, DUMMY_HASH);
		} else {
			for (const c of candidates) {
				if (await verifyPasswordAsync(password, c.guest_password_hash)) {
					results.push({
						id: c.id,
						type: c.type,
						title: c.title,
						content: c.content,
						status: c.status,
						answer: c.answer,
						answered_at: c.answered_at,
						created_at: c.created_at
					});
				}
			}
		}

		// 3) 통과 0건이면 이름/비밀번호 불일치를 구분하지 않고 동일 메시지로 실패.
		if (results.length === 0) {
			return fail(400, { name, message: NOT_FOUND_MESSAGE });
		}

		return { results };
	}
};
