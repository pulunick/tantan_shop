/**
 * 장바구니 담기 진입점. 비회원은 localStorage, 회원은 서버(cart_items)에 저장한다.
 * 회원 저장은 브라우저 Supabase 클라이언트(RLS: 본인 row) 로 수행한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { addToLocalCart } from './local';
import type { CartItem } from './ops';

/**
 * @param supabase 브라우저 Supabase 클라이언트 ($layout data.supabase)
 * @param userId 로그인 사용자 id (없으면 비회원 → localStorage)
 */
export async function addToCart(
	supabase: SupabaseClient,
	userId: string | null,
	item: CartItem
): Promise<void> {
	if (!userId) {
		addToLocalCart(item);
		return;
	}

	// 회원: 같은 (user,product,option) 라인이 있으면 수량 합산, 없으면 삽입
	let existing = supabase
		.from('cart_items')
		.select('id, quantity')
		.eq('user_id', userId)
		.eq('product_id', item.productId);
	// option_id 는 null 비교를 위해 .is() 사용
	existing = item.optionId
		? existing.eq('option_id', item.optionId)
		: existing.is('option_id', null);

	const { data: row } = await existing.maybeSingle();

	if (row) {
		await supabase
			.from('cart_items')
			.update({ quantity: row.quantity + item.quantity })
			.eq('id', row.id);
	} else {
		await supabase.from('cart_items').insert({
			user_id: userId,
			product_id: item.productId,
			option_id: item.optionId,
			quantity: item.quantity
		});
	}
}
