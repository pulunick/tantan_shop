<script lang="ts">
	/**
	 * 배송지 관리 — Phase 1 에는 배송지 관리 테이블이 없어 별도 등록/수정 기능은 없다.
	 * 배송지는 주문/결제 시점에 입력하며, 여기서는 최근 주문에서 사용한 배송지를 읽기전용으로 안내한다.
	 */
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>배송지 관리 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-5 text-[22px] font-black tracking-tight text-ink">배송지 관리</h1>

<div class="mb-6 rounded-xl border border-line-2 bg-navy-tint px-5 py-4 text-[14px] text-navy">
	배송지는 별도로 등록하지 않고, 주문 시 주문/결제 화면에서 직접 입력합니다. 아래는 최근 주문에서
	사용한 배송지 목록(읽기전용)입니다.
</div>

{#if data.addresses.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-16 text-center"
	>
		<p class="text-[15px] font-bold text-ink">최근 주문에서 사용한 배송지가 없습니다.</p>
		<a href={resolve('/products')} class="mt-1 text-[14px] font-bold text-navy hover:underline">
			상품 둘러보기
		</a>
	</div>
{:else}
	<ul class="flex flex-col gap-3">
		{#each data.addresses as addr, i (addr.addr1 + '|' + addr.addr2 + '|' + i)}
			<li class="rounded-xl border border-line bg-surface p-5 text-[14.5px]">
				<p class="font-bold text-ink">{addr.receiver_name} · {addr.receiver_phone}</p>
				<p class="mt-1 text-ink">
					{#if addr.zip}<span class="mr-1 text-sub">[{addr.zip}]</span>{/if}
					{addr.addr1 ?? ''}
					{addr.addr2 ?? ''}
				</p>
			</li>
		{/each}
	</ul>
{/if}
