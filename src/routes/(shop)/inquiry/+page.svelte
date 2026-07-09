<script lang="ts">
	/**
	 * 문의하기 — 단일 폼 (일반/견적/예약). 예약 유형만 희망일·현장주소를 추가로 받는다.
	 * 비회원은 이름/연락처/비밀번호(비밀글 확인용)를 추가로 입력한다.
	 * 제출 시 서버 액션이 inquiries 에 insert 하며, 비회원 비밀번호는 scrypt 로 해시한다.
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import type { InquiryType } from './+page.server';

	let { data, form }: PageProps = $props();

	// 쓰기 가능한 $derived: 셀렉트에서 직접 바꿀 수 있고, ?type= 쿼리(=data.presetType)가
	// 바뀌면(다른 CTA로 재진입) 자동으로 다시 그 값을 따라간다.
	let type: InquiryType = $derived(data.presetType);

	let isSecret = $state(false);
	let submitting = $state(false);

	let showReservationFields = $derived(type === 'reservation');

	const typeOptions: { value: InquiryType; label: string }[] = [
		{ value: 'general', label: '일반문의' },
		{ value: 'quote', label: '견적문의' },
		{ value: 'reservation', label: '시공 예약 문의' }
	];
</script>

<svelte:head>
	<title>문의하기 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto max-w-[760px]">
	<div class="mb-1 text-[13px] font-semibold text-sub">
		<a href={resolve('/')} class="hover:text-navy">홈</a>
		<span aria-hidden="true">›</span>
		<span class="text-navy">문의하기</span>
	</div>

	<div class="mb-7">
		<div class="mb-3 h-1 w-[38px] rounded-full bg-yellow"></div>
		<h1 class="text-[27px] font-black tracking-tight text-ink">문의하기</h1>
		<p class="mt-2 text-[15px] text-sub">
			제품 · 견적 · 시공 관련 문의를 남겨 주세요. 빠르게 답변드립니다.
		</p>
	</div>

	{#if form?.success}
		<div role="status" class="rounded-xl border border-line bg-surface p-10 text-center">
			<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-tint">
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-navy"
					aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg
				>
			</div>
			<h2 class="mt-4 text-[20px] font-black text-ink">문의가 접수되었습니다</h2>
			<p class="mt-2 text-[15px] leading-relaxed text-sub">
				빠르게 확인 후 답변드리겠습니다.{!data.isLoggedIn
					? ' 비회원 문의는 등록하신 비밀번호로 답변을 확인할 수 있습니다.'
					: ''}
			</p>
			<a
				href={resolve('/')}
				class="mt-6 inline-block min-h-11 rounded-lg bg-navy px-6 py-3 text-[15px] font-extrabold text-white"
				>홈으로</a
			>
		</div>
	{:else}
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="flex flex-col gap-5 rounded-xl border border-line bg-surface p-7"
		>
			{#if form?.message}
				<p
					role="alert"
					class="rounded-lg border border-line-2 bg-status-preparing-bg px-4 py-3 text-[14.5px] font-semibold text-phone-price"
				>
					{form.message}
				</p>
			{/if}

			<div>
				<label for="inquiry-type" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
					>문의 유형</label
				>
				<select
					id="inquiry-type"
					name="type"
					bind:value={type}
					class="w-full rounded-[9px] border border-line-2 bg-surface px-[14px] py-[13px] text-[15px] font-semibold text-ink focus:ring-2 focus:ring-navy focus:outline-none"
				>
					{#each typeOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>

			{#if showReservationFields}
				<div class="flex flex-col gap-4 rounded-[10px] border border-line-2 bg-bg p-4 sm:flex-row">
					<div class="flex-1">
						<label for="hope-date" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
							>희망 시공일</label
						>
						<input
							id="hope-date"
							name="hope_date"
							type="date"
							required
							class="w-full rounded-[9px] border border-line-2 bg-surface px-[14px] py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
						/>
					</div>
					<div class="flex-[1.4]">
						<label for="site-address" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
							>현장 주소</label
						>
						<input
							id="site-address"
							name="site_address"
							type="text"
							placeholder="시공 현장 주소를 입력하세요"
							required
							class="w-full rounded-[9px] border border-line-2 bg-surface px-[14px] py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
						/>
					</div>
				</div>
			{/if}

			{#if !data.isLoggedIn}
				<div class="flex flex-col gap-4 sm:flex-row">
					<div class="flex-1">
						<label for="guest-name" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
							>이름</label
						>
						<input
							id="guest-name"
							name="guest_name"
							type="text"
							placeholder="이름"
							required
							class="w-full rounded-[9px] border border-line-2 bg-surface px-[14px] py-[13px] text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
						/>
					</div>
					<div class="flex-1">
						<label for="guest-phone" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
							>연락처</label
						>
						<input
							id="guest-phone"
							name="guest_phone"
							type="tel"
							placeholder="010-0000-0000"
							required
							class="w-full rounded-[9px] border border-line-2 bg-surface px-[14px] py-[13px] text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
						/>
					</div>
				</div>
				<div>
					<label for="guest-password" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
						>비밀번호</label
					>
					<input
						id="guest-password"
						name="guest_password"
						type="password"
						placeholder="답변 확인용 비밀번호"
						required
						minlength="4"
						class="w-full max-w-[260px] rounded-[9px] border border-line-2 bg-surface px-[14px] py-[13px] text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
					/>
					<p class="mt-[6px] text-[13px] text-sub">
						비회원 문의는 이 비밀번호로 답변을 확인합니다.
					</p>
				</div>
			{/if}

			<div>
				<label for="inquiry-title" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
					>제목</label
				>
				<input
					id="inquiry-title"
					name="title"
					type="text"
					placeholder="문의 제목"
					required
					class="w-full rounded-[9px] border border-line-2 bg-surface px-[14px] py-[13px] text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
				/>
			</div>

			<div>
				<label for="inquiry-content" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
					>내용</label
				>
				<textarea
					id="inquiry-content"
					name="content"
					rows="5"
					required
					placeholder="문의하실 내용을 입력하세요. (제품명 · 규격 · 수량 · 현장 상황 등을 남겨 주시면 정확한 안내가 가능합니다.)"
					class="w-full resize-y rounded-[9px] border border-line-2 bg-surface px-[14px] py-[13px] text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
				></textarea>
			</div>

			<div>
				<label for="inquiry-file" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
					>파일 첨부</label
				>
				<div
					class="rounded-[10px] border-[1.5px] border-dashed border-line-2 bg-bg px-5 py-[22px] text-center"
				>
					<label
						for="inquiry-file"
						class="flex cursor-pointer flex-col items-center gap-2 text-[14px] font-semibold text-sub"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
						</svg>
						현장 사진 · 도면 등을 첨부하세요 (JPG, PNG, PDF)
					</label>
					<input
						id="inquiry-file"
						name="attachment"
						type="file"
						accept=".jpg,.jpeg,.png,.pdf"
						class="sr-only"
					/>
				</div>
			</div>

			<label
				class="flex min-h-11 cursor-pointer items-center gap-[9px] text-[14.5px] font-bold text-ink"
			>
				<input
					type="checkbox"
					name="is_secret"
					value="true"
					bind:checked={isSecret}
					class="h-[18px] w-[18px] accent-navy"
				/>
				비밀글로 문의하기
			</label>

			<button
				type="submit"
				disabled={submitting}
				class="mt-1 min-h-11 rounded-[10px] bg-navy py-[15px] text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
			>
				{submitting ? '등록 중…' : '문의 등록하기'}
			</button>
		</form>
	{/if}
</div>
