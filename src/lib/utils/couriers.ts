// 택배사 송장 조회 URL 매핑. 주문 상세(사용자/관리자)에서 '배송 조회' 새 탭 링크에 사용.
// 관리자 송장 입력 시 택배사명은 이 목록의 key 로 저장한다.

export const COURIERS = {
	CJ대한통운: (no: string) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${no}`,
	롯데택배: (no: string) =>
		`https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${no}`,
	한진택배: (no: string) =>
		`https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
	우체국택배: (no: string) =>
		`https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${no}`,
	로젠택배: (no: string) => `https://www.ilogen.com/web/personal/trace/${no}`
} as const;

export type CourierName = keyof typeof COURIERS;

export const COURIER_NAMES = Object.keys(COURIERS) as CourierName[];

/** 택배사명+송장번호 -> 조회 URL. 미등록 택배사면 null (링크 대신 텍스트만 표시) */
export function trackingUrl(courier: string, trackingNo: string): string | null {
	const build = (COURIERS as Record<string, (no: string) => string>)[courier];
	if (!build || !trackingNo) return null;
	return build(trackingNo.replace(/\D/g, ''));
}
