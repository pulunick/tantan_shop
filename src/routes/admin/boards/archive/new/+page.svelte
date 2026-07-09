<script lang="ts">
	/** 새 자료 등록. 첨부파일은 등록 후 상세(수정) 화면에서 추가한다. */
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>새 자료 등록 - 탄탄 관리자</title>
</svelte:head>

<a
	href={resolve('/admin/boards/archive')}
	class="mb-4 inline-block text-[14.5px] font-bold text-sub hover:text-navy"
>
	← 자료실 목록
</a>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">새 자료 등록</h1>

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
	class="flex max-w-[720px] flex-col gap-5 rounded-xl border border-line bg-surface p-6"
>
	{#if form?.message}
		<p
			role="alert"
			class="rounded-lg border border-line-2 bg-status-preparing-bg px-4 py-3 text-[14.5px] font-semibold text-phone-price"
		>
			{form.message}
		</p>
	{/if}

	<div>
		<label for="archive-title" class="mb-2 block text-[14.5px] font-extrabold text-ink">제목</label>
		<input
			id="archive-title"
			name="title"
			type="text"
			required
			value={form?.values?.title ?? ''}
			class="min-h-12 w-full rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
		/>
	</div>

	<div>
		<label for="archive-content" class="mb-2 block text-[14.5px] font-extrabold text-ink"
			>설명 (선택)</label
		>
		<textarea
			id="archive-content"
			name="content"
			rows="4"
			value={form?.values?.content ?? ''}
			class="w-full resize-y rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
		></textarea>
	</div>

	<label class="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-bold text-ink">
		<input
			type="checkbox"
			name="is_visible"
			checked={form?.values?.is_visible ?? true}
			class="h-[18px] w-[18px] accent-navy"
		/>
		즉시 노출
	</label>

	<button
		type="submit"
		disabled={submitting}
		class="mt-2 min-h-12 rounded-lg bg-navy text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
	>
		{submitting ? '등록 중…' : '등록하고 파일 추가하기'}
	</button>
</form>
