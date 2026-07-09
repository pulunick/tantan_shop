<script lang="ts">
	/**
	 * 상품 리스트. 좌측 카테고리 사이드바(PC, tb+)/상단 칩(모바일), 정렬, 그리드, 페이지네이션.
	 * 필터·정렬·페이지는 전부 URL 쿼리(category/q/sort/page)로 표현 — 새로고침·공유·뒤로가기에 안전하다.
	 */
	import { resolve } from '$app/paths';
	import ProductCard from '$lib/components/product/ProductCard.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	const sortOptions: { value: typeof data.sort; label: string }[] = [
		{ value: 'latest', label: '최신순' },
		{ value: 'price_asc', label: '낮은가격순' },
		{ value: 'price_desc', label: '높은가격순' }
	];

	/** 쿼리스트링 빌더 (빈 값 제외, 값 인코딩). 순수 함수 — 리액티브 상태 아님 */
	function toQuery(pairs: [string, string | null | undefined][]) {
		return pairs
			.filter(([, v]) => v != null && v !== '')
			.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
			.join('&');
	}

	/** 카테고리 이동 링크. 정렬/검색어는 유지하고 페이지는 1로 리셋한다. */
	function categoryHref(categoryId: string | null) {
		const qs = toQuery([
			['category', categoryId],
			['q', data.q],
			['sort', data.sort !== 'latest' ? data.sort : null]
		]);
		return qs ? resolve(`/products?${qs}`) : resolve('/products');
	}

	/** 페이지네이션 링크. 카테고리/검색어/정렬을 모두 유지한다. */
	function makeHref(targetPage: number) {
		const qs = toQuery([
			['category', data.category],
			['q', data.q],
			['sort', data.sort !== 'latest' ? data.sort : null],
			['page', targetPage > 1 ? String(targetPage) : null]
		]);
		return qs ? resolve(`/products?${qs}`) : resolve('/products');
	}
</script>

<svelte:head>
	<title>상품 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto max-w-[1200px] px-6 py-8">
	<div class="mb-1 text-[13px] font-semibold text-sub">
		<a href={resolve('/')} class="hover:text-navy">홈</a>
		<span aria-hidden="true">›</span>
		<span class="text-navy">상품</span>
	</div>

	<div class="flex items-end justify-between gap-4">
		<div>
			<h1 class="text-[28px] font-black tracking-tight text-ink">상품</h1>
			<p class="mt-2 text-[15px] font-semibold text-sub">
				총 <span class="font-extrabold text-navy">{data.total}</span>개 상품
			</p>
		</div>
	</div>

	<!-- 모바일 카테고리 칩 (tb 미만) -->
	<div class="mt-4 flex gap-2 overflow-x-auto pb-1 tb:hidden" aria-label="카테고리 선택">
		<a
			href={categoryHref(null)}
			class="flex-none rounded-full border px-4 py-2 text-[14px] font-bold whitespace-nowrap {!data.category
				? 'border-navy bg-navy text-white'
				: 'border-line-2 bg-surface text-navy'}"
			aria-current={!data.category ? 'page' : undefined}
		>
			전체상품
		</a>
		{#each data.categories as cat (cat.id)}
			<a
				href={categoryHref(cat.id)}
				class="flex-none rounded-full border px-4 py-2 text-[14px] font-bold whitespace-nowrap {data.category ===
				cat.id
					? 'border-navy bg-navy text-white'
					: 'border-line-2 bg-surface text-navy'}"
				aria-current={data.category === cat.id ? 'page' : undefined}
			>
				{cat.name}
			</a>
		{/each}
	</div>

	<div class="mt-6 grid grid-cols-1 items-start gap-7 tb:grid-cols-[212px_1fr]">
		<!-- 카테고리 사이드바 (tb 이상) -->
		<aside class="hidden overflow-hidden rounded-xl border border-line bg-surface tb:block">
			<h2 class="bg-navy px-5 py-[15px] text-[16px] font-extrabold text-white">카테고리</h2>
			<nav aria-label="카테고리 선택" class="py-1.5">
				<a
					href={categoryHref(null)}
					class="block border-l-[3px] px-[17px] py-3 text-[15px] {!data.category
						? 'border-yellow bg-bg font-extrabold text-navy'
						: 'border-transparent font-semibold text-ink hover:bg-bg'}"
					aria-current={!data.category ? 'page' : undefined}
				>
					전체상품
				</a>
				{#each data.categories as cat (cat.id)}
					<a
						href={categoryHref(cat.id)}
						class="block border-l-[3px] px-[17px] py-3 text-[15px] {data.category === cat.id
							? 'border-yellow bg-bg font-extrabold text-navy'
							: 'border-transparent font-semibold text-ink hover:bg-bg'}"
						aria-current={data.category === cat.id ? 'page' : undefined}
					>
						{cat.name}
					</a>
				{/each}
			</nav>
		</aside>

		<main>
			<!-- 툴바: 검색어 안내 + 정렬 -->
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<p class="text-[14.5px] font-semibold text-sub">
					{#if data.q}
						'<span class="font-extrabold text-navy">{data.q}</span>' 검색 결과
					{:else}
						<span class="font-extrabold text-navy">
							{data.category
								? (data.categories.find((c) => c.id === data.category)?.name ?? '전체상품')
								: '전체상품'}
						</span>
					{/if}
					· 총 {data.total}개
				</p>

				<form method="GET" action={resolve('/products')} class="flex items-center gap-2">
					{#if data.category}
						<input type="hidden" name="category" value={data.category} />
					{/if}
					{#if data.q}
						<input type="hidden" name="q" value={data.q} />
					{/if}
					<label for="sort-select" class="sr-only">정렬 기준</label>
					<select
						id="sort-select"
						name="sort"
						value={data.sort}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						class="rounded-lg border border-line-2 bg-surface px-3 py-2.5 text-[14.5px] font-semibold text-ink"
					>
						{#each sortOptions as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
					<button type="submit" class="sr-only">정렬 적용</button>
				</form>
			</div>

			{#if data.products.length === 0}
				<div
					class="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface px-6 py-20 text-center"
				>
					<svg
						width="44"
						height="44"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-sub"
						aria-hidden="true"
					>
						<circle cx="10.5" cy="10.5" r="6.5" />
						<path d="M15.5 15.5L21 21" />
					</svg>
					<p class="text-[16px] font-extrabold text-ink">조건에 맞는 상품이 없습니다.</p>
					<p class="text-[15px] text-sub">
						다른 카테고리를 선택하거나 검색어를 바꿔서 다시 확인해 주세요.
					</p>
					{#if data.category || data.q}
						<a
							href={resolve('/products')}
							class="mt-2 rounded-lg border border-navy px-5 py-2.5 text-[15px] font-bold text-navy hover:bg-bg"
						>
							전체 상품 보기
						</a>
					{/if}
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-5">
					{#each data.products as product (product.id)}
						<ProductCard {product} />
					{/each}
				</div>

				<div class="mt-10">
					<Pagination currentPage={data.page} {totalPages} {makeHref} />
				</div>
			{/if}
		</main>
	</div>
</div>
