<script lang="ts">
	/**
	 * 회원가입. 필드 단위 에러는 +page.server.ts 의 fail(400, { errors }) 을 form prop 으로 받아 표시한다.
	 * signUp 의 options.data 로 name/phone 을 전달 → DB handle_new_user 트리거가 profiles 를 자동 생성.
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);

	function errorId(field: string) {
		return `signup-${field}-error`;
	}
</script>

<svelte:head>
	<title>회원가입 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto mt-10 max-w-[480px] px-6 pb-16">
	<div
		class="rounded-[14px] border border-line bg-surface p-9 shadow-[0_2px_10px_rgba(20,27,43,0.05)]"
	>
		<h1 class="text-center text-[26px] font-black tracking-tight text-ink">회원가입</h1>
		<p class="mt-1.5 mb-7 text-center text-[14.5px] text-sub">최소한의 정보만 받습니다.</p>

		{#if form?.message}
			<div
				class="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-600"
				role="alert"
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
					class="flex-none"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9" />
					<path d="M12 8v5M12 16.2v.1" />
				</svg>
				<span>{form.message}</span>
			</div>
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
				<label for="signup-email" class="mb-[7px] block text-[13.5px] font-extrabold text-ink">
					이메일
				</label>
				<input
					id="signup-email"
					name="email"
					type="email"
					autocomplete="email"
					required
					placeholder="example@email.com"
					value={form?.email ?? ''}
					aria-invalid={form?.errors?.email ? 'true' : undefined}
					aria-describedby={form?.errors?.email ? errorId('email') : undefined}
					class="w-full rounded-[9px] border p-3.5 text-[15px] outline-none focus:border-navy {form
						?.errors?.email
						? 'border-red-400 bg-red-50'
						: 'border-line-2'}"
				/>
				{#if form?.errors?.email}
					<p id={errorId('email')} class="mt-1.5 text-[13px] font-semibold text-red-600">
						{form.errors.email}
					</p>
				{/if}
			</div>

			<div class="mb-4">
				<label for="signup-password" class="mb-[7px] block text-[13.5px] font-extrabold text-ink">
					비밀번호
				</label>
				<input
					id="signup-password"
					name="password"
					type="password"
					autocomplete="new-password"
					required
					placeholder="8자 이상 입력"
					aria-invalid={form?.errors?.password ? 'true' : undefined}
					aria-describedby={form?.errors?.password ? errorId('password') : undefined}
					class="w-full rounded-[9px] border p-3.5 text-[15px] outline-none focus:border-navy {form
						?.errors?.password
						? 'border-red-400 bg-red-50'
						: 'border-line-2'}"
				/>
				{#if form?.errors?.password}
					<p id={errorId('password')} class="mt-1.5 text-[13px] font-semibold text-red-600">
						{form.errors.password}
					</p>
				{/if}
			</div>

			<div class="mb-4">
				<label
					for="signup-password-confirm"
					class="mb-[7px] block text-[13.5px] font-extrabold text-ink"
				>
					비밀번호 확인
				</label>
				<input
					id="signup-password-confirm"
					name="passwordConfirm"
					type="password"
					autocomplete="new-password"
					required
					placeholder="비밀번호를 다시 입력해 주세요"
					aria-invalid={form?.errors?.passwordConfirm ? 'true' : undefined}
					aria-describedby={form?.errors?.passwordConfirm ? errorId('password-confirm') : undefined}
					class="w-full rounded-[9px] border p-3.5 text-[15px] outline-none focus:border-navy {form
						?.errors?.passwordConfirm
						? 'border-red-400 bg-red-50'
						: 'border-line-2'}"
				/>
				{#if form?.errors?.passwordConfirm}
					<p
						id={errorId('password-confirm')}
						class="mt-1.5 flex items-center gap-[6px] text-[13px] font-semibold text-red-600"
					>
						<span aria-hidden="true" class="font-black">!</span>
						{form.errors.passwordConfirm}
					</p>
				{/if}
			</div>

			<div class="mb-4">
				<label for="signup-name" class="mb-[7px] block text-[13.5px] font-extrabold text-ink">
					이름
				</label>
				<input
					id="signup-name"
					name="name"
					type="text"
					autocomplete="name"
					required
					placeholder="이름"
					value={form?.name ?? ''}
					aria-invalid={form?.errors?.name ? 'true' : undefined}
					aria-describedby={form?.errors?.name ? errorId('name') : undefined}
					class="w-full rounded-[9px] border p-3.5 text-[15px] outline-none focus:border-navy {form
						?.errors?.name
						? 'border-red-400 bg-red-50'
						: 'border-line-2'}"
				/>
				{#if form?.errors?.name}
					<p id={errorId('name')} class="mt-1.5 text-[13px] font-semibold text-red-600">
						{form.errors.name}
					</p>
				{/if}
			</div>

			<div class="mb-[22px]">
				<label for="signup-phone" class="mb-[7px] block text-[13.5px] font-extrabold text-ink">
					휴대폰
				</label>
				<input
					id="signup-phone"
					name="phone"
					type="tel"
					autocomplete="tel"
					required
					placeholder="010-0000-0000"
					value={form?.phone ?? ''}
					aria-invalid={form?.errors?.phone ? 'true' : undefined}
					aria-describedby={form?.errors?.phone ? errorId('phone') : undefined}
					class="w-full rounded-[9px] border p-3.5 text-[15px] outline-none focus:border-navy {form
						?.errors?.phone
						? 'border-red-400 bg-red-50'
						: 'border-line-2'}"
				/>
				{#if form?.errors?.phone}
					<p id={errorId('phone')} class="mt-1.5 text-[13px] font-semibold text-red-600">
						{form.errors.phone}
					</p>
				{/if}
			</div>

			<div class="mb-[22px] rounded-[10px] border border-line px-[18px] py-4">
				<label class="flex cursor-pointer items-center gap-[10px] text-[14px] text-ink">
					<input
						id="signup-terms"
						name="terms"
						type="checkbox"
						required
						class="h-[19px] w-[19px] shrink-0 accent-navy"
						aria-invalid={form?.errors?.terms ? 'true' : undefined}
						aria-describedby={form?.errors?.terms ? errorId('terms') : undefined}
					/>
					<span class="break-keep">
						<span class="font-bold">(필수)</span>
						<a href={resolve('/terms')} class="font-bold text-navy underline hover:text-navy/80"
							>이용약관</a
						>
						및
						<a href={resolve('/privacy')} class="font-bold text-navy underline hover:text-navy/80"
							>개인정보처리방침</a
						>에 동의합니다
					</span>
				</label>
				{#if form?.errors?.terms}
					<p id={errorId('terms')} class="mt-2 text-[13px] font-semibold text-red-600">
						{form.errors.terms}
					</p>
				{/if}
			</div>

			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-[10px] bg-navy py-[15px] text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:opacity-60"
			>
				{submitting ? '가입 처리 중…' : '가입하기'}
			</button>
		</form>

		<div class="mt-4 text-center text-[14px] font-semibold text-sub">
			이미 회원이신가요?
			<a href={resolve('/login')} class="font-extrabold text-navy">로그인</a>
		</div>
	</div>
</div>
