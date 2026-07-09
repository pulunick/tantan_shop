import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Category, ProductStatus } from '$lib/types';

type ImageRow = {
	id: string;
	url: string;
	original_name: string | null;
	sort_order: number;
	is_thumbnail: boolean;
};

type OptionRow = {
	id: string;
	name: string;
	extra_price: number;
	sort_order: number;
	is_sold_out: boolean;
};

type ProductRow = {
	id: string;
	category_id: string | null;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: ProductStatus;
	description_html: string | null;
	product_images: ImageRow[] | null;
	product_options: OptionRow[] | null;
};

/** 상품 수정 폼 — 상품 + 옵션 + 이미지를 함께 로드한다. 없으면 404. */
export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const [{ data: categories }, { data: productData, error: prodErr }] = await Promise.all([
		supabase.from('categories').select('id,name,sort_order').order('sort_order'),
		supabase
			.from('products')
			.select(
				'id,category_id,name,price,is_price_hidden,status,description_html,' +
					'product_images(id,url,original_name,sort_order,is_thumbnail),' +
					'product_options(id,name,extra_price,sort_order,is_sold_out)'
			)
			.eq('id', params.id)
			.maybeSingle()
	]);

	if (prodErr || !productData) error(404, '상품을 찾을 수 없습니다.');

	const row = productData as unknown as ProductRow;

	const images = [...(row.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
	const options = [...(row.product_options ?? [])].sort((a, b) => a.sort_order - b.sort_order);

	return {
		categories: (categories ?? []) as Category[],
		product: {
			id: row.id,
			category_id: row.category_id,
			name: row.name,
			price: row.price,
			is_price_hidden: row.is_price_hidden,
			status: row.status,
			description_html: row.description_html
		},
		images,
		options
	};
};
