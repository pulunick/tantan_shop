import type { PageServerLoad } from './$types';
import type { Category, Product, ProductStatus } from '$lib/types';

/**
 * 상품 리스트 (/products).
 * - status<>'hidden' public read (RLS). category/q 필터, 정렬(latest/price_asc/price_desc), 페이지네이션.
 * - 가격 정렬은 전화문의 상품(price null)이 항상 뒤로 가도록 nulls last 로 정렬한다.
 */

const PAGE_SIZE = 12;

type SortOption = 'latest' | 'price_asc' | 'price_desc';

type ProductImageRow = {
	url: string;
	is_thumbnail: boolean;
};

type ProductRow = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: ProductStatus;
	created_at: string;
	product_images: ProductImageRow[] | null;
};

function parseSort(value: string | null): SortOption {
	return value === 'price_asc' || value === 'price_desc' ? value : 'latest';
}

function parsePage(value: string | null): number {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : 1;
}

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const category = url.searchParams.get('category') ?? '';
	const q = url.searchParams.get('q') ?? '';
	const sort = parseSort(url.searchParams.get('sort'));
	const page = parsePage(url.searchParams.get('page'));

	const { data: categories } = await supabase
		.from('categories')
		.select('id,name,sort_order')
		.eq('is_visible', true)
		.order('sort_order');

	let query = supabase
		.from('products')
		.select('id,name,price,is_price_hidden,status,created_at,product_images(url,is_thumbnail)', {
			count: 'exact'
		})
		.neq('status', 'hidden');

	if (category) query = query.eq('category_id', category);
	if (q) query = query.ilike('name', `%${q}%`);

	if (sort === 'price_asc') {
		query = query.order('price', { ascending: true, nullsFirst: false });
	} else if (sort === 'price_desc') {
		query = query.order('price', { ascending: false, nullsFirst: false });
	} else {
		query = query.order('created_at', { ascending: false });
	}

	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const { data, count } = await query.range(from, to);

	const rows = (data ?? []) as unknown as ProductRow[];
	const products: Product[] = rows.map((row) => {
		const images = row.product_images ?? [];
		const thumbnail = images.find((img) => img.is_thumbnail) ?? images[0];
		return {
			id: row.id,
			name: row.name,
			price: row.price,
			is_price_hidden: row.is_price_hidden,
			status: row.status,
			created_at: row.created_at,
			thumbnailUrl: thumbnail?.url ?? null
		};
	});

	return {
		categories: (categories ?? []) as Category[],
		products,
		total: count ?? 0,
		page,
		pageSize: PAGE_SIZE,
		category,
		q,
		sort
	};
};
