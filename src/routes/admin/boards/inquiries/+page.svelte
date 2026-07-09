<script lang="ts">
	/** 문의 답변 목록. 미답변/전체 필터, 유형 배지, 비밀글 아이콘. */
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageData } from './$types';
	import type { InquiryType } from './+page.server';

	let { data }: { data: PageData } = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	const typeLabel: Record<InquiryType, string> = {
		general: '일반',
		quote: '견적',
		reservation: '예약'
	};
	const typeClass: Record<InquiryType, string> = {
		general: 'bg-navy-tint text-navy',
		quote: 'bg-status-preparing-bg text-phone-price',
		reservation: 'bg-status-delivered-bg text-status-delivered-fg'
	};

	function filterHref(filter: 'waiting' | 'all') {
		return filter === 'waiting'
			? resolve('/admin/boards/inquiries')
			: resolve('/admin/boards/inquiries?filter=all');
	}

	/**
	 * URLSearchParams 인스턴스 없이(svelte/prefer-svelte-reactivity) 쿼리 문자열을 직접 조립.
	 * resolve() 가 리터럴 '?' 를 정적으로 인식해야 하므로 삼항으로 정적 경로/템플릿을 분기한다.
	 */
	function makeHref(targetPage: number) {
		const pairs: string[] = [];
		if (data.filter === 'all') pairs.push('filter=all');
		if (targetPage > 1) pairs.push(`page=${targetPage}`);
		const qs = pairs.join('&');
		return qs ? resolve(`/admin/boards/inquiries?${qs}`) : resolve('/admin/boards/inquiries');
	}
</script>

<svelte:head>
	<title>문의 답변 - 탄탄 관리자</title>
</svelte:head>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">문의 답변</h1>

<div class="mb-5 flex gap-2">
	<a
		href={filterHref('waiting')}
		class="min-h-11 rounded-lg border px-5 py-[10px] text-[14.5px] font-extrabold {data.filter ===
		'waiting'
			? 'border-navy bg-navy text-white'
			: 'border-line-2 bg-surface text-ink hover:bg-bg'}"
	>
		미답변 <span class="opacity-70">{data.waitingCount}</span>
	</a>
	<a
		href={filterHref('all')}
		class="min-h-11 rounded-lg border px-5 py-[10px] text-[14.5px] font-extrabold {data.filter ===
		'all'
			? 'border-navy bg-navy text-white'
			: 'border-line-2 bg-surface text-ink hover:bg-bg'}"
	>
		전체
	</a>
</div>

{#if data.inquiries.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">
			{data.filter === 'waiting' ? '미답변 문의가 없습니다.' : '등록된 문의가 없습니다.'}
		</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-xl border border-line bg-surface">
		{#each data.inquiries as q (q.id)}
			<a
				href={resolve('/admin/boards/inquiries/[id]', { id: q.id })}
				class="flex items-center gap-3 border-t border-line-2 px-5 py-4 first:border-t-0 hover:bg-bg"
			>
				<span
					class="shrink-0 rounded-md px-[10px] py-[4px] text-[12px] font-extrabold {typeClass[
						q.type
					]}"
				>
					{typeLabel[q.type]}
				</span>
				<span class="min-w-0 flex-1">
					<span class="flex items-center gap-1.5 text-[15px] font-bold text-ink">
						{#if q.is_secret}
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-label="비밀글"
								class="shrink-0 text-sub"
								><rect x="4" y="11" width="16" height="9" rx="2" /><path
									d="M8 11V7a4 4 0 0 1 8 0v4"
								/></svg
							>
						{/if}
						<span class="truncate">{q.title}</span>
					</span>
					<span class="mt-1 block text-[13px] text-sub"
						>{q.authorName} · {formatDate(q.created_at)}</span
					>
				</span>
				<span
					class="shrink-0 rounded-full px-[11px] py-[5px] text-[12.5px] font-extrabold whitespace-nowrap {q.status ===
					'answered'
						? 'bg-status-delivered-bg text-status-delivered-fg'
						: 'bg-status-preparing-bg text-phone-price'}"
				>
					{q.status === 'answered' ? '답변완료' : '대기'}
				</span>
			</a>
		{/each}
	</div>

	{#if totalPages > 1}
		<div class="mt-8">
			<Pagination currentPage={data.page} {totalPages} {makeHref} />
		</div>
	{/if}
{/if}
