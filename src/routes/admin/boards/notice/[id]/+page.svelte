<script lang="ts">
	/** 공지 수정/삭제. */
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	function confirmDelete(e: SubmitEvent) {
		if (!confirm('정말 삭제하시겠습니까? 삭제한 공지는 복구할 수 없습니다.')) {
			e.preventDefault();
		}
	}
</script>

<svelte:head>
	<title>{data.notice.title} 수정 - 탄탄 관리자</title>
</svelte:head>

<a
	href={resolve('/admin/boards/notice')}
	class="mb-4 inline-block text-[14.5px] font-bold text-sub hover:text-navy"
>
	← 공지사항 목록
</a>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">공지 수정</h1>

<form
	method="POST"
	action="?/update"
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
		<label for="notice-title" class="mb-2 block text-[14.5px] font-extrabold text-ink">제목</label>
		<input
			id="notice-title"
			name="title"
			type="text"
			required
			value={form?.values?.title ?? data.notice.title}
			class="min-h-12 w-full rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
		/>
	</div>

	<div>
		<label for="notice-content" class="mb-2 block text-[14.5px] font-extrabold text-ink">내용</label
		>
		<textarea
			id="notice-content"
			name="content"
			rows="10"
			value={form?.values?.content ?? data.notice.content}
			class="w-full resize-y rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
		></textarea>
	</div>

	<div class="flex flex-wrap gap-6">
		<label class="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-bold text-ink">
			<input
				type="checkbox"
				name="is_pinned"
				checked={form?.values?.is_pinned ?? data.notice.is_pinned}
				class="h-[18px] w-[18px] accent-navy"
			/>
			상단 고정
		</label>
		<label class="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-bold text-ink">
			<input
				type="checkbox"
				name="is_visible"
				checked={form?.values?.is_visible ?? data.notice.is_visible}
				class="h-[18px] w-[18px] accent-navy"
			/>
			노출
		</label>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="mt-2 min-h-12 rounded-lg bg-navy text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
	>
		{submitting ? '저장 중…' : '저장하기'}
	</button>
</form>

<form method="POST" action="?/delete" use:enhance onsubmit={confirmDelete} class="mt-4">
	<button
		type="submit"
		class="min-h-11 rounded-lg border border-status-cancelled-fg/40 bg-status-cancelled-bg px-5 text-[14.5px] font-extrabold text-status-cancelled-fg"
	>
		공지 삭제
	</button>
</form>
