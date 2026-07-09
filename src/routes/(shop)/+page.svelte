<script lang="ts">
	/**
	 * 메인(홈) 페이지.
	 * 헤더/GNB/푸터는 (shop)/+layout.svelte 가 공통 렌더링하므로 여기서는 본문 섹션만 구성한다.
	 * 페이지 전체에서 h1은 히어로의 sr-only 타이틀 하나뿐이다 — 배너는 DB에 텍스트 필드가 없는
	 * 순수 이미지이므로 슬라이드별 h1/h2 대신 이 방식을 택했다(과제 지시의 대안 허용 사항).
	 */
	import { resolve } from '$app/paths';
	import ProductCard from '$lib/components/product/ProductCard.svelte';
	import { formatDate } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const banners = $derived(data.banners ?? []);
	const categories = $derived(data.mainCategories ?? []);
	const products = $derived(data.recommendedProducts ?? []);
	const cases = $derived(data.cases ?? []);
	const notices = $derived(data.notices ?? []);
	const tel = $derived(data.company?.tel || '010-4055-3338');

	const slideCount = $derived(banners.length);
	let slide = $state(0);

	$effect(() => {
		if (slideCount <= 1) return;
		const timer = setInterval(() => {
			slide = (slide + 1) % slideCount;
		}, 5000);
		return () => clearInterval(timer);
	});

	function goTo(i: number) {
		slide = i;
	}
	function prevSlide() {
		slide = (slide - 1 + slideCount) % slideCount;
	}
	function nextSlide() {
		slide = (slide + 1) % slideCount;
	}
</script>

<!-- 히어로: 배너 슬라이더. 배너가 0건이면 브랜드 fallback 슬라이드 1장을 보여준다. -->
<section
	class="relative mt-2 overflow-hidden rounded-[14px] border border-line shadow-[0_2px_10px_rgba(20,27,43,0.06)] tb:mt-0"
	aria-roledescription="carousel"
	aria-label="메인 배너"
>
	<h1 class="sr-only">탄탄 편의시설 쇼핑몰 안전용품·장애인편의시설</h1>

	{#if slideCount > 0}
		<div class="relative min-h-[280px] tb:min-h-[400px]">
			{#each banners as banner, i (banner.id)}
				<div
					class={i === slide ? 'block' : 'hidden'}
					role="group"
					aria-roledescription="slide"
					aria-label={`${i + 1} / ${slideCount}`}
				>
					{#if banner.link_url}
						<!-- 배너 링크는 관리자가 입력한 임의 URL(내부/외부)이라 resolve() 대상이 아님 -->
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={banner.link_url} class="block">
							<img
								src={banner.image_url}
								alt={`프로모션 배너 ${i + 1}`}
								class="h-[280px] w-full object-cover tb:h-[400px]"
								loading={i === 0 ? 'eager' : 'lazy'}
							/>
						</a>
					{:else}
						<img
							src={banner.image_url}
							alt={`프로모션 배너 ${i + 1}`}
							class="h-[280px] w-full object-cover tb:h-[400px]"
							loading={i === 0 ? 'eager' : 'lazy'}
						/>
					{/if}
				</div>
			{/each}

			{#if slideCount > 1}
				<button
					type="button"
					onclick={prevSlide}
					aria-label="이전 배너"
					class="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-navy hover:bg-surface"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="M15 19l-7-7 7-7" /></svg
					>
				</button>
				<button
					type="button"
					onclick={nextSlide}
					aria-label="다음 배너"
					class="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-navy hover:bg-surface"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg
					>
				</button>
				<div class="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2.5">
					{#each banners as _banner, i (i)}
						<button
							type="button"
							onclick={() => goTo(i)}
							aria-label={`${i + 1}번째 배너로 이동`}
							aria-current={i === slide}
							class="h-2 w-[34px] rounded-md {i === slide ? 'bg-yellow' : 'bg-white/40'}"
						></button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="relative flex min-h-[280px] flex-col justify-center bg-gradient-to-br from-navy to-navy-dark px-6 py-9 tb:min-h-[400px] tb:px-14 tb:py-16"
		>
			<span
				class="mb-[18px] inline-block w-fit rounded-full bg-yellow px-[13px] py-[5px] text-[13px] font-extrabold text-navy"
			>
				제조 · 판매 · 시공 원스톱
			</span>
			<h2
				class="max-w-[640px] text-[29px] leading-tight font-black tracking-tight text-white tb:text-[44px]"
			>
				장애인편의시설<br />전문 판매 · 시공
			</h2>
			<p
				class="mt-[14px] max-w-[560px] text-[15px] leading-relaxed text-footer-text tb:text-[17px]"
			>
				점자블럭 · 카스토퍼 · 핸드레일 · 촉지판까지<br />관공서 · 건설 · 인테리어 현장에 바로
				공급합니다.
			</p>
			<a
				href={resolve('/inquiry?type=quote')}
				class="mt-[26px] inline-flex w-fit items-center gap-2 rounded-lg bg-yellow px-[26px] py-[14px] text-[16px] font-extrabold text-navy hover:bg-yellow-hover"
			>
				시공 문의하기
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg
				>
			</a>
		</div>
	{/if}
</section>

<!-- 카테고리 바로가기 -->
<section class="mt-9">
	<h2 class="sr-only">카테고리</h2>
	{#if categories.length > 0}
		<div class="grid grid-cols-2 gap-3.5 tb:grid-cols-6">
			{#each categories as category (category.id)}
				<a
					href={resolve(`/products?category=${category.id}`)}
					class="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-3 py-[22px] text-center transition hover:-translate-y-0.5 hover:border-navy hover:shadow-[0_6px_16px_rgba(31,56,100,0.13)]"
				>
					<span class="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10">
						<svg
							width="26"
							height="26"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-navy"
							aria-hidden="true"
						>
							<rect x="3" y="3" width="7" height="7" rx="1.5" />
							<rect x="14" y="3" width="7" height="7" rx="1.5" />
							<rect x="3" y="14" width="7" height="7" rx="1.5" />
							<rect x="14" y="14" width="7" height="7" rx="1.5" />
						</svg>
					</span>
					<span class="text-[15px] leading-snug font-bold text-navy">{category.name}</span>
				</a>
			{/each}
		</div>
	{:else}
		<p class="rounded-xl border border-line bg-surface px-6 py-8 text-center text-[15px] text-sub">
			등록된 카테고리가 없습니다.
		</p>
	{/if}
</section>

<!-- 추천 상품 -->
<section class="mt-13">
	<div class="mb-[22px] flex items-end justify-between">
		<div>
			<div class="mb-3 h-1 w-[38px] rounded bg-yellow"></div>
			<h2 class="text-[22px] font-black tracking-tight tb:text-[26px]">추천 상품</h2>
		</div>
		<a href={resolve('/products')} class="text-[15px] font-bold text-sub hover:text-navy">
			전체보기 +
		</a>
	</div>
	{#if products.length > 0}
		<div class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 tb:gap-5 lg:grid-cols-4">
			{#each products as product, i (product.id)}
				<ProductCard {product} isNew={i < 2} />
			{/each}
		</div>
	{:else}
		<p class="rounded-xl border border-line bg-surface px-6 py-12 text-center text-[15px] text-sub">
			등록된 추천 상품이 없습니다.
		</p>
	{/if}
</section>

<!-- 시공사례 -->
<section class="mt-14">
	<div class="mb-[22px] flex items-end justify-between">
		<div>
			<div class="mb-3 h-1 w-[38px] rounded bg-yellow"></div>
			<h2 class="text-[22px] font-black tracking-tight tb:text-[26px]">시공사례</h2>
		</div>
		<a href={resolve('/cases')} class="text-[15px] font-bold text-sub hover:text-navy">전체보기 +</a
		>
	</div>
	{#if cases.length > 0}
		<div class="flex gap-4 overflow-x-auto pb-2">
			{#each cases as item (item.id)}
				<a
					href={resolve('/(shop)/cases/[id]', { id: item.id })}
					class="w-[240px] flex-none overflow-hidden rounded-xl border border-line bg-surface transition hover:shadow-[0_8px_20px_rgba(20,27,43,0.1)] tb:w-[288px]"
				>
					<div class="h-[178px] w-full overflow-hidden bg-bg">
						{#if item.thumbnailUrl}
							<img
								src={item.thumbnailUrl}
								alt={item.title}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center">
								<svg
									width="34"
									height="34"
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
					</div>
					<div class="px-4 py-4">
						<p class="line-clamp-2 text-[15.5px] leading-snug font-bold text-ink">{item.title}</p>
						<p class="mt-2 text-[13px] font-semibold text-sub">{formatDate(item.created_at)}</p>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p class="rounded-xl border border-line bg-surface px-6 py-12 text-center text-[15px] text-sub">
			등록된 시공사례가 없습니다.
		</p>
	{/if}
</section>

<!-- 공지사항 + 고객센터 -->
<section class="mt-14 grid grid-cols-1 gap-6 tb:grid-cols-[1.35fr_1fr]">
	<div class="rounded-xl border border-line bg-surface px-6 py-6 tb:px-7">
		<div class="mb-[18px] flex items-center justify-between">
			<h2 class="text-[19px] font-black tracking-tight tb:text-[20px]">공지사항</h2>
			<a href={resolve('/notice')} class="text-[14px] font-bold text-sub hover:text-navy">
				더보기 +
			</a>
		</div>
		{#if notices.length > 0}
			<ul>
				{#each notices as notice (notice.id)}
					<li class="border-t border-line first:border-t-0">
						<a
							href={resolve('/(shop)/notice/[id]', { id: notice.id })}
							class="flex items-center gap-3.5 py-[15px] hover:bg-bg"
						>
							<span
								class="flex-none rounded-md bg-navy/10 px-[10px] py-1 text-[11.5px] font-extrabold text-navy"
							>
								{notice.is_pinned ? '고정' : '공지'}
							</span>
							<span class="flex-1 truncate text-[15.5px] font-semibold text-ink"
								>{notice.title}</span
							>
							<span class="flex-none text-[13px] font-semibold text-sub">
								{formatDate(notice.created_at)}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="py-8 text-center text-[15px] text-sub">등록된 공지사항이 없습니다.</p>
		{/if}
	</div>

	<div class="relative overflow-hidden rounded-xl bg-navy px-7 py-7 text-white">
		<div
			class="pointer-events-none absolute -right-8 -bottom-8 h-[150px] w-[150px] rounded-full bg-yellow/15"
		></div>
		<div class="relative">
			<p class="text-[14px] font-bold text-yellow">고객센터 · 시공문의</p>
			<p class="mt-[10px] text-[28px] font-black tracking-tight tb:text-[34px]">{tel}</p>
			<div class="mt-[14px] grid gap-[5px] text-[14.5px] leading-relaxed text-footer-text">
				<p>평일 09:00 – 18:00</p>
				<p>토요일 09:00 – 12:00 (점심 12:00–13:00)</p>
				<p>일요일 · 공휴일 휴무</p>
			</div>
			<a
				href={`tel:${tel}`}
				class="mt-5 inline-flex items-center gap-2 rounded-lg bg-yellow px-[22px] py-3 text-[15px] font-extrabold text-navy hover:bg-yellow-hover"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2z"
					/>
				</svg>
				전화 상담하기
			</a>
		</div>
	</div>
</section>
