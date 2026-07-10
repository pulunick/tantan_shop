<script lang="ts">
	/**
	 * 회원탈퇴 확인 UI. 제출 시 actions.withdraw 가 처리한다(서버 로직 무변경).
	 * 이중 게이트: "탈퇴" 정확 입력 + 동의 체크가 모두 충족되어야 버튼 활성.
	 * 활성 후 native <dialog> 최종 확인 → 기존 ?/withdraw 제출.
	 */
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let confirmText = $state('');
	let agreed = $state(false);
	let submitting = $state(false);
	let dialog = $state<HTMLDialogElement | null>(null);

	// 두 게이트 모두 충족 시에만 탈퇴 진행 가능.
	const canWithdraw = $derived(confirmText.trim() === '탈퇴' && agreed);

	function openConfirm() {
		if (canWithdraw) dialog?.showModal();
	}
</script>

<svelte:head>
	<title>회원 탈퇴 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-3.5 text-[22px] font-black tracking-[-0.5px] text-ink">회원 탈퇴</h1>

<div
	class="max-w-[600px] rounded-[14px] border border-line bg-surface p-[26px] shadow-[0_3px_12px_rgba(20,27,43,.04)]"
>
	<!-- 경고 박스 -->
	<div class="mb-[22px] rounded-xl border border-[#f0d7d5] bg-status-cancelled-bg px-5 py-[18px]">
		<div class="mb-3 flex items-center gap-[9px]">
			<svg
				width="19"
				height="19"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#A3403A"
				stroke-width="2.1"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="flex-none"
				aria-hidden="true"
			>
				<path d="M12 3l9 16H3z" />
				<path d="M12 10v4" />
				<path d="M12 17v.01" />
			</svg>
			<span class="text-[15px] font-black text-status-cancelled-fg">탈퇴 전 꼭 확인해 주세요</span>
		</div>
		<ul class="list-disc space-y-1 pl-5 text-[14px] font-semibold leading-relaxed text-[#8a4b46]">
			<li>탈퇴 시 계정 정보 및 개인화 데이터는 더 이상 이용할 수 없습니다.</li>
			<li>
				<b class="text-status-cancelled-fg"
					>주문·결제 기록은 관련 법령에 따라 보존 기간 동안 안전하게 보관</b
				>됩니다.
			</li>
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
		<p class="mb-2 text-[14px] font-bold text-[#3a4252]">
			확인을 위해 아래 입력란에 <b class="text-status-cancelled-fg">탈퇴</b> 를 입력해 주세요.
		</p>
		<input
			bind:value={confirmText}
			placeholder="탈퇴"
			aria-label="확인 문구 입력"
			class="mb-4 min-h-12 w-full max-w-[240px] rounded-[10px] border border-line-2 px-3.5 text-[15px] outline-none focus:border-status-cancelled-fg"
		/>

		<label class="mb-[22px] flex cursor-pointer items-start gap-[11px]">
			<input
				type="checkbox"
				name="agree"
				bind:checked={agreed}
				class="mt-0.5 h-5 w-5 flex-none accent-[#A3403A]"
			/>
			<span class="text-[14.5px] font-semibold leading-relaxed text-[#3a4252]">
				위 유의사항을 모두 확인했으며, 회원 탈퇴에 동의합니다.
			</span>
		</label>

		<button
			type="button"
			onclick={openConfirm}
			disabled={!canWithdraw || submitting}
			class="min-h-[50px] w-full max-w-[280px] rounded-[11px] border-[1.5px] border-status-cancelled-fg bg-surface text-[15px] font-extrabold text-status-cancelled-fg hover:bg-status-cancelled-bg disabled:cursor-not-allowed disabled:border-line-2 disabled:text-sub disabled:hover:bg-surface"
		>
			{submitting ? '처리 중…' : '회원 탈퇴하기'}
		</button>

		<!-- 최종 확인 다이얼로그 -->
		<!-- m-auto 필수: Tailwind preflight 가 dialog 기본 margin 을 제거해 없으면 좌상단에 붙는다 -->
		<dialog
			bind:this={dialog}
			class="m-auto w-[400px] max-w-[calc(100%-40px)] rounded-2xl border-none p-0 shadow-[0_20px_50px_rgba(0,0,0,.32)] backdrop:bg-[rgba(10,15,25,.55)]"
		>
			<div class="p-7">
				<span
					class="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-status-cancelled-bg"
				>
					<svg
						width="26"
						height="26"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#A3403A"
						stroke-width="2.1"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 3l9 16H3z" />
						<path d="M12 10v4" />
						<path d="M12 17v.01" />
					</svg>
				</span>
				<h2 class="mb-2.5 text-center text-[19px] font-black text-ink">정말 탈퇴하시겠습니까?</h2>
				<p class="mb-[22px] text-center text-[14.5px] font-semibold leading-relaxed text-sub">
					탈퇴 후에는 계정을 복구할 수 없습니다. 주문·결제 기록은 법령에 따라 보존됩니다.
				</p>
				<div class="grid grid-cols-2 gap-2.5">
					<button
						type="button"
						onclick={() => dialog?.close()}
						class="min-h-11 rounded-[10px] border border-[#d4d9e0] bg-surface text-[15px] font-extrabold text-[#3a4252]"
					>
						돌아가기
					</button>
					<button
						type="submit"
						disabled={!canWithdraw || submitting}
						class="min-h-11 rounded-[10px] bg-status-cancelled-fg text-[15px] font-extrabold text-white disabled:opacity-60"
					>
						탈퇴하기
					</button>
				</div>
			</div>
		</dialog>
	</form>
</div>
