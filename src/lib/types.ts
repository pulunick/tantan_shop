// 상품/주문 UI 전반에서 공유하는 도메인 타입.
// 컬럼명은 supabase/migrations/20260707062450_initial_schema.sql 기준.

export type { Category } from '$lib/components/layout/types';

export type ProductStatus = 'on_sale' | 'sold_out' | 'hidden';

export type OrderStatus =
	'pending' | 'paid' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';

export type Product = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: ProductStatus;
	created_at?: string;
	thumbnailUrl?: string | null;
};
