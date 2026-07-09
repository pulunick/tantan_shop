<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const caseItem = $derived(data.caseItem);
	const images = $derived(data.images);
</script>

<svelte:head>
	<title>{caseItem.title} - 시공사례 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto max-w-[860px]">
	<div class="mb-1 text-[13px] font-semibold text-sub">
		<a href={resolve('/')} class="hover:text-navy">홈</a>
		<span aria-hidden="true">›</span>
		<a href={resolve('/cases')} class="hover:text-navy">시공사례</a>
	</div>

	<a
		href={resolve('/cases')}
		class="mt-5 inline-block text-[14px] font-bold text-sub hover:text-navy"
	>
		← 시공사례 목록
	</a>

	<h1 class="mt-4 text-[25px] leading-snug font-black tracking-tight text-ink">
		{caseItem.title}
	</h1>
	<p class="mt-3 mb-6 text-[14px] font-semibold text-sub">
		시공일 {formatDate(caseItem.created_at)}
	</p>

	{#if images.length > 0}
		<div class="flex flex-col gap-[18px]">
			{#each images as img, i (img.url + i)}
				<div class="aspect-video overflow-hidden rounded-xl border border-line bg-bg">
					<img
						src={img.url}
						alt="{caseItem.title} 현장 사진 {i + 1}"
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				</div>
			{/each}
		</div>
	{/if}

	<div class="prose prose-headings:text-ink max-w-none py-8 text-[16px] leading-[1.8] text-ink">
		{#if caseItem.content_html}
			<!-- 시공사례 본문은 관리자만 작성하는 신뢰된 HTML (위지윅). Phase 1 admin 전용 -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html caseItem.content_html}
		{:else}
			<p class="text-sub">등록된 상세 설명이 없습니다.</p>
		{/if}
	</div>

	<div
		class="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-navy-tint px-6 py-5"
	>
		<span class="text-[15px] font-bold text-navy">같은 시공이 필요하신가요?</span>
		<a
			href={resolve('/inquiry?type=quote')}
			class="rounded-lg bg-navy px-5 py-[11px] text-[14.5px] font-extrabold text-white hover:bg-navy/90"
		>
			견적 문의하기
		</a>
	</div>
</div>
