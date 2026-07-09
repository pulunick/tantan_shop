<script lang="ts">
	/** 상품 등록. */
	import ProductForm, { type ProductFormInitial } from '../ProductForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const initial: ProductFormInitial = {
		name: '',
		categoryId: null,
		price: null,
		isPriceHidden: false,
		status: 'on_sale',
		descriptionHtml: '',
		options: [],
		images: []
	};
</script>

<svelte:head>
	<title>상품 등록 - 관리자</title>
</svelte:head>

<h1 class="text-[22px] font-black tracking-tight text-ink">상품 등록</h1>

<div class="mt-5 max-w-[900px]">
	<ProductForm supabase={data.supabase} categories={data.categories} {initial} />
</div>
