/**
 * 비회원 비밀글용 비밀번호 해시 (서버 전용). Node scrypt 사용, 외부 의존성 없음.
 * 저장 형식: `scrypt$<salt-hex>$<hash-hex>`.
 */
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
	password: string,
	salt: string,
	keylen: number
) => Promise<Buffer>;

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

/**
 * 비동기 버전 — 여러 건을 루프로 검증하는 경로(비회원 문의 조회)에서 사용.
 * scryptSync 는 CPU-bound 동기 호출이라 이벤트 루프를 블로킹하므로, 루프 검증은 이쪽을 쓴다.
 */
export async function verifyPasswordAsync(
	password: string,
	stored: string | null
): Promise<boolean> {
	if (!stored) return false;
	const [scheme, salt, hash] = stored.split('$');
	if (scheme !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'hex');
	const actual = await scryptAsync(password, salt, 64);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}
