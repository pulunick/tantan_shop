import type { PageServerLoad } from './$types';
import type { Product } from '$lib/types';

type BannerRow = {
	id: string;
	image_url: string;
	link_url: string | null;
	sort_order: number;
};

export type Banner = BannerRow;

type CategoryRow = {
	id: string;
	name: string;
	sort_order: number;
};

export type MainCategory = CategoryRow;

type ProductImageRow = {
	url: string;
	is_thumbnail: boolean;
	sort_order: number;
};

type ProductRow = {
	id: string;
	name: string;
	price: number | null;
	is_price_hidden: boolean;
	status: Product['status'];
	created_at: string;
	product_images: ProductImageRow[] | null;
};

/** 상품 이미지 목록에서 대표 썸네일 하나를 고른다: is_thumbnail 우선, 없으면 sort_order 최솟값. */
function pickThumbnail(images: ProductImageRow[] | null): string | null {
	if (!images || images.length === 0) return null;
	const marked = images.find((img) => img.is_thumbnail);
	if (marked) return marked.url;
	const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
	return sorted[0]?.url ?? null;
}

type CaseImageRow = { url: string; sort_order: number };

type CasePostRow = {
	id: string;
	title: string;
	created_at: string;
	post_images: CaseImageRow[] | null;
};

export type CaseSummary = {
	id: string;
	title: string;
	created_at: string;
	thumbnailUrl: string | null;
};

export type NoticeSummary = {
	id: string;
	title: string;
	created_at: string;
	is_pinned: boolean;
};

/**
 * 메인 페이지 데이터.
 * 공개 RLS(select using is_visible/status<>'hidden') 기준이므로 비회원도 조회 가능해야 한다.
 */
export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const nowIso = new Date().toISOString();

	const [
		{ data: banners },
		{ data: categories },
		{ data: products },
		{ data: cases },
		{ data: notices }
	] = await Promise.all([
		supabase
			.from('banners')
			.select('id,image_url,link_url,sort_order')
			.eq('is_visible', true)
			.or(`start_at.is.null,start_at.lte.${nowIso}`)
			.or(`end_at.is.null,end_at.gte.${nowIso}`)
			.order('sort_order'),
		supabase
			.from('categories')
			.select('id,name,sort_order')
			.eq('is_visible', true)
			.order('sort_order'),
		supabase
			.from('products')
			.select(
				'id,name,price,is_price_hidden,status,created_at,product_images(url,is_thumbnail,sort_order)'
			)
			.eq('status', 'on_sale')
			.order('created_at', { ascending: false })
			.limit(8),
		supabase
			.from('posts')
			.select('id,title,created_at,post_images(url,sort_order)')
			.eq('board_type', 'case')
			.eq('is_visible', true)
			.order('created_at', { ascending: false })
			.limit(4),
		supabase
			.from('posts')
			.select('id,title,created_at,is_pinned')
			.eq('board_type', 'notice')
			.eq('is_visible', true)
			.order('is_pinned', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(3)
	]);

	const recommendedProducts: Product[] = ((products ?? []) as ProductRow[]).map((p) => ({
		id: p.id,
		name: p.name,
		price: p.price,
		is_price_hidden: p.is_price_hidden,
		status: p.status,
		created_at: p.created_at,
		thumbnailUrl: pickThumbnail(p.product_images)
	}));

	const caseSummaries: CaseSummary[] = ((cases ?? []) as CasePostRow[]).map((c) => {
		const sorted = [...(c.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
		return {
			id: c.id,
			title: c.title,
			created_at: c.created_at,
			thumbnailUrl: sorted[0]?.url ?? null
		};
	});

	return {
		banners: (banners ?? []) as Banner[],
		mainCategories: (categories ?? []) as MainCategory[],
		recommendedProducts,
		cases: caseSummaries,
		notices: (notices ?? []) as NoticeSummary[]
	};
};
