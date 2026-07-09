<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const notice = $derived(data.notice);
</script>

<svelte:head>
	<title>{notice.title} - 공지사항 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto max-w-[1000px]">
	<div class="mb-1 text-[13px] font-semibold text-sub">
		<a href={resolve('/')} class="hover:text-navy">홈</a>
		<span aria-hidden="true">›</span>
		<a href={resolve('/notice')} class="hover:text-navy">공지사항</a>
	</div>

	<a
		href={resolve('/notice')}
		class="mt-5 inline-block text-[14px] font-bold text-sub hover:text-navy"
	>
		← 공지사항 목록
	</a>

	<div class="mt-4 border-b-2 border-line pb-5">
		<div class="flex flex-wrap items-center gap-2">
			{#if notice.is_pinned}
				<span
					class="rounded-md bg-navy-tint px-[9px] py-[4px] text-[11.5px] font-extrabold text-phone-price"
					>공지</span
				>
			{/if}
			<h1 class="text-[25px] leading-snug font-black tracking-tight text-ink">
				{notice.title}
			</h1>
		</div>
		<p class="mt-3 text-[13.5px] font-semibold text-sub">{formatDate(notice.created_at)}</p>
	</div>

	<div class="prose prose-headings:text-ink max-w-none py-8 text-[15px] text-ink">
		{#if notice.content_html}
			<!-- 공지 본문은 관리자만 작성하는 신뢰된 HTML (위지윅). Phase 1 admin 전용 -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html notice.content_html}
		{:else}
			<p class="text-sub">등록된 내용이 없습니다.</p>
		{/if}
	</div>
</div>
