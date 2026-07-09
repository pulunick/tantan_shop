/**
 * 회원 탈퇴 (서버 전용, secret 키).
 *
 * 주의: orders.user_id 는 ON DELETE RESTRICT (법정 보존기간 동안 주문 기록 보존).
 * 따라서 주문 이력이 있는 계정은 auth 유저를 즉시 삭제할 수 없다.
 *  - 주문 없음: 계정 완전 삭제(profiles/cart_items 는 cascade).
 *  - 주문 있음: 온라인 즉시 탈퇴 불가 → 안내 (익명화/보존 정책은 별도 결정 필요).
 *
 * TODO(정책 결정 필요): 주문 이력 보유 회원의 탈퇴 방식
 *   (예: profiles.withdrawn_at 추가 + 개인정보 익명화 + 로그인 차단) — 마이그레이션 동반.
 */
import { supabaseAdmin } from './supabase-admin';

export type WithdrawResult = { ok: true } | { ok: false; message: string };

export async function withdrawAccount(userId: string): Promise<WithdrawResult> {
	const { count, error: cntErr } = await supabaseAdmin
		.from('orders')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId);

	if (cntErr) return { ok: false, message: '탈퇴 처리 중 오류가 발생했습니다.' };

	if ((count ?? 0) > 0) {
		return {
			ok: false,
			message:
				'주문 이력이 있는 계정은 법정 보존기간(전자상거래법)으로 인해 온라인 즉시 탈퇴가 제한됩니다. 대표번호(010-4055-3338)로 문의해 주세요.'
		};
	}

	const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
	if (delErr) return { ok: false, message: '탈퇴 처리 중 오류가 발생했습니다.' };
	return { ok: true };
}
