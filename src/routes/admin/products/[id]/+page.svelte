<script lang="ts">
	/** 상품 수정. */
	import { untrack } from 'svelte';
	import ProductForm, { type ProductFormInitial } from '../ProductForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// 편집 폼 초기값은 로드 시점의 data 스냅샷 1회로 구성한다(의도적으로 초기값만 캡처).
	const d = untrack(() => data);

	const initial: ProductFormInitial = {
		name: d.product.name,
		categoryId: d.product.category_id,
		price: d.product.price,
		isPriceHidden: d.product.is_price_hidden,
		status: d.product.status,
		descriptionHtml: d.product.description_html,
		options: d.options.map((o) => ({ id: o.id, name: o.name, extraPrice: o.extra_price })),
		images: d.images.map((img) => ({
			id: img.id,
			url: img.url,
			originalName: img.original_name,
			isThumbnail: img.is_thumbnail
		}))
	};
</script>

<svelte:head>
	<title>{data.product.name} 수정 - 관리자</title>
</svelte:head>

<h1 class="text-[22px] font-black tracking-tight text-ink">상품 수정</h1>

<div class="mt-5 max-w-[900px]">
	<ProductForm
		supabase={data.supabase}
		categories={data.categories}
		productId={data.product.id}
		{initial}
	/>
</div>
