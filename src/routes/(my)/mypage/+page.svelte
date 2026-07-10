<script lang="ts">
	/** 마이페이지 개요 — 요약 카드(인사말 + 진행중 주문 배지) + 바로가기 + 최근 주문 3건. */
	import { resolve } from '$app/paths';
	import { formatDate, formatPrice } from '$lib/utils/format';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const quickLinks = [
		{ href: '/mypage/orders', label: '주문내역' },
		{ href: '/mypage/addresses', label: '배송지' },
		{ href: '/mypage/profile', label: '정보수정' },
		{ href: '/mypage/inquiries', label: '내 문의' }
	] as const;
</script>

<svelte:head>
	<title>마이페이지 - 탄탄 편의시설</title>
</svelte:head>

<section
	class="flex flex-wrap items-center justify-between gap-[18px] rounded-2xl bg-navy px-[26px] py-6 shadow-[0_6px_20px_rgba(31,56,100,.18)]"
>
	<div>
		<h1 class="text-[24px] font-black tracking-[-0.8px] text-white">
			{data.profileName ? `${data.profileName} 님, 안녕하세요` : '안녕하세요'}
		</h1>
		<p class="mt-1.5 text-[14px] font-semibold text-[#B9C4DC]">
			탄탄 편의시설을 이용해 주셔서 감사합니다.
		</p>
	</div>
	<div
		class="flex items-center gap-3 rounded-xl border border-white/[.18] bg-white/10 px-[18px] py-3"
	>
		<span class="flex flex-col leading-tight">
			<span class="text-[12px] font-bold text-[#B9C4DC]">진행 중 주문</span>
			<span class="mt-0.5 text-[15px] font-extrabold text-white">배송·준비 중</span>
		</span>
		<span
			class="flex h-[34px] min-w-[34px] items-center justify-center rounded-[10px] bg-yellow px-2.5 text-[18px] font-black text-navy"
		>
			{data.inProgressCount}
		</span>
	</div>
</section>

<div class="mt-5 grid grid-cols-2 gap-3 tb:grid-cols-4">
	{#each quickLinks as link (link.href)}
		<a
			href={resolve(link.href)}
			class="flex min-h-11 items-center justify-center rounded-[14px] border border-line bg-surface px-3 py-4 text-center text-[15px] font-extrabold text-navy shadow-[0_3px_12px_rgba(20,27,43,.04)] hover:bg-navy-tint"
		>
			{link.label}
		</a>
	{/each}
</div>

<div class="mt-8">
	<div class="mb-3 flex items-baseline justify-between">
		<h2 class="text-[18px] font-black text-ink">최근 주문</h2>
		<a href={resolve('/mypage/orders')} class="text-[13.5px] font-bold text-sub hover:text-navy">
			전체보기 →
		</a>
	</div>

	{#if data.recentOrders.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-line bg-surface px-6 py-14 text-center shadow-[0_3px_12px_rgba(20,27,43,.04)]"
		>
			<p class="text-[15px] font-bold text-ink">아직 주문 내역이 없습니다.</p>
			<a href={resolve('/products')} class="text-[14px] font-bold text-navy hover:underline">
				상품 둘러보기
			</a>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.recentOrders as order (order.id)}
				<li>
					<a
						href={resolve('/(my)/mypage/orders/[id]', { id: order.id })}
						class="block rounded-[14px] border border-line bg-surface p-5 shadow-[0_3px_12px_rgba(20,27,43,.04)] hover:border-navy"
					>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<span class="text-[13.5px] font-bold text-sub">
								주문번호 <span class="text-navy">{order.order_no}</span> · {formatDate(
									order.created_at
								)}
							</span>
							<StatusPill status={order.order_status} />
						</div>
						<div class="mt-2 flex items-baseline justify-between gap-3">
							<span class="min-w-0 truncate text-[15px] font-semibold text-ink"
								>{order.itemSummary}</span
							>
							<span class="shrink-0 text-[16px] font-black text-navy"
								>{formatPrice(order.total_amount)}</span
							>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
