<script lang="ts">
	/** 시공사례 갤러리. PC 3열 / 태블릿 2열 / 모바일 2열 카드 그리드. */
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	function makeHref(targetPage: number) {
		return targetPage > 1 ? resolve(`/cases?page=${targetPage}`) : resolve('/cases');
	}
</script>

<svelte:head>
	<title>시공사례 - 탄탄 편의시설</title>
</svelte:head>

<div class="mb-1 text-[13px] font-semibold text-sub">
	<a href={resolve('/')} class="hover:text-navy">홈</a>
	<span aria-hidden="true">›</span>
	<span class="text-navy">시공사례</span>
</div>

<div class="mb-7">
	<div class="mb-3 h-1 w-[38px] rounded-full bg-yellow"></div>
	<h1 class="text-[27px] font-black tracking-tight text-ink">시공사례</h1>
	<p class="mt-2 text-[15px] text-sub">
		관공서 · 아파트 · 공공시설 등 탄탄 편의시설의 시공 현장을 소개합니다.
	</p>
</div>

{#if data.cases.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">등록된 시공사례가 없습니다.</p>
	</div>
{:else}
	<div class="grid grid-cols-2 gap-4 tb:grid-cols-3 tb:gap-[22px]">
		{#each data.cases as item (item.id)}
			<a
				href={resolve('/(shop)/cases/[id]', { id: item.id })}
				class="group block overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(20,27,43,0.1)]"
			>
				<div class="aspect-[4/3] overflow-hidden bg-bg">
					{#if item.thumbnailUrl}
						<img
							src={item.thumbnailUrl}
							alt={item.title}
							class="h-full w-full object-cover"
							loading="lazy"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center text-sub">
							<svg
								width="36"
								height="36"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<rect x="3" y="3" width="18" height="18" rx="2" />
								<circle cx="8.5" cy="8.5" r="1.5" />
								<path d="M21 15l-5-5L5 21" />
							</svg>
						</div>
					{/if}
				</div>
				<div class="px-[18px] py-[17px]">
					<p class="text-[16px] leading-[1.45] font-bold text-ink line-clamp-2">{item.title}</p>
					<p class="mt-[9px] text-[13.5px] font-semibold text-sub">{formatDate(item.created_at)}</p>
				</div>
			</a>
		{/each}
	</div>

	{#if totalPages > 1}
		<div class="mt-10">
			<Pagination currentPage={data.page} {totalPages} {makeHref} />
		</div>
	{/if}
{/if}
