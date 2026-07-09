/**
 * 회원 탈퇴 (서버 전용, secret 키).
 *
 * orders.user_id 는 ON DELETE RESTRICT (전자상거래법상 주문·결제 기록 보존).
 * 따라서 주문 이력 유무에 따라 처리가 갈린다.
 *  - 주문 없음: 계정 완전 삭제(profiles/cart_items 는 cascade).
 *  - 주문 있음: '익명화 탈퇴' — 계정을 지우지 않고
 *      1) 프로필 개인정보 비식별화(name→'탈퇴회원', phone→null) + withdrawn_at 기록
 *      2) auth 계정 이메일 스크램블 + 영구 밴(재로그인·비밀번호 재설정 차단)
 *      3) 주문 row(수령인 정보 포함)는 보존 의무로 그대로 둔다
 *  ※ 보존기간·비식별 범위는 최종적으로 운영 주체(클라이언트)의 법무 확인 대상.
 */
import { supabaseAdmin } from './supabase-admin';

export type WithdrawResult = { ok: true } | { ok: false; message: string };

// 밴 기간: Supabase 는 Go duration 문자열을 받는다. 실질적 영구(약 100년).
const PERMANENT_BAN = '876000h';

export async function withdrawAccount(userId: string): Promise<WithdrawResult> {
	const { count, error: cntErr } = await supabaseAdmin
		.from('orders')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId);

	if (cntErr) return { ok: false, message: '탈퇴 처리 중 오류가 발생했습니다.' };

	// 주문 이력 없음 → 계정 완전 삭제.
	if ((count ?? 0) === 0) {
		const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
		if (delErr) return { ok: false, message: '탈퇴 처리 중 오류가 발생했습니다.' };
		return { ok: true };
	}

	// 주문 이력 있음 → 익명화 탈퇴.
	const { error: profErr } = await supabaseAdmin
		.from('profiles')
		.update({ name: '탈퇴회원', phone: null, withdrawn_at: new Date().toISOString() })
		.eq('id', userId);
	if (profErr) return { ok: false, message: '탈퇴 처리 중 오류가 발생했습니다.' };

	const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
		email: `withdrawn+${userId}@deleted.invalid`,
		email_confirm: true, // 확인메일 발송 없이 즉시 반영
		ban_duration: PERMANENT_BAN,
		user_metadata: { name: '탈퇴회원', phone: null }
	});
	if (authErr) return { ok: false, message: '탈퇴 처리 중 오류가 발생했습니다.' };

	return { ok: true };
}
