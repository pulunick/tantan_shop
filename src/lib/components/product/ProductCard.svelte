<script lang="ts">
	/** 상품 그리드 카드. 메인/상품리스트 공용. 품절이면 오버레이+배지만 얹고 버튼은 상세페이지 몫. */
	import { resolve } from '$app/paths';
	import type { Product } from '$lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ProductPrice from '$lib/components/ui/ProductPrice.svelte';

	type Props = {
		product: Product;
		isNew?: boolean;
	};

	let { product, isNew = false }: Props = $props();

	let isSoldOut = $derived(product.status === 'sold_out');
</script>

<a
	href={resolve('/(shop)/products/[id]', { id: product.id })}
	class="group block overflow-hidden rounded-[12px] border border-line bg-surface shadow-sm transition hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(20,27,43,0.1)]"
>
	<div class="relative aspect-square overflow-hidden">
		{#if product.thumbnailUrl}
			<img
				src={product.thumbnailUrl}
				alt={product.name}
				class="h-full w-full object-cover"
				loading="lazy"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center border border-line bg-bg">
				<svg
					width="40"
					height="40"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-sub"
					aria-hidden="true"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" />
					<circle cx="8.5" cy="8.5" r="1.5" />
					<path d="M21 15l-5-5L5 21" />
				</svg>
			</div>
		{/if}

		{#if isNew}
			<div class="absolute left-[10px] top-[10px]">
				<Badge variant="new" />
			</div>
		{/if}

		{#if isSoldOut}
			<div class="absolute inset-0 flex items-center justify-center bg-bg/60">
				<span class="rounded-lg bg-navy-dark px-5 py-2 text-[15px] font-extrabold text-white"
					>품절</span
				>
			</div>
		{/if}
	</div>

	<div class="px-4 pb-[18px] pt-4">
		<p class="h-[47px] text-[16px] leading-[1.45] font-semibold text-ink line-clamp-2">
			{product.name}
		</p>
		<div class="mt-3">
			<ProductPrice price={product.price} isPhoneInquiry={product.is_price_hidden} />
		</div>
	</div>
</a>
