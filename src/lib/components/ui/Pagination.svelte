<script lang="ts">
	/**
	 * 페이지네이션. href 생성은 호출부의 makeHref(page) 가 담당한다 —
	 * 반드시 $app/paths 의 resolve() 로 만든 경로(ResolvedPathname)를 반환해야 한다.
	 */
	import type { ResolvedPathname } from '$app/types';

	type Props = {
		currentPage: number;
		totalPages: number;
		makeHref: (page: number) => ResolvedPathname;
	};

	let { currentPage, totalPages, makeHref }: Props = $props();

	let pages = $derived(Array.from({ length: Math.max(totalPages, 0) }, (_, i) => i + 1));
	let hasPrev = $derived(currentPage > 1);
	let hasNext = $derived(currentPage < totalPages);
</script>

<nav aria-label="페이지 이동" class="flex items-center justify-center gap-2">
	{#if hasPrev}
		<a
			href={makeHref(currentPage - 1)}
			aria-label="이전 페이지"
			class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-2 font-bold text-sub hover:bg-bg"
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M15 5l-7 7 7 7" />
			</svg>
		</a>
	{:else}
		<span
			aria-hidden="true"
			class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-2 font-bold text-sub/40"
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M15 5l-7 7 7 7" />
			</svg>
		</span>
	{/if}

	{#each pages as page (page)}
		{#if page === currentPage}
			<a
				href={makeHref(page)}
				aria-current="page"
				class="flex h-11 w-11 items-center justify-center rounded-lg bg-navy text-[15px] font-extrabold text-white"
			>
				{page}
			</a>
		{:else}
			<a
				href={makeHref(page)}
				class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-2 text-[15px] font-bold text-navy hover:bg-bg"
			>
				{page}
			</a>
		{/if}
	{/each}

	{#if hasNext}
		<a
			href={makeHref(currentPage + 1)}
			aria-label="다음 페이지"
			class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-2 font-bold text-sub hover:bg-bg"
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M9 5l7 7-7 7" />
			</svg>
		</a>
	{:else}
		<span
			aria-hidden="true"
			class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-2 font-bold text-sub/40"
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M9 5l7 7-7 7" />
			</svg>
		</span>
	{/if}
</nav>
