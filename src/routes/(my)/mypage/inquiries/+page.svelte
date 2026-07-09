<script lang="ts">
	/** 내 문의 목록. 유형 배지 + 답변상태 배지, 답변완료 시 답변 내용을 함께 보여준다. */
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const typeLabel: Record<string, string> = {
		general: '일반문의',
		quote: '견적문의',
		reservation: '예약문의'
	};
</script>

<svelte:head>
	<title>내 문의 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-5 text-[22px] font-black tracking-tight text-ink">내 문의</h1>

{#if data.inquiries.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">작성한 문의가 없습니다.</p>
		<a href={resolve('/inquiry')} class="mt-1 text-[14px] font-bold text-navy hover:underline">
			문의하기
		</a>
	</div>
{:else}
	<ul class="flex flex-col gap-4">
		{#each data.inquiries as inquiry (inquiry.id)}
			<li class="rounded-xl border border-line bg-surface p-5">
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="inline-block rounded-md bg-navy-tint px-[9px] py-[4px] text-[12px] font-extrabold text-navy"
					>
						{typeLabel[inquiry.type] ?? inquiry.type}
					</span>
					{#if inquiry.status === 'answered'}
						<span
							class="inline-block rounded-md bg-status-delivered-bg px-[9px] py-[4px] text-[12px] font-extrabold text-status-delivered-fg"
						>
							답변완료
						</span>
					{:else}
						<span
							class="inline-block rounded-md bg-bg px-[9px] py-[4px] text-[12px] font-extrabold text-sub"
						>
							답변대기
						</span>
					{/if}
					<span class="ml-auto text-[13px] font-semibold text-sub"
						>{formatDate(inquiry.created_at)}</span
					>
				</div>
				<p class="mt-3 text-[15.5px] font-bold text-ink">{inquiry.title}</p>

				{#if inquiry.status === 'answered' && inquiry.answer}
					<div class="mt-3 rounded-lg bg-bg px-4 py-3">
						<p class="mb-1 text-[12.5px] font-extrabold text-navy">
							답변{inquiry.answered_at ? ` · ${formatDate(inquiry.answered_at)}` : ''}
						</p>
						<p class="text-[14.5px] leading-relaxed whitespace-pre-line text-ink">
							{inquiry.answer}
						</p>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
