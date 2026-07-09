<script lang="ts">
	/**
	 * 비밀번호 재설정 요청. 이메일 존재 여부를 노출하지 않기 위해 성공/실패 모두 중립적인 안내만 보여준다
	 * (단, 이메일 형식 자체가 잘못된 입력값 검증 오류는 예외적으로 표시).
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>비밀번호 재설정 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto mt-10 max-w-[440px] px-6 pb-16">
	<div
		class="rounded-[14px] border border-line bg-surface p-9 shadow-[0_2px_10px_rgba(20,27,43,0.05)]"
	>
		<h1 class="text-center text-[26px] font-black tracking-tight text-ink">비밀번호 재설정</h1>
		<p class="mt-1.5 mb-7 text-center text-[14.5px] text-sub">
			가입하신 이메일로 재설정 링크를 보내드립니다.
		</p>

		{#if form?.success}
			<div
				class="mb-5 rounded-[10px] border border-line-2 bg-navy-tint px-4 py-3.5 text-center text-[13.5px] leading-[1.55] font-semibold text-navy"
				role="status"
			>
				입력하신 이메일 주소로 비밀번호 재설정 안내를 보냈습니다.<br />받은편지함(또는 스팸함)을
				확인해 주세요.
			</div>
		{/if}

		{#if form?.message}
			<div
				class="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-600"
				role="alert"
				id="reset-error"
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
			<label for="reset-email" class="mb-[7px] block text-[13.5px] font-extrabold text-ink">
				이메일
			</label>
			<input
				id="reset-email"
				name="email"
				type="email"
				autocomplete="email"
				required
				placeholder="example@email.com"
				value={form?.email ?? ''}
				aria-invalid={form?.message ? 'true' : undefined}
				aria-describedby={form?.message ? 'reset-error' : undefined}
				class="mb-[22px] w-full rounded-[9px] border border-line-2 p-3.5 text-[15px] outline-none focus:border-navy"
			/>

			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-[10px] bg-navy py-[15px] text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:opacity-60"
			>
				{submitting ? '전송 중…' : '재설정 링크 보내기'}
			</button>
		</form>

		<div class="mt-[18px] flex items-center justify-center gap-[14px] text-[14px] font-semibold">
			<a href={resolve('/login')} class="text-ink hover:text-navy">로그인으로 돌아가기</a>
			<span class="text-line-2" aria-hidden="true">|</span>
			<a href={resolve('/signup')} class="text-ink hover:text-navy">회원가입</a>
		</div>
	</div>
</div>
