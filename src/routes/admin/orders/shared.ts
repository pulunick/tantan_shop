import type { OrderStatus } from '$lib/types';

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

export const TRACKING_COMPANIES = [
	'CJ대한통운',
	'롯데택배',
	'한진택배',
	'로젠택배',
	'경동택배(화물)'
];
