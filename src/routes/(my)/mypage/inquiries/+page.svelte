<script lang="ts">
	/**
	 * 내 문의 목록. 유형 배지 + 답변상태 배지, 답변완료 항목만 클릭해 답변을 펼쳐볼 수 있다.
	 * 목록 데이터는 +page.server.ts에서 조회(본문 content 포함 — 카드 미리보기 2줄 클램프).
	 */
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import { slide } from 'svelte/transition';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const typeLabel: Record<string, string> = {
		general: '일반문의',
		quote: '견적문의',
		reservation: '예약문의'
	};

	// 답변완료 항목의 펼침 상태 (문의 id -> 펼침 여부)
	let expanded = $state<Record<string, boolean>>({});

	function toggle(id: string) {
		expanded[id] = !expanded[id];
	}
</script>

<svelte:head>
	<title>내 문의 - 탄탄 편의시설</title>
</svelte:head>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-[22px] font-black tracking-tight text-ink">내 문의</h1>
	<a
		href={resolve('/inquiry')}
		class="inline-flex min-h-11 items-center gap-2 rounded-[9px] border border-line-2 bg-surface px-4 py-[10px] text-[14px] font-extrabold text-navy hover:bg-navy-tint"
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
			aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg
		>
		문의하기
	</a>
</div>

{#if data.inquiries.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-line bg-surface px-6 py-16 text-center"
	>
		<span
			class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-bg"
			aria-hidden="true"
		>
			<svg
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#9aa4ba"
				stroke-width="1.7"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z" /></svg
			>
		</span>
		<p class="text-[16.5px] font-extrabold text-ink">문의 내역이 없습니다.</p>
		<p class="mb-3 text-[14px] font-semibold text-sub">
			제품·시공·견적 관련 문의를 남겨 주시면 빠르게 답변드립니다.
		</p>
		<a
			href={resolve('/inquiry')}
			class="inline-flex min-h-11 items-center rounded-[10px] bg-navy px-6 py-[13px] text-[15px] font-extrabold text-white hover:bg-[#28457a]"
		>
			문의하기
		</a>
	</div>
{:else}
	<ul class="flex flex-col gap-3.5">
		{#each data.inquiries as inquiry (inquiry.id)}
			{@const isAnswered = inquiry.status === 'answered'}
			{@const isOpen = isAnswered && !!expanded[inquiry.id]}
			<li
				class="rounded-[14px] border border-line bg-surface p-5 shadow-[0_3px_12px_rgba(20,27,43,.04)]"
			>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="inline-block rounded-md bg-navy-tint px-[10px] py-1 text-[12px] font-extrabold text-navy"
					>
						{typeLabel[inquiry.type] ?? inquiry.type}
					</span>
					{#if isAnswered}
						<span
							class="inline-block rounded-md bg-status-delivered-bg px-[10px] py-1 text-[12px] font-extrabold text-status-delivered-fg"
						>
							답변완료
						</span>
					{:else}
						<span
							class="inline-block rounded-md bg-bg px-[10px] py-1 text-[12px] font-extrabold text-sub"
						>
							답변대기
						</span>
					{/if}
					<span class="ml-auto text-[13px] font-semibold text-sub"
						>{formatDate(inquiry.created_at)}</span
					>
				</div>

				{#if isAnswered}
					<button
						type="button"
						onclick={() => toggle(inquiry.id)}
						aria-expanded={isOpen}
						aria-controls={`inquiry-answer-${inquiry.id}`}
						class="mt-3 flex w-full min-h-11 items-center gap-2.5 text-left"
					>
						<span class="flex-1 text-[16px] leading-snug font-extrabold text-ink"
							>{inquiry.title}</span
						>
						<svg
							class="flex-none text-[#9aa4ba] transition-transform duration-200"
							style={`transform: rotate(${isOpen ? 180 : 0}deg)`}
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg
						>
					</button>
				{:else}
					<p class="mt-3 text-[16px] leading-snug font-extrabold text-ink">{inquiry.title}</p>
				{/if}

				<!-- 본문 미리보기 (시안 스펙 — 2줄 클램프) -->
				<p class="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed font-semibold text-sub">
					{inquiry.content}
				</p>

				{#if isOpen && inquiry.answer}
					<div
						id={`inquiry-answer-${inquiry.id}`}
						transition:slide={{ duration: 200 }}
						class="mt-4 rounded-[11px] bg-bg px-[18px] py-4"
					>
						<div class="mb-2 flex flex-wrap items-center gap-[7px]">
							<span
								class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-navy"
								aria-hidden="true"
							>
								<svg
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="#fff"
									stroke-width="2.4"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="M9 17l-5-5" /><path d="M20 6L10 16" /></svg
								>
							</span>
							<span class="text-[13px] font-black text-navy">탄탄 편의시설 답변</span>
							{#if inquiry.answered_at}
								<span class="text-[12.5px] font-semibold text-sub"
									>{formatDate(inquiry.answered_at)}</span
								>
							{/if}
						</div>
						<p class="text-[14.5px] leading-[1.7] font-semibold whitespace-pre-line text-ink">
							{inquiry.answer}
						</p>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
