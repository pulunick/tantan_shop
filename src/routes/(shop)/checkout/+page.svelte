<script lang="ts">
	/** 주문/결제 — 배송지 + 무통장입금(입금자명) + 약관 동의. 금액은 서버에서 재계산된다. */
	import { enhance } from '$app/forms';
	import { formatPrice } from '$lib/utils/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	const v = $derived(
		form?.values ?? {
			receiver_name: data.profile?.name ?? '',
			receiver_phone: data.profile?.phone ?? '',
			zip: '',
			addr1: '',
			addr2: '',
			memo: '',
			depositor_name: ''
		}
	);
	const errors = $derived(form?.errors ?? {});
</script>

<svelte:head><title>주문/결제 - 탄탄 편의시설</title></svelte:head>

<h1 class="py-7 text-[26px] font-black tracking-tight text-navy tb:text-[30px]">주문/결제</h1>

{#if form?.message}
	<p
		class="mb-5 rounded-lg bg-status-cancelled-bg px-4 py-3 text-[14px] font-semibold text-status-cancelled-fg"
	>
		{form.message}
	</p>
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
	class="grid gap-6 pb-10 tb:grid-cols-[1fr_320px] tb:items-start"
>
	<div class="space-y-6">
		<fieldset class="rounded-xl border border-line bg-surface p-5">
			<legend class="px-1 text-[16px] font-black text-ink">배송지</legend>
			<div class="mt-3 space-y-3">
				<label class="block">
					<span class="text-[14px] font-bold text-ink">받는 분 *</span>
					<input
						name="receiver_name"
						value={v.receiver_name}
						aria-invalid={!!errors.receiver_name}
						class="mt-1 min-h-11 w-full rounded-lg border border-line-2 px-3 text-[15px]"
					/>
					{#if errors.receiver_name}<span class="text-[13px] text-status-cancelled-fg"
							>{errors.receiver_name}</span
						>{/if}
				</label>
				<label class="block">
					<span class="text-[14px] font-bold text-ink">연락처 *</span>
					<input
						name="receiver_phone"
						value={v.receiver_phone}
						inputmode="tel"
						aria-invalid={!!errors.receiver_phone}
						class="mt-1 min-h-11 w-full rounded-lg border border-line-2 px-3 text-[15px]"
					/>
					{#if errors.receiver_phone}<span class="text-[13px] text-status-cancelled-fg"
							>{errors.receiver_phone}</span
						>{/if}
				</label>
				<div class="flex gap-2">
					<label class="w-32">
						<span class="text-[14px] font-bold text-ink">우편번호</span>
						<input
							name="zip"
							value={v.zip}
							class="mt-1 min-h-11 w-full rounded-lg border border-line-2 px-3 text-[15px]"
						/>
					</label>
					<label class="flex-1">
						<span class="text-[14px] font-bold text-ink">주소 *</span>
						<input
							name="addr1"
							value={v.addr1}
							aria-invalid={!!errors.addr1}
							class="mt-1 min-h-11 w-full rounded-lg border border-line-2 px-3 text-[15px]"
						/>
					</label>
				</div>
				{#if errors.addr1}<span class="text-[13px] text-status-cancelled-fg">{errors.addr1}</span
					>{/if}
				<label class="block">
					<span class="text-[14px] font-bold text-ink">상세주소</span>
					<input
						name="addr2"
						value={v.addr2}
						class="mt-1 min-h-11 w-full rounded-lg border border-line-2 px-3 text-[15px]"
					/>
				</label>
				<label class="block">
					<span class="text-[14px] font-bold text-ink">배송 메모</span>
					<input
						name="memo"
						value={v.memo}
						class="mt-1 min-h-11 w-full rounded-lg border border-line-2 px-3 text-[15px]"
					/>
				</label>
			</div>
		</fieldset>

		<fieldset class="rounded-xl border border-line bg-surface p-5">
			<legend class="px-1 text-[16px] font-black text-ink">결제수단</legend>
			<p class="mt-2 rounded-lg bg-navy-tint px-3 py-2 text-[14px] font-semibold text-navy">
				무통장입금 (입금 확인 후 배송이 시작됩니다)
			</p>
			{#if data.bank?.bank || data.bank?.number}
				<p class="mt-3 text-[14px] text-ink">
					입금계좌: <b>{data.bank.bank} {data.bank.number}</b> (예금주 {data.bank.holder})
				</p>
			{/if}
			<label class="mt-3 block">
				<span class="text-[14px] font-bold text-ink">입금자명 *</span>
				<input
					name="depositor_name"
					value={v.depositor_name}
					aria-invalid={!!errors.depositor_name}
					class="mt-1 min-h-11 w-full rounded-lg border border-line-2 px-3 text-[15px]"
				/>
				{#if errors.depositor_name}<span class="text-[13px] text-status-cancelled-fg"
						>{errors.depositor_name}</span
					>{/if}
			</label>
		</fieldset>
	</div>

	<aside class="rounded-xl border border-line bg-surface p-5 tb:sticky tb:top-4">
		<h2 class="text-[16px] font-black text-ink">주문 요약</h2>
		<ul class="mt-3 space-y-2 border-b border-line pb-3">
			{#each data.rows.filter((r) => r.orderable) as row (row.productId + (row.optionId ?? ''))}
				<li class="flex justify-between gap-2 text-[14px]">
					<span class="min-w-0 truncate text-ink">
						{row.productName}{row.optionName ? ` (${row.optionName})` : ''} × {row.quantity}
					</span>
					<span class="shrink-0 font-bold text-ink">{formatPrice(row.lineTotal)}</span>
				</li>
			{/each}
		</ul>
		<div class="mt-3 flex items-baseline justify-between">
			<span class="text-[15px] font-bold text-sub">결제 예정 금액</span>
			<span class="text-[24px] font-black text-navy">{formatPrice(data.summaryTotal)}</span>
		</div>

		<label class="mt-4 flex items-start gap-2">
			<input type="checkbox" name="agree" class="mt-1 h-5 w-5" aria-invalid={!!errors.agree} />
			<span class="text-[13px] leading-relaxed text-ink"
				>주문 내용을 확인했으며 개인정보 수집·이용 및 이용약관에 동의합니다.</span
			>
		</label>
		{#if errors.agree}<span class="text-[13px] text-status-cancelled-fg">{errors.agree}</span>{/if}

		<button
			type="submit"
			disabled={submitting || data.hasBlocked}
			class="mt-4 min-h-11 w-full rounded-lg bg-navy py-[15px] text-[16px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
		>
			{submitting ? '주문 처리 중…' : '주문하기'}
		</button>
		{#if data.hasBlocked}
			<p class="mt-2 text-[13px] font-semibold text-status-cancelled-fg">
				주문 불가 상품이 있습니다. 장바구니에서 삭제 후 진행해 주세요.
			</p>
		{/if}
	</aside>
</form>
