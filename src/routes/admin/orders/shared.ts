import type { OrderStatus } from '$lib/types';
import { COURIER_NAMES } from '$lib/utils/couriers';

/**
 * 주문 관리 화면 공용 상수. +page.server.ts 와 +page.svelte 양쪽에서 임포트하므로
 * (서버 전용 파일인 +page.server.ts 를 클라이언트 컴포넌트에서 직접 import 할 수 없음)
 * 이 일반 모듈에 분리해 둔다.
 */

export const STATUS_TABS: { value: OrderStatus | 'all'; label: string }[] = [
	{ value: 'all', label: '전체' },
	{ value: 'pending', label: '결제대기' },
	{ value: 'paid', label: '결제완료' },
	{ value: 'preparing', label: '배송준비' },
	{ value: 'shipping', label: '배송중' },
	{ value: 'delivered', label: '배송완료' },
	{ value: 'cancelled', label: '취소' },
	{ value: 'refunded', label: '환불' }
];

// 택배사 목록의 단일 소스는 $lib/utils/couriers.ts (송장조회 URL 매핑과 자동 동기화).
// '경동택배(화물)'는 조회 URL이 없어 COURIERS 에는 없지만 관리자 선택은 가능해야 하므로
// 여기에만 추가한다 — 사용자 화면은 trackingUrl() 이 null 이면 링크 없이 텍스트만 표시.
export const TRACKING_COMPANIES: string[] = [...COURIER_NAMES, '경동택배(화물)'];

/**
 * order_status 변경 시 함께 갱신할 payment_status 매핑.
 * 주문 상세([id]/+page.server.ts)와 목록(원클릭 입금확인, +page.server.ts) 양쪽에서
 * 동일 규칙을 쓰도록 공용 모듈에 둔다 (클라이언트 값 신뢰 안 함, 서버에서 매핑).
 */
export function paymentStatusFor(
	orderStatus: OrderStatus
): 'pending' | 'paid' | 'cancelled' | 'refunded' {
	if (orderStatus === 'pending') return 'pending';
	if (orderStatus === 'cancelled') return 'cancelled';
	if (orderStatus === 'refunded') return 'refunded';
	return 'paid'; // paid/preparing/shipping/delivered
}
