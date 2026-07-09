// 가격/날짜 표시 포맷 유틸. 서버 재계산된 금액을 그대로 화면에 보여줄 때 사용.

/** 원화 표시: 89000 -> "89,000원" */
export function formatPrice(n: number): string {
	return `${n.toLocaleString('ko-KR')}원`;
}

/** 날짜 표시: "2026-07-08T00:00:00Z" -> "2026.07.08" */
export function formatDate(input: string | Date): string {
	const d = typeof input === 'string' ? new Date(input) : input;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}.${m}.${day}`;
}
