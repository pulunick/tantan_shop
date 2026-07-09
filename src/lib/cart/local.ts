/**
 * 비회원 장바구니 = localStorage. ops.ts 의 순수 연산을 감싼 얇은 래퍼.
 * SSR 안전(typeof localStorage 가드).
 */
import { addItem, removeItem, setQuantity, totalCount, type CartItem } from './ops';

const KEY = 'tantan_cart';

export function readLocalCart(): CartItem[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
	} catch {
		return [];
	}
}

export function writeLocalCart(items: CartItem[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToLocalCart(item: CartItem): CartItem[] {
	const next = addItem(readLocalCart(), item);
	writeLocalCart(next);
	return next;
}

export function setLocalQuantity(
	productId: string,
	optionId: string | null,
	quantity: number
): CartItem[] {
	const next = setQuantity(readLocalCart(), productId, optionId, quantity);
	writeLocalCart(next);
	return next;
}

export function removeFromLocalCart(productId: string, optionId: string | null): CartItem[] {
	const next = removeItem(readLocalCart(), productId, optionId);
	writeLocalCart(next);
	return next;
}

export function clearLocalCart(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(KEY);
}

export function localCartCount(): number {
	return totalCount(readLocalCart());
}
