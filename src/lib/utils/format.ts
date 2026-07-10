// 가격/날짜 표시 포맷 유틸. 서버 재계산된 금액을 그대로 화면에 보여줄 때 사용.

/** 원화 표시: 89000 -> "89,000원" */
export function formatPrice(n: number): string {
	return `${n.toLocaleString('ko-KR')}원`;
}

/** 휴대폰 입력 자동 하이픈: "01040553338" -> "010-4055-3338" (입력 중 부분 문자열도 처리) */
export function formatPhoneInput(value: string): string {
	const digits = value.replace(/\D/g, '').slice(0, 11);
	if (digits.length < 4) return digits;
	if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
	// 10자리(구형 011 등)는 3-3-4, 11자리는 3-4-4
	if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
	return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 숫자 입력 콤마 표시: "89000" -> "89,000" (관리자 가격 입력용. 파싱은 parseNumberInput) */
export function formatNumberInput(value: string): string {
	const digits = value.replace(/\D/g, '');
	if (!digits) return '';
	return Number(digits).toLocaleString('ko-KR');
}

/** 콤마 입력값 -> number: "89,000" -> 89000. 빈 값은 null */
export function parseNumberInput(value: string): number | null {
	const digits = value.replace(/\D/g, '');
	return digits ? Number(digits) : null;
}

/** 날짜 표시: "2026-07-08T00:00:00Z" -> "2026.07.08" */
export function formatDate(input: string | Date): string {
	const d = typeof input === 'string' ? new Date(input) : input;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}.${m}.${day}`;
}
