<script lang="ts">
	/** 정보수정 — 이름/휴대폰 수정. 이메일은 읽기전용. */
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let submitting = $state(false);

	const values = $derived(form?.values ?? data.profile);
	const errors = $derived(form?.errors ?? {});
</script>

<svelte:head>
	<title>정보수정 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-5 text-[22px] font-black tracking-tight text-ink">정보수정</h1>

<div class="max-w-[520px] rounded-xl border border-line bg-surface p-6">
	{#if form?.success}
		<p
			class="mb-5 rounded-lg bg-status-delivered-bg px-4 py-3 text-[14px] font-semibold text-status-delivered-fg"
			role="status"
		>
			회원정보가 수정되었습니다.
		</p>
	{/if}
	{#if form?.message}
		<p
			class="mb-5 rounded-lg bg-status-cancelled-bg px-4 py-3 text-[14px] font-semibold text-status-cancelled-fg"
			role="alert"
		>
			{form.message}
		</p>
	{/if}

	<div class="mb-4">
		<span id="profile-email-label" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
			>이메일</span
		>
		<p
			aria-labelledby="profile-email-label"
			class="min-h-11 w-full rounded-[9px] border border-line-2 bg-bg px-3.5 py-3 text-[15px] text-sub"
		>
			{data.email ?? '-'}
		</p>
	</div>

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
		<label for="profile-name" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
			>이름</label
		>
		<input
			id="profile-name"
			name="name"
			value={values.name}
			required
			aria-invalid={errors.name ? 'true' : undefined}
			aria-describedby={errors.name ? 'profile-name-error' : undefined}
			class="mb-1 min-h-11 w-full rounded-[9px] border border-line-2 px-3.5 py-3 text-[15px] outline-none focus:border-navy"
		/>
		{#if errors.name}
			<p id="profile-name-error" class="mb-3 text-[13px] font-semibold text-status-cancelled-fg">
				{errors.name}
			</p>
		{:else}
			<div class="mb-3"></div>
		{/if}

		<label for="profile-phone" class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
			>휴대폰</label
		>
		<input
			id="profile-phone"
			name="phone"
			value={values.phone}
			inputmode="tel"
			placeholder="010-0000-0000"
			required
			aria-invalid={errors.phone ? 'true' : undefined}
			aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
			class="mb-1 min-h-11 w-full rounded-[9px] border border-line-2 px-3.5 py-3 text-[15px] outline-none focus:border-navy"
		/>
		{#if errors.phone}
			<p id="profile-phone-error" class="mb-5 text-[13px] font-semibold text-status-cancelled-fg">
				{errors.phone}
			</p>
		{:else}
			<div class="mb-5"></div>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="min-h-11 w-full rounded-[10px] bg-navy py-[15px] text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:opacity-60"
		>
			{submitting ? '저장 중…' : '저장'}
		</button>
	</form>
</div>
