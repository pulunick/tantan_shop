import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Category, ProductStatus } from '$lib/types';

/**
 * 관리자 상품 목록.
 * - status enum(on_sale/sold_out/hidden) 만 존재 — 재고 수량 개념 없음(절대 규칙).
 * - '노출' 은 별도 컬럼이 없어 status='hidden' 여부로 판단한다.
 *   판매중↔품절 토글은 hidden 이 아닐 때만 의미가 있고, 노출 토글은 hidden ↔ 이전 판매상태(on_sale 로 복귀) 를 오간다.
 */

export type AdminProductRow = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: ProductStatus;
	created_at: string;
	categoryName: string | null;
	thumbnailUrl: string | null;
};

type CategoryEmbed = { name: string } | { name: string }[] | null;

type ProductImageRow = { url: string; is_thumbnail: boolean };

type ProductListRow = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: ProductStatus;
	created_at: string;
	categories: CategoryEmbed;
	product_images: ProductImageRow[] | null;
};

function pickCategoryName(embed: CategoryEmbed): string | null {
	if (!embed) return null;
	const row = Array.isArray(embed) ? embed[0] : embed;
	return row?.name ?? null;
}

function parseStatusFilter(value: string | null): ProductStatus | '' {
	return value === 'on_sale' || value === 'sold_out' || value === 'hidden' ? value : '';
}

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const status = parseStatusFilter(url.searchParams.get('status'));
	const category = url.searchParams.get('category') ?? '';
	const q = url.searchParams.get('q') ?? '';

	const { data: categories } = await supabase
		.from('categories')
		.select('id,name,sort_order')
		.order('sort_order');

	let query = supabase
		.from('products')
		.select(
			'id,name,price,is_price_hidden,status,created_at,categories(name),product_images(url,is_thumbnail)'
		)
		.order('created_at', { ascending: false })
		.limit(200);

	if (status) query = query.eq('status', status);
	if (category) query = query.eq('category_id', category);
	if (q) query = query.ilike('name', `%${q}%`);

	const { data } = await query;
	const rows = (data ?? []) as unknown as ProductListRow[];

	const products: AdminProductRow[] = rows.map((row) => {
		const images = row.product_images ?? [];
		const thumbnail = images.find((img) => img.is_thumbnail) ?? images[0];
		return {
			id: row.id,
			name: row.name,
			price: row.price,
			is_price_hidden: row.is_price_hidden,
			status: row.status,
			created_at: row.created_at,
			categoryName: pickCategoryName(row.categories),
			thumbnailUrl: thumbnail?.url ?? null
		};
	});

	return {
		categories: (categories ?? []) as Category[],
		products,
		status,
		category,
		q
	};
};

export const actions: Actions = {
	/** 판매중 ↔ 품절 토글. status 가 hidden 인 상품에는 적용하지 않는다. */
	toggleSale: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		const current = fd.get('status')?.toString();

		if (!id || (current !== 'on_sale' && current !== 'sold_out')) {
			return fail(400, { message: '잘못된 요청입니다.' });
		}

		const next: ProductStatus = current === 'on_sale' ? 'sold_out' : 'on_sale';
		const { error: err } = await supabase.from('products').update({ status: next }).eq('id', id);
		if (err) return fail(500, { message: '판매 상태 변경 중 오류가 발생했습니다.' });

		return { success: true };
	},

	/** 노출 ↔ 숨김 토글. 숨김 해제 시에는 판매중으로 복귀시킨다(이전 상태를 별도 저장하지 않음). */
	toggleVisibility: async ({ request, locals: { supabase } }) => {
		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		const current = fd.get('status')?.toString();

		if (!id) return fail(400, { message: '잘못된 요청입니다.' });

		const next: ProductStatus = current === 'hidden' ? 'on_sale' : 'hidden';
		const { error: err } = await supabase.from('products').update({ status: next }).eq('id', id);
		if (err) return fail(500, { message: '노출 상태 변경 중 오류가 발생했습니다.' });

		return { success: true };
	}
};
