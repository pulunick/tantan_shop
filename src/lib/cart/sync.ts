/**
 * 로그인 시 비회원 localStorage 장바구니를 서버(cart_items)로 병합하고 로컬을 비운다.
 * addToCart(회원 경로)가 같은 라인 수량 합산 로직을 이미 갖고 있어 그대로 재사용한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { addToCart } from './add';
import { readLocalCart, clearLocalCart } from './local';

export async function syncLocalCartToServer(
	supabase: SupabaseClient,
	userId: string
): Promise<number> {
	const local = readLocalCart();
	if (local.length === 0) return 0;

	for (const item of local) {
		await addToCart(supabase, userId, item);
	}
	clearLocalCart();
	return local.length;
}
