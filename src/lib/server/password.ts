/**
 * 비회원 비밀글용 비밀번호 해시 (서버 전용). Node scrypt 사용, 외부 의존성 없음.
 * 저장 형식: `scrypt$<salt-hex>$<hash-hex>`.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
	if (!stored) return false;
	const [scheme, salt, hash] = stored.split('$');
	if (scheme !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'hex');
	const actual = scryptSync(password, salt, 64);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}
