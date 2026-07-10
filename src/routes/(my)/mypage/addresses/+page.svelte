<script lang="ts">
	/**
	 * 배송지 관리 — Phase 1 에는 배송지 관리 테이블이 없어 별도 등록/수정 기능은 없다(옵션 2, decision-log 2026-07-09).
	 * 배송지는 주문/결제 시점에 입력하며, 여기서는 최근 주문에서 사용한 배송지를 읽기전용으로 안내한다.
	 * CRUD·모달·기본배송지 설정은 구현하지 않는다 — 추가/수정/삭제 버튼도 두지 않는다(죽은 버튼 금지).
	 */
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>배송지 관리 - 탄탄 편의시설</title>
</svelte:head>

<h1 class="mb-2 text-[22px] font-black tracking-tight text-ink">배송지 관리</h1>
<p class="mb-6 text-[13.5px] font-semibold text-sub">
	배송지 추가·수정·삭제는 Phase 2에서 지원할 예정입니다. 지금은 주문 시 입력한 배송지를 아래에서
	확인만 할 수 있습니다.
</p>

{#if data.addresses.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-line bg-surface px-6 py-16 text-center"
	>
		<span
			class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-bg"
			aria-hidden="true"
		>
			<svg
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#9aa4ba"
				stroke-width="1.7"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle
					cx="12"
					cy="10"
					r="2.4"
				/></svg
			>
		</span>
		<p class="text-[16.5px] font-extrabold text-ink">저장된 배송지가 없습니다.</p>
		<p class="text-[14px] font-semibold text-sub">주문 시 입력한 배송지가 여기에 표시됩니다.</p>
	</div>
{:else}
	<ul class="flex flex-col gap-3.5">
		{#each data.addresses as addr, i (addr.addr1 + '|' + addr.addr2 + '|' + i)}
			<li
				class="rounded-[14px] border border-line bg-surface p-5 shadow-[0_3px_12px_rgba(20,27,43,.04)]"
			>
				<div class="flex flex-wrap items-center gap-[9px]">
					<span class="text-[16px] font-black text-ink">{addr.receiver_name}</span>
					<span class="text-[14.5px] font-bold text-sub">{addr.receiver_phone}</span>
					<span
						class="ml-auto inline-block rounded-md bg-navy-tint px-[10px] py-1 text-[12px] font-extrabold text-navy"
					>
						최근 주문 배송지
					</span>
				</div>
				<p class="mt-2.5 text-[14.5px] leading-relaxed font-semibold text-ink">
					{#if addr.zip}<span class="mr-[5px] text-sub">[{addr.zip}]</span>{/if}
					{addr.addr1 ?? ''}
					{addr.addr2 ?? ''}
				</p>
			</li>
		{/each}
	</ul>
{/if}
