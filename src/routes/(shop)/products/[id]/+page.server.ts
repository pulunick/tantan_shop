import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Product } from '$lib/types';

export type ProductDetailImage = {
	url: string;
	is_thumbnail: boolean;
	sort_order: number;
};

export type ProductDetailOption = {
	id: string;
	name: string;
	extra_price: number;
	sort_order: number;
	is_sold_out: boolean;
};

export type ProductDetail = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: Product['status'];
	description_html: string | null;
	category: { id: string; name: string } | null;
};

type CategoryEmbed = { id: string; name: string } | { id: string; name: string }[] | null;

type ProductDetailRow = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: Product['status'];
	description_html: string | null;
	categories: CategoryEmbed;
	product_images: ProductDetailImage[] | null;
	product_options: ProductDetailOption[] | null;
};

/** categories 임베드가 단건 객체/배열 어느 형태로 오든 단건으로 정규화. */
function pickCategory(embed: CategoryEmbed): { id: string; name: string } | null {
	if (!embed) return null;
	return Array.isArray(embed) ? (embed[0] ?? null) : embed;
}

/**
 * 상품 상세 조회. 존재하지 않거나 status='hidden' 이면 404.
 * (products_public_read RLS 로 hidden 은 비회원/일반회원에게 애초에 select 되지 않지만,
 * 이 라우트는 쇼핑몰 화면이므로 admin 세션이어도 hidden 상품은 404 처리한다.)
 */
export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data, error: dbError } = await supabase
		.from('products')
		.select(
			'id,name,price,is_price_hidden,status,description_html,' +
				'categories(id,name),' +
				'product_images(url,is_thumbnail,sort_order),' +
				'product_options(id,name,extra_price,sort_order,is_sold_out)'
		)
		.eq('id', params.id)
		.maybeSingle();

	if (dbError || !data) error(404, '상품을 찾을 수 없습니다.');

	const row = data as unknown as ProductDetailRow;

	if (row.status === 'hidden') error(404, '상품을 찾을 수 없습니다.');

	const images: ProductDetailImage[] = [...(row.product_images ?? [])].sort((a, b) => {
		if (a.is_thumbnail !== b.is_thumbnail) return a.is_thumbnail ? -1 : 1;
		return a.sort_order - b.sort_order;
	});

	const options: ProductDetailOption[] = [...(row.product_options ?? [])].sort(
		(a, b) => a.sort_order - b.sort_order
	);

	const product: ProductDetail = {
		id: row.id,
		name: row.name,
		price: row.price,
		is_price_hidden: row.is_price_hidden,
		status: row.status,
		description_html: row.description_html,
		category: pickCategory(row.categories)
	};

	return { product, images, options };
};
