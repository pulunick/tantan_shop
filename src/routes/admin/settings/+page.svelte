<script lang="ts">
	/**
	 * 사이트 설정 — site_settings 의 company/bank_account/shipping 3행을 한 화면에서 수정.
	 * 저장은 단일 action(?/save) 이 세 키를 한 번에 upsert 한다.
	 */
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>사이트 설정 - 탄탄 관리자</title>
</svelte:head>

<h1 class="text-[24px] font-black tracking-tight text-ink tb:text-[26px]">사이트 설정</h1>

{#if form?.message}
	<div
		class="mt-4 rounded-lg border border-status-cancelled-fg/30 bg-status-cancelled-bg px-4 py-3 text-[14.5px] font-bold text-status-cancelled-fg"
		role="alert"
	>
		{form.message}
	</div>
{:else if form?.success}
	<div
		class="mt-4 rounded-lg border border-line-2 bg-navy-tint px-4 py-3 text-[14.5px] font-bold text-navy"
		role="status"
	>
		저장되었습니다.
	</div>
{/if}

<form
	method="POST"
	action="?/save"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
	class="mt-6 flex flex-col gap-6"
>
	<section class="rounded-2xl border border-line-2 bg-surface p-5 tb:p-6">
		<h2 class="text-[18px] font-black text-ink">회사 정보</h2>
		<div class="mt-4 grid gap-4 tb:grid-cols-2">
			<div>
				<label for="company_name" class="mb-2 block text-[15px] font-extrabold text-ink"
					>회사명</label
				>
				<input
					id="company_name"
					name="company_name"
					type="text"
					required
					value={data.company.name}
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
			<div>
				<label for="company_ceo" class="mb-2 block text-[15px] font-extrabold text-ink"
					>대표자명</label
				>
				<input
					id="company_ceo"
					name="company_ceo"
					type="text"
					value={data.company.ceo}
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
			<div>
				<label for="company_tel" class="mb-2 block text-[15px] font-extrabold text-ink"
					>대표번호</label
				>
				<input
					id="company_tel"
					name="company_tel"
					type="tel"
					required
					value={data.company.tel}
					placeholder="010-4055-3338"
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
			<div>
				<label for="company_biz_no" class="mb-2 block text-[15px] font-extrabold text-ink"
					>사업자등록번호</label
				>
				<input
					id="company_biz_no"
					name="company_biz_no"
					type="text"
					value={data.company.biz_no}
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
			<div class="tb:col-span-2">
				<label for="company_address" class="mb-2 block text-[15px] font-extrabold text-ink"
					>주소</label
				>
				<input
					id="company_address"
					name="company_address"
					type="text"
					value={data.company.address}
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
		</div>
	</section>

	<section class="rounded-2xl border border-line-2 bg-surface p-5 tb:p-6">
		<h2 class="text-[18px] font-black text-ink">무통장 입금 계좌</h2>
		<div class="mt-4 grid gap-4 tb:grid-cols-3">
			<div>
				<label for="bank_name" class="mb-2 block text-[15px] font-extrabold text-ink">은행</label>
				<input
					id="bank_name"
					name="bank_name"
					type="text"
					required
					value={data.bankAccount.bank}
					placeholder="예) 국민은행"
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
			<div>
				<label for="bank_holder" class="mb-2 block text-[15px] font-extrabold text-ink"
					>예금주</label
				>
				<input
					id="bank_holder"
					name="bank_holder"
					type="text"
					value={data.bankAccount.holder}
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
			<div>
				<label for="bank_number" class="mb-2 block text-[15px] font-extrabold text-ink"
					>계좌번호</label
				>
				<input
					id="bank_number"
					name="bank_number"
					type="text"
					required
					value={data.bankAccount.number}
					class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
				/>
			</div>
		</div>
	</section>

	<section class="rounded-2xl border border-line-2 bg-surface p-5 tb:p-6">
		<h2 class="text-[18px] font-black text-ink">배송 안내 문구</h2>
		<div class="mt-4">
			<label for="shipping_notice" class="mb-2 block text-[15px] font-extrabold text-ink"
				>고객에게 노출되는 배송 안내</label
			>
			<textarea
				id="shipping_notice"
				name="shipping_notice"
				rows="4"
				value={data.shipping.notice}
				placeholder="예) 주문 후 2~3일 내 발송됩니다. 도서산간 지역은 추가 배송비가 발생할 수 있습니다."
				class="w-full resize-y rounded-lg border border-line-2 px-4 py-3 text-[15.5px] leading-[1.6] outline-none focus:border-navy"
			></textarea>
		</div>
	</section>

	<button
		type="submit"
		disabled={submitting}
		class="min-h-11 self-start rounded-lg bg-navy px-8 py-4 text-[17px] font-extrabold text-white hover:bg-navy/90 disabled:opacity-60"
	>
		{submitting ? '저장 중…' : '저장하기'}
	</button>
</form>
