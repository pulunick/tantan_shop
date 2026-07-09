<script lang="ts">
	/** 마이페이지 개요 — 인사말 + 최근 주문 3건 + 바로가기. */
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

<h1 class="text-[24px] font-black tracking-tight text-ink">
	{data.profileName ? `${data.profileName} 님, 안녕하세요` : '마이페이지'}
</h1>

<div class="mt-5 grid grid-cols-2 gap-3 tb:grid-cols-4">
	{#each quickLinks as link (link.href)}
		<a
			href={resolve(link.href)}
			class="flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-3 py-4 text-center text-[15px] font-extrabold text-navy hover:bg-navy-tint"
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
			class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-14 text-center"
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
						class="block rounded-xl border border-line bg-surface p-5 hover:border-navy"
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
