<script lang="ts">
	import { SUPPORT_TEL } from '$lib/constants';
	import { formatDate } from '$lib/utils/format';
	/**
	 * 비회원 문의 조회 — 이름 + 비밀번호로 서버(scrypt 검증)를 거쳐 문의/답변을 확인한다.
	 * 성공 시 폼 대신 결과 카드를 보여준다. 일치 건이 여러 개면 최신순으로 모두 나열한다.
	 * ⚠️ 실제 상태(답변완료/대기)는 서버 데이터(status)로만 분기한다. 시안의 세그먼트 토글은 미구현.
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const PHONE_TEL = SUPPORT_TEL;

	let submitting = $state(false);
</script>

<svelte:head>
	<title>비회원 문의 조회 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto max-w-[560px]">
	<div class="mb-6 text-center">
		<h1 class="text-[26px] font-black tracking-tight text-ink">비회원 문의 조회</h1>
		<p class="mt-2 text-[15px] leading-relaxed font-semibold text-sub">
			문의 작성 시 입력하신 이름과 비밀번호를 입력하시면<br />
			문의 내용과 답변을 확인하실 수 있습니다.
		</p>
	</div>

	{#if form?.results}
		<!-- 조회 성공: 결과 카드 (일치 건 전체를 최신순으로) -->
		<div class="flex flex-col gap-5">
			{#each form.results as item (item.id)}
				<section
					class="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_6px_20px_rgba(20,27,43,0.06)]"
				>
					<div class="border-b border-line px-6 py-5">
						<div class="mb-[10px] flex items-center gap-2">
							{#if item.status === 'answered'}
								<span
									class="rounded-md bg-status-delivered-bg px-[10px] py-1 text-[12px] font-extrabold text-status-delivered-fg"
									>답변 완료</span
								>
							{:else}
								<span
									class="rounded-md bg-status-preparing-bg px-[10px] py-1 text-[12px] font-extrabold text-phone-price"
									>답변 대기</span
								>
							{/if}
							<span class="text-[13px] font-semibold text-sub">{formatDate(item.created_at)}</span>
						</div>
						<h2 class="text-[18px] leading-snug font-extrabold tracking-tight text-ink">
							{item.title}
						</h2>
						<p class="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap text-ink/85">
							{item.content}
						</p>
					</div>

					{#if item.status === 'answered' && item.answer}
						<!-- 관리자 답변 블록 -->
						<div class="bg-[#fbfcfe] px-6 py-5">
							<div class="mb-[10px] flex items-center gap-2">
								<span
									class="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-navy text-[12px] font-black text-white"
									aria-hidden="true">탄탄</span
								>
								<span class="text-[14.5px] font-extrabold text-navy">관리자 답변</span>
								{#if item.answered_at}
									<span class="text-[13px] font-semibold text-sub"
										>{formatDate(item.answered_at)}</span
									>
								{/if}
							</div>
							<p class="text-[15px] leading-relaxed whitespace-pre-wrap text-ink/85">
								{item.answer}
							</p>
						</div>
					{:else}
						<!-- 답변 대기 안내 -->
						<div class="flex items-center gap-[11px] bg-[#fbfcfe] px-6 py-5">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="shrink-0 text-phone-price"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="9" />
								<path d="M12 7v5l3 2" />
							</svg>
							<p class="text-[15px] leading-relaxed font-bold text-phone-price">
								답변을 준비하고 있습니다. 영업시간(평일 09~18시) 내에 순차적으로 답변드립니다.
							</p>
						</div>
					{/if}
				</section>
			{/each}

			<a
				href={resolve('/inquiry/check')}
				data-sveltekit-reload
				class="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line-2 bg-surface py-[13px] text-[15px] font-bold text-sub hover:bg-bg"
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
					aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
				>
				다른 문의 조회하기
			</a>
		</div>
	{:else}
		<!-- 조회 폼 -->
		<section
			class="rounded-2xl border border-line bg-surface p-7 shadow-[0_6px_20px_rgba(20,27,43,0.06)]"
		>
			{#if form?.message}
				<p
					role="alert"
					class="mb-5 rounded-lg border border-line-2 bg-status-preparing-bg px-4 py-3 text-[14.5px] font-semibold text-phone-price"
				>
					{form.message}
				</p>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<div class="mb-4">
					<label for="check-name" class="mb-2 block text-[14px] font-extrabold text-ink">이름</label
					>
					<input
						id="check-name"
						name="name"
						type="text"
						required
						value={form?.name ?? ''}
						placeholder="문의 작성 시 입력한 이름"
						class="w-full rounded-[10px] border border-line-2 bg-surface px-[15px] py-[14px] text-[16px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
					/>
				</div>
				<div class="mb-[22px]">
					<label for="check-password" class="mb-2 block text-[14px] font-extrabold text-ink"
						>비밀번호</label
					>
					<input
						id="check-password"
						name="password"
						type="password"
						required
						placeholder="문의 작성 시 설정한 비밀번호"
						class="w-full rounded-[10px] border border-line-2 bg-surface px-[15px] py-[14px] text-[16px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
					/>
				</div>
				<button
					type="submit"
					disabled={submitting}
					class="min-h-11 w-full rounded-[11px] bg-navy py-4 text-[17px] font-extrabold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
				>
					{submitting ? '조회 중…' : '문의 조회하기'}
				</button>
			</form>

			<p class="mt-[18px] text-center text-[14px] font-semibold text-sub">
				비밀번호를 잊으셨나요? 전화 주시면 확인해 드립니다
				<a href="tel:{PHONE_TEL}" class="font-extrabold text-navy">{PHONE_TEL}</a>
			</p>
		</section>
	{/if}
</div>
