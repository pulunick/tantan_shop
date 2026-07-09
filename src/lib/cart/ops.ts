/**
 * 장바구니 순수 연산 (localStorage / 서버와 무관한 로직).
 * 라인 식별 = (productId, optionId). 같은 라인은 수량을 합산한다.
 */
export type CartItem = {
	productId: string;
	optionId: string | null;
	quantity: number;
};

export function sameLine(a: CartItem, b: CartItem): boolean {
	return a.productId === b.productId && (a.optionId ?? null) === (b.optionId ?? null);
}

/** 같은 라인이면 수량 합산, 없으면 추가. 수량은 최소 1로 보정. */
export function addItem(items: CartItem[], item: CartItem): CartItem[] {
	const qty = Math.max(1, Math.floor(item.quantity));
	const idx = items.findIndex((it) => sameLine(it, item));
	if (idx === -1) return [...items, { ...item, optionId: item.optionId ?? null, quantity: qty }];
	const next = items.slice();
	next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
	return next;
}

/** 수량 설정(최소 1). 0 이하는 제거하지 않고 1로 클램프 — 제거는 removeItem 사용. */
export function setQuantity(
	items: CartItem[],
	productId: string,
	optionId: string | null,
	quantity: number
): CartItem[] {
	const qty = Math.max(1, Math.floor(quantity));
	return items.map((it) =>
		sameLine(it, { productId, optionId, quantity: qty }) ? { ...it, quantity: qty } : it
	);
}

export function removeItem(
	items: CartItem[],
	productId: string,
	optionId: string | null
): CartItem[] {
	return items.filter((it) => !sameLine(it, { productId, optionId, quantity: 1 }));
}

/**
 * 비회원 localStorage 장바구니(local) 를 서버 장바구니(server) 로 병합.
 * 같은 라인은 수량 합산, 서로 없는 라인은 그대로 유지한다.
 */
export function mergeCarts(local: CartItem[], server: CartItem[]): CartItem[] {
	let merged: CartItem[] = server.map((it) => ({ ...it, optionId: it.optionId ?? null }));
	for (const item of local) merged = addItem(merged, item);
	return merged;
}

export function totalCount(items: CartItem[]): number {
	return items.reduce((sum, it) => sum + it.quantity, 0);
}
