<script lang="ts">
	/** 회원정보 수정 — 카드1 기본 정보(이름/휴대폰), 카드2 비밀번호 변경(신규). */
	import { enhance } from '$app/forms';
	import { formatPhoneInput } from '$lib/utils/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// 두 폼의 결과를 action 식별자로 구분해 서로의 배너를 침범하지 않게 한다.
	const profileForm = $derived(form?.action === 'profile' ? form : null);
	const pwForm = $derived(form?.action === 'password' ? form : null);

	const values = $derived(profileForm?.values ?? data.profile);
	const errors = $derived(profileForm?.errors ?? {});
	const pwErrors = $derived(pwForm?.pwErrors ?? {});

	let savingProfile = $state(false);
	let savingPassword = $state(false);

	// 비밀번호 필드는 클라이언트 로컬 상태로만 보관 (서버는 값을 되돌려주지 않음).
	let pwCurrent = $state('');
	let pwNext = $state('');
	let pwConfirm = $state('');

	const cardClass =
		'max-w-[560px] rounded-[14px] border border-line bg-surface p-[26px] shadow-[0_3px_12px_rgba(20,27,43,.04)]';
	const labelClass = 'mb-[7px] block text-[13.5px] font-extrabold text-ink';
	const inputClass =
		'min-h-12 w-full rounded-[10px] border border-line-2 px-3.5 text-[15px] outline-none focus:border-navy';
</script>

<svelte:head>
	<title>회원정보 수정 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-3.5 text-[22px] font-black tracking-[-0.5px] text-ink">회원정보 수정</h1>

<!-- 카드 1: 기본 정보 -->
<div class="{cardClass} mb-4">
	<h2 class="mb-[18px] text-[16px] font-black text-ink">기본 정보</h2>

	{#if profileForm?.success}
		<p
			class="mb-4 rounded-lg bg-status-delivered-bg px-4 py-3 text-[14px] font-semibold text-status-delivered-fg"
			role="status"
		>
			회원정보가 저장되었습니다.
		</p>
	{/if}
	{#if profileForm?.message}
		<p
			class="mb-4 rounded-lg bg-status-cancelled-bg px-4 py-3 text-[14px] font-semibold text-status-cancelled-fg"
			role="alert"
		>
			{profileForm.message}
		</p>
	{/if}

	<div class="mb-4">
		<span id="profile-email-label" class={labelClass}>이메일</span>
		<div
			aria-labelledby="profile-email-label"
			class="flex min-h-12 w-full items-center rounded-[10px] border border-line-2 bg-bg px-3.5 text-[15px] font-semibold text-sub"
		>
			{data.email ?? '-'}
		</div>
		<p class="mt-1.5 text-[12.5px] font-semibold text-sub">이메일은 변경할 수 없습니다.</p>
	</div>

	<form
		method="POST"
		action="?/profile"
		use:enhance={() => {
			savingProfile = true;
			return async ({ update }) => {
				await update();
				savingProfile = false;
			};
		}}
	>
		<div class="mb-4">
			<label for="profile-name" class={labelClass}>이름</label>
			<input
				id="profile-name"
				name="name"
				value={values.name}
				required
				aria-invalid={errors.name ? 'true' : undefined}
				aria-describedby={errors.name ? 'profile-name-error' : undefined}
				class={inputClass}
			/>
			{#if errors.name}
				<p
					id="profile-name-error"
					class="mt-1.5 text-[13px] font-semibold text-status-cancelled-fg"
				>
					{errors.name}
				</p>
			{/if}
		</div>

		<div class="mb-[22px]">
			<label for="profile-phone" class={labelClass}>휴대폰</label>
			<input
				id="profile-phone"
				name="phone"
				value={values.phone}
				inputmode="tel"
				placeholder="010-0000-0000"
				required
				oninput={(e) => (e.currentTarget.value = formatPhoneInput(e.currentTarget.value))}
				aria-invalid={errors.phone ? 'true' : undefined}
				aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
				class={inputClass}
			/>
			{#if errors.phone}
				<p
					id="profile-phone-error"
					class="mt-1.5 text-[13px] font-semibold text-status-cancelled-fg"
				>
					{errors.phone}
				</p>
			{/if}
		</div>

		<button
			type="submit"
			disabled={savingProfile}
			class="min-h-[50px] w-full rounded-[11px] bg-navy text-[16px] font-extrabold text-white hover:bg-[#28457a] disabled:opacity-60"
		>
			{savingProfile ? '저장 중…' : '기본 정보 저장'}
		</button>
	</form>
</div>

<!-- 카드 2: 비밀번호 변경 -->
<div class={cardClass}>
	<h2 class="mb-[18px] text-[16px] font-black text-ink">비밀번호 변경</h2>

	{#if pwForm?.pwSuccess}
		<p
			class="mb-4 rounded-lg bg-status-delivered-bg px-4 py-3 text-[14px] font-semibold text-status-delivered-fg"
			role="status"
		>
			비밀번호가 변경되었습니다.
		</p>
	{/if}
	{#if pwForm?.pwMessage}
		<p
			class="mb-4 rounded-lg bg-status-cancelled-bg px-4 py-3 text-[14px] font-semibold text-status-cancelled-fg"
			role="alert"
		>
			{pwForm.pwMessage}
		</p>
	{/if}

	<form
		method="POST"
		action="?/password"
		use:enhance={() => {
			savingPassword = true;
			return async ({ update, result }) => {
				// 성공 시 폼 리셋을 막고(값 유지 대상 아님) 로컬 비밀번호 필드를 직접 비운다.
				await update({ reset: false });
				savingPassword = false;
				if (result.type === 'success') {
					pwCurrent = '';
					pwNext = '';
					pwConfirm = '';
				}
			};
		}}
	>
		<div class="mb-4">
			<label for="pw-current" class={labelClass}>현재 비밀번호</label>
			<input
				id="pw-current"
				name="current"
				type="password"
				autocomplete="current-password"
				placeholder="현재 비밀번호 입력"
				bind:value={pwCurrent}
				required
				aria-invalid={pwErrors.current ? 'true' : undefined}
				aria-describedby={pwErrors.current ? 'pw-current-error' : undefined}
				class={inputClass}
			/>
			{#if pwErrors.current}
				<p id="pw-current-error" class="mt-1.5 text-[13px] font-semibold text-status-cancelled-fg">
					{pwErrors.current}
				</p>
			{/if}
		</div>

		<div class="mb-4">
			<label for="pw-next" class={labelClass}>새 비밀번호</label>
			<input
				id="pw-next"
				name="next"
				type="password"
				autocomplete="new-password"
				placeholder="8자 이상"
				bind:value={pwNext}
				required
				minlength="8"
				aria-invalid={pwErrors.next ? 'true' : undefined}
				aria-describedby={pwErrors.next ? 'pw-next-error' : undefined}
				class={inputClass}
			/>
			{#if pwErrors.next}
				<p id="pw-next-error" class="mt-1.5 text-[13px] font-semibold text-status-cancelled-fg">
					{pwErrors.next}
				</p>
			{/if}
		</div>

		<div class="mb-[22px]">
			<label for="pw-confirm" class={labelClass}>새 비밀번호 확인</label>
			<input
				id="pw-confirm"
				name="confirm"
				type="password"
				autocomplete="new-password"
				placeholder="새 비밀번호 다시 입력"
				bind:value={pwConfirm}
				required
				aria-invalid={pwErrors.confirm ? 'true' : undefined}
				aria-describedby={pwErrors.confirm ? 'pw-confirm-error' : undefined}
				class={inputClass}
			/>
			{#if pwErrors.confirm}
				<p id="pw-confirm-error" class="mt-1.5 text-[13px] font-semibold text-status-cancelled-fg">
					{pwErrors.confirm}
				</p>
			{/if}
		</div>

		<button
			type="submit"
			disabled={savingPassword}
			class="min-h-[50px] w-full rounded-[11px] border border-navy bg-surface text-[16px] font-extrabold text-navy hover:bg-navy-tint disabled:opacity-60"
		>
			{savingPassword ? '변경 중…' : '비밀번호 변경'}
		</button>
	</form>
</div>
