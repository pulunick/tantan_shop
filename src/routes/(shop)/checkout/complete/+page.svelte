<script lang="ts">
	import { SUPPORT_TEL } from '$lib/constants';
	/**
	 * 주문완료 — 시안 [9]-(1) 무통장 강화판. 계좌/금액은 화면의 주인공.
	 * 계좌 복사: clipboard + svelte-sonner 토스트. 표시 데이터는 서버 load(주문·site_settings) 그대로.
	 */
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	import type { PageProps } from './$types';

	const PHONE_TEL = SUPPORT_TEL;

	let { data }: PageProps = $props();
	const order = $derived(data.order);
	const bank = $derived(data.bank);
</script>

<svelte:head><title>주문 완료 - 탄탄 편의시설</title></svelte:head>

<div class="mx-auto max-w-[720px] py-10">
	<div class="mb-7 text-center">
		<span
			class="ttpop-check inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-status-delivered-bg"
		>
			<svg
				width="38"
				height="38"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-status-delivered-fg"
				aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg
			>
		</span>
		<h1 class="mt-[18px] mb-2 text-[27px] font-black tracking-tight text-ink">
			주문이 정상 접수되었습니다
		</h1>
		<p class="text-[16px] font-semibold text-sub">
			주문번호 <b class="font-mono tracking-wide text-navy">{order.order_no}</b>
		</p>
	</div>

	<!-- 입금 안내 카드 — 화면의 주인공 -->
	<section
		class="overflow-hidden rounded-[14px] border-2 border-navy bg-surface shadow-[0_10px_30px_rgba(20,27,43,.09)]"
	>
		<div class="flex items-center gap-[10px] bg-navy px-6 py-[15px] text-white">
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.9"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-yellow"
				aria-hidden="true"
			>
				<rect x="3" y="6" width="18" height="13" rx="2" />
				<path d="M3 10h18" />
			</svg>
			<span class="text-[17px] font-black tracking-tight whitespace-nowrap">무통장 입금 안내</span>
		</div>

		<div class="px-6 pt-[26px] pb-6">
			<div class="mb-[22px] text-center">
				<div class="mb-[6px] text-[14px] font-bold text-sub">입금하실 금액</div>
				<div class="text-[40px] leading-none font-black tracking-tight text-navy">
					{order.total_amount.toLocaleString('ko-KR')}<span class="ml-[2px] text-[24px]">원</span>
				</div>
			</div>

			<div class="overflow-hidden rounded-xl border border-line">
				{#if bank?.bank}
					<div class="flex items-center justify-between border-b border-line-2 px-[18px] py-[15px]">
						<span class="text-[14px] font-bold text-sub">입금 은행</span>
						<span class="text-[16px] font-extrabold text-ink">{bank.bank}</span>
					</div>
				{/if}
				{#if bank?.number}
					<div
						class="flex items-center justify-between gap-3 border-b border-line-2 px-[18px] py-[15px]"
					>
						<span class="shrink-0 text-[14px] font-bold text-sub">계좌번호</span>
						<div class="flex flex-wrap items-center justify-end gap-[10px]">
							<span class="font-mono text-[18px] font-black tracking-wide text-ink"
								>{bank.number}</span
							>
							<CopyButton
								value={bank.number.replace(/\D/g, '')}
								successMessage="계좌번호가 복사되었습니다"
							/>
						</div>
					</div>
				{/if}
				{#if bank?.holder}
					<div class="flex items-center justify-between border-b border-line-2 px-[18px] py-[15px]">
						<span class="text-[14px] font-bold text-sub">예금주</span>
						<span class="text-[16px] font-extrabold text-ink">{bank.holder}</span>
					</div>
				{/if}
				<div class="flex items-center justify-between bg-[#fbfcfe] px-[18px] py-[15px]">
					<span class="text-[14px] font-bold text-sub">입금자명</span>
					<span class="text-[16px] font-extrabold text-ink">{order.depositor_name}</span>
				</div>
			</div>

			<div class="mt-[18px] flex items-start gap-[11px] rounded-[10px] bg-[#FBF1D8] px-4 py-[14px]">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#8F6A00"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mt-[1px] shrink-0"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="9" />
					<path d="M12 8v5" />
					<path d="M12 16.5v.01" />
				</svg>
				<!-- 입금 기한 문구는 정책 미확정(P1+, site_settings 예정) — 확정 전까지 기한 단정 표기 금지 -->
				<p class="m-0 text-[14.5px] leading-relaxed font-bold text-[#7a5a00]">
					입금 확인 후 배송 준비가 시작됩니다. 입금 관련 문의는 아래 대표번호로 연락 주세요.
				</p>
			</div>
		</div>
	</section>

	<div class="mt-5 grid grid-cols-2 gap-3">
		<a
			href={resolve('/(my)/mypage/orders/[id]', { id: order.id })}
			class="flex min-h-11 items-center justify-center rounded-[11px] bg-navy py-4 text-[16px] font-extrabold text-white"
			>주문 상세 보기</a
		>
		<a
			href={resolve('/products')}
			class="flex min-h-11 items-center justify-center rounded-[11px] border border-navy bg-surface py-4 text-[16px] font-extrabold text-navy"
			>쇼핑 계속하기</a
		>
	</div>
	<p class="mt-5 text-center text-[14px] font-semibold text-sub">
		입금 관련 문의 <a href="tel:{PHONE_TEL}" class="font-extrabold text-ink">{PHONE_TEL}</a>
	</p>
</div>

<style>
	.ttpop-check {
		animation: ttpop 0.4s ease-out;
	}
	@keyframes ttpop {
		0% {
			transform: scale(0.6);
			opacity: 0;
		}
		60% {
			transform: scale(1.08);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ttpop-check {
			animation: none;
		}
	}
</style>
