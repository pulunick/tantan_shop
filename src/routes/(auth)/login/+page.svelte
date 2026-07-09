<script lang="ts">
	/**
	 * 로그인. 이미 로그인된 유저는 +page.server.ts load 에서 redirect 처리.
	 * form action 실패 시 fail(400, { email, message }) 을 받아 인라인 에러로 표시한다.
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>로그인 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto mt-10 max-w-[440px] px-6 pb-16">
	<div
		class="rounded-[14px] border border-line bg-surface p-9 shadow-[0_2px_10px_rgba(20,27,43,0.05)]"
	>
		<h1 class="text-center text-[26px] font-black tracking-tight text-ink">로그인</h1>
		<p class="mt-1.5 mb-7 text-center text-[14.5px] text-sub">
			탄탄 편의시설에 오신 것을 환영합니다.
		</p>

		{#if data.registered}
			<div
				class="mb-5 rounded-[10px] border border-line-2 bg-navy-tint px-4 py-3 text-center text-[13.5px] font-semibold text-navy"
				role="status"
			>
				회원가입이 완료되었습니다. 이메일 인증이 필요한 경우 받은편지함을 확인해 주세요.
			</div>
		{/if}

		{#if form?.message}
			<div
				class="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-600"
				role="alert"
				id="login-error"
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
			<label for="login-email" class="mb-[7px] block text-[13.5px] font-extrabold text-ink">
				이메일
			</label>
			<input
				id="login-email"
				name="email"
				type="email"
				autocomplete="email"
				required
				placeholder="example@email.com"
				value={form?.email ?? ''}
				aria-invalid={form?.message ? 'true' : undefined}
				aria-describedby={form?.message ? 'login-error' : undefined}
				class="mb-4 w-full rounded-[9px] border border-line-2 p-3.5 text-[15px] outline-none focus:border-navy"
			/>

			<label for="login-password" class="mb-[7px] block text-[13.5px] font-extrabold text-ink">
				비밀번호
			</label>
			<input
				id="login-password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				placeholder="비밀번호"
				aria-invalid={form?.message ? 'true' : undefined}
				aria-describedby={form?.message ? 'login-error' : undefined}
				class="mb-[22px] w-full rounded-[9px] border border-line-2 p-3.5 text-[15px] outline-none focus:border-navy"
			/>

			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-[10px] bg-navy py-[15px] text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:opacity-60"
			>
				{submitting ? '로그인 중…' : '로그인'}
			</button>
		</form>

		<div class="mt-[18px] flex items-center justify-center gap-[14px] text-[14px] font-semibold">
			<a href={resolve('/signup')} class="text-ink hover:text-navy">회원가입</a>
			<span class="text-line-2" aria-hidden="true">|</span>
			<a href={resolve('/reset-password')} class="text-ink hover:text-navy">비밀번호 찾기</a>
		</div>

		<div
			class="mt-6 rounded-[10px] bg-navy-tint px-4 py-3.5 text-center text-[13.5px] leading-[1.55] font-semibold text-navy"
		>
			회원가입 없이 상품은 자유롭게 둘러볼 수 있습니다.<br />구매·주문 시에만 로그인이 필요합니다.
		</div>
	</div>
</div>
