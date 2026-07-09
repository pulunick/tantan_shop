<script lang="ts">
	/**
	 * 회원탈퇴 확인 UI. 제출 시 actions.withdraw 가 처리한다.
	 * 주문 이력이 없으면 계정 완전삭제, 있으면 익명화 탈퇴(개인정보 비식별화 + 로그인 차단).
	 */
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let agreed = $state(false);
	let submitting = $state(false);
</script>

<svelte:head>
	<title>회원 탈퇴 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-5 text-[22px] font-black tracking-tight text-ink">회원 탈퇴</h1>

<div class="max-w-[560px] rounded-xl border border-line bg-surface p-6">
	<div
		class="mb-5 rounded-lg border border-status-cancelled-fg/30 bg-status-cancelled-bg px-4 py-4 text-[14px] leading-relaxed text-status-cancelled-fg"
	>
		<p class="mb-2 font-extrabold">탈퇴 전 꼭 확인해 주세요.</p>
		<ul class="list-disc space-y-1 pl-5">
			<li>탈퇴 시 계정 정보 및 개인화 데이터는 더 이상 이용할 수 없습니다.</li>
			<li>주문·결제 기록은 관련 법령에 따른 보존 기간 동안 보관될 수 있습니다.</li>
			<li>탈퇴 후에는 동일 계정으로 복구할 수 없습니다.</li>
		</ul>
	</div>

	{#if form?.message}
		<p
			class="mb-5 rounded-lg bg-status-cancelled-bg px-4 py-3 text-[14px] font-semibold text-status-cancelled-fg"
			role="alert"
		>
			{form.message}
		</p>
	{/if}

	<form
		method="POST"
		action="?/withdraw"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<label class="mb-5 flex items-start gap-3">
			<input
				type="checkbox"
				name="agree"
				bind:checked={agreed}
				class="mt-1 h-5 w-5 accent-navy"
				required
			/>
			<span class="text-[14.5px] leading-relaxed text-ink">
				위 유의사항을 모두 확인했으며, 회원 탈퇴에 동의합니다.
			</span>
		</label>

		<button
			type="submit"
			disabled={!agreed || submitting}
			class="min-h-11 w-full rounded-[10px] border-2 border-status-cancelled-fg py-[15px] text-[16px] font-extrabold text-status-cancelled-fg hover:bg-status-cancelled-bg disabled:cursor-not-allowed disabled:border-line-2 disabled:text-sub disabled:hover:bg-transparent"
		>
			{submitting ? '처리 중…' : '회원 탈퇴하기'}
		</button>
	</form>
</div>
