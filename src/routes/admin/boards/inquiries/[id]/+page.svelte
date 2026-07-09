<script lang="ts">
	/** 문의 상세 + 답변 작성. 예약 유형만 희망일/현장주소를 함께 보여준다. */
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	const typeLabel = { general: '일반문의', quote: '견적문의', reservation: '예약문의' } as const;
</script>

<svelte:head>
	<title>{data.inquiry.title} - 탄탄 관리자</title>
</svelte:head>

<a
	href={resolve('/admin/boards/inquiries')}
	class="mb-4 inline-block text-[14.5px] font-bold text-sub hover:text-navy"
>
	← 문의 목록
</a>

<h1 class="sr-only">문의 상세</h1>

<div class="grid max-w-[1000px] grid-cols-1 gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
	<div class="rounded-xl border border-line bg-surface p-6">
		<div class="mb-3 flex flex-wrap items-center gap-2">
			<span
				class="rounded-md bg-navy-tint px-[10px] py-[4px] text-[12.5px] font-extrabold text-navy"
				>{typeLabel[data.inquiry.type]}</span
			>
			{#if data.inquiry.is_secret}
				<span class="rounded-md bg-bg px-[10px] py-[4px] text-[12.5px] font-extrabold text-sub"
					>비밀글</span
				>
			{/if}
			<span
				class="rounded-full px-[11px] py-[5px] text-[12.5px] font-extrabold {data.inquiry.status ===
				'answered'
					? 'bg-status-delivered-bg text-status-delivered-fg'
					: 'bg-status-preparing-bg text-phone-price'}"
			>
				{data.inquiry.status === 'answered' ? '답변완료' : '대기'}
			</span>
		</div>
		<h2 class="mb-2 text-[19px] font-black text-ink">{data.inquiry.title}</h2>
		<p class="mb-4 text-[13.5px] text-sub">
			{data.inquiry.authorName}{#if data.inquiry.authorPhone}
				· {data.inquiry.authorPhone}{/if} · {formatDate(data.inquiry.created_at)}
		</p>

		{#if data.inquiry.type === 'reservation'}
			<div class="mb-4 grid grid-cols-1 gap-2 rounded-lg bg-bg p-4 text-[14px] sm:grid-cols-2">
				<div>
					<span class="font-bold text-sub">희망 시공일</span>
					<span class="ml-2 font-bold text-ink"
						>{data.inquiry.hope_date ? formatDate(data.inquiry.hope_date) : '-'}</span
					>
				</div>
				<div>
					<span class="font-bold text-sub">현장 주소</span>
					<span class="ml-2 font-bold text-ink">{data.inquiry.site_address ?? '-'}</span>
				</div>
			</div>
		{/if}

		<div class="rounded-lg bg-bg p-4 text-[14.5px] leading-relaxed whitespace-pre-wrap text-ink">
			{data.inquiry.content}
		</div>
	</div>

	<div class="rounded-xl border border-line bg-surface p-6 lg:sticky lg:top-4">
		<h3 class="mb-4 text-[16px] font-black text-ink">답변 작성</h3>

		{#if form?.message}
			<p
				role="alert"
				class="mb-3 rounded-lg border border-line-2 bg-status-preparing-bg px-4 py-3 text-[14px] font-semibold text-phone-price"
			>
				{form.message}
			</p>
		{/if}

		<form
			method="POST"
			action="?/answer"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="flex flex-col gap-4"
		>
			<label for="answer-content" class="sr-only">답변 내용</label>
			<textarea
				id="answer-content"
				name="answer"
				rows="7"
				required
				placeholder="고객 문의에 대한 답변을 입력하세요."
				value={form?.answer ?? data.inquiry.answer ?? ''}
				class="w-full resize-y rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
			></textarea>
			<button
				type="submit"
				disabled={submitting}
				class="min-h-12 rounded-lg bg-navy text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
			>
				{submitting
					? '저장 중…'
					: data.inquiry.status === 'answered'
						? '답변 수정하기'
						: '답변 완료 처리'}
			</button>
		</form>
	</div>
</div>
