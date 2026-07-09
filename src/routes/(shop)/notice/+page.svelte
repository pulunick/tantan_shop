<script lang="ts">
	/**
	 * 공지사항 목록. 고정 공지는 상단 강조(연한 배지 배경 + '공지' 배지),
	 * 일반 공지는 번호를 매겨 테이블 형태로 보여준다.
	 */
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	/** 페이지네이션 링크. */
	function makeHref(targetPage: number) {
		return targetPage > 1 ? resolve(`/notice?page=${targetPage}`) : resolve('/notice');
	}

	/** 번호 컬럼: 고정 공지는 '공지' 배지, 일반 공지는 최신순 역순 번호. */
	function displayNo(index: number): number {
		return data.total - (data.page - 1) * data.pageSize - index;
	}
</script>

<svelte:head>
	<title>공지사항 - 탄탄 편의시설</title>
</svelte:head>

<div class="mb-1 text-[13px] font-semibold text-sub">
	<a href={resolve('/')} class="hover:text-navy">홈</a>
	<span aria-hidden="true">›</span>
	<span class="text-navy">공지사항</span>
</div>

<div class="mb-6">
	<div class="mb-3 h-1 w-[38px] rounded-full bg-yellow"></div>
	<h1 class="text-[27px] font-black tracking-tight text-ink">공지사항</h1>
</div>

{#if data.notices.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">등록된 공지사항이 없습니다.</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-xl border border-line bg-surface">
		<div
			class="grid grid-cols-[64px_1fr_120px] bg-navy text-[14px] font-extrabold text-white tb:grid-cols-[90px_1fr_130px]"
		>
			<div class="px-3 py-[14px] text-center tb:px-5">번호</div>
			<div class="px-3 py-[14px] tb:px-5">제목</div>
			<div class="px-3 py-[14px] text-center tb:px-5">등록일</div>
		</div>

		{#each data.notices as notice, i (notice.id)}
			<a
				href={resolve('/(shop)/notice/[id]', { id: notice.id })}
				class="grid grid-cols-[64px_1fr_120px] items-center border-t border-line-2 tb:grid-cols-[90px_1fr_130px] {notice.is_pinned
					? 'bg-navy-tint'
					: 'bg-surface hover:bg-bg'}"
			>
				<div
					class="px-3 py-[15px] text-center text-[14px] font-extrabold tb:px-5 {notice.is_pinned
						? 'text-phone-price'
						: 'text-sub'}"
				>
					{#if notice.is_pinned}
						공지
					{:else}
						{displayNo(i)}
					{/if}
				</div>
				<div
					class="truncate px-3 py-[15px] text-[15.5px] text-ink tb:px-5 {notice.is_pinned
						? 'font-extrabold'
						: 'font-semibold'}"
				>
					{notice.title}
				</div>
				<div class="px-3 py-[15px] text-center text-[13.5px] font-semibold text-sub tb:px-5">
					{formatDate(notice.created_at)}
				</div>
			</a>
		{/each}
	</div>

	{#if totalPages > 1}
		<div class="mt-8">
			<Pagination currentPage={data.page} {totalPages} {makeHref} />
		</div>
	{/if}
{/if}
