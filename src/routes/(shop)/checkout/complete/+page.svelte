<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatPrice } from '$lib/utils/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const order = $derived(data.order);
	const bank = $derived(data.bank);
</script>

<svelte:head><title>주문 완료 - 탄탄 편의시설</title></svelte:head>

<div class="mx-auto max-w-[560px] py-12 text-center">
	<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy-tint">
		<svg
			width="32"
			height="32"
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
	<h1 class="mt-5 text-[26px] font-black tracking-tight text-navy">주문이 접수되었습니다</h1>
	<p class="mt-2 text-[15px] text-sub">입금이 확인되면 배송이 시작됩니다.</p>

	<div class="mt-7 rounded-xl border border-line bg-surface p-6 text-left">
		<div class="flex justify-between border-b border-line pb-3">
			<span class="text-[14px] font-bold text-sub">주문번호</span>
			<span class="text-[15px] font-black text-ink">{order.order_no}</span>
		</div>
		<div class="flex justify-between py-3">
			<span class="text-[14px] font-bold text-sub">결제 금액</span>
			<span class="text-[18px] font-black text-navy">{formatPrice(order.total_amount)}</span>
		</div>
		<div class="rounded-lg bg-navy-tint px-4 py-3 text-[14px] leading-relaxed text-ink">
			<p class="font-bold">무통장입금 안내</p>
			{#if bank?.bank || bank?.number}
				<p class="mt-1">입금계좌: <b>{bank.bank} {bank.number}</b> (예금주 {bank.holder})</p>
			{/if}
			<p class="mt-1">입금자명: <b>{order.depositor_name}</b></p>
			<p class="mt-1 text-sub">주문 후 3일 내 미입금 시 자동 취소될 수 있습니다.</p>
		</div>
	</div>

	<div class="mt-6 flex justify-center gap-3">
		<a
			href={resolve('/mypage/orders')}
			class="min-h-11 rounded-lg bg-navy px-6 py-3 text-[15px] font-extrabold text-white"
			>주문 내역 보기</a
		>
		<a
			href={resolve('/products')}
			class="min-h-11 rounded-lg border-2 border-navy px-6 py-3 text-[15px] font-extrabold text-navy"
			>쇼핑 계속하기</a
		>
	</div>
</div>
