<script lang="ts">
	/**
	 * 자료실 게시글 수정/삭제 + 첨부파일 관리.
	 * 파일 업로드/삭제는 case 관리 화면과 동일하게 client supabase 직접쓰기 + invalidateAll() 패턴.
	 */
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { uploadToMedia } from '$lib/upload';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
	let uploading = $state(false);
	let uploadError = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	function confirmDelete(e: SubmitEvent) {
		if (!confirm('정말 삭제하시겠습니까? 첨부파일을 포함한 모든 내용이 삭제됩니다.')) {
			e.preventDefault();
		}
	}

	function formatFileSize(bytes: number | null): string {
		if (bytes == null) return '';
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
		return `${(kb / 1024).toFixed(1)} MB`;
	}

	async function onFilesSelected() {
		const files = fileInput?.files;
		if (!files || files.length === 0) return;

		uploading = true;
		uploadError = '';
		let nextSort = data.files.length;

		for (const file of Array.from(files)) {
			const result = await uploadToMedia(data.supabase, 'archive', file);
			if ('error' in result) {
				uploadError = result.error;
				continue;
			}
			const { error: insErr } = await data.supabase.from('post_files').insert({
				post_id: data.archive.id,
				url: result.url,
				filename: result.originalName,
				filesize: result.size,
				sort_order: nextSort
			});
			if (insErr) uploadError = insErr.message;
			nextSort += 1;
		}

		uploading = false;
		if (fileInput) fileInput.value = '';
		await invalidateAll();
	}

	async function deleteFile(fileId: string) {
		await data.supabase.from('post_files').delete().eq('id', fileId);
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{data.archive.title} 수정 - 탄탄 관리자</title>
</svelte:head>

<a
	href={resolve('/admin/boards/archive')}
	class="mb-4 inline-block text-[14.5px] font-bold text-sub hover:text-navy"
>
	← 자료실 목록
</a>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">자료 수정</h1>

<div class="flex max-w-[720px] flex-col gap-6">
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
		class="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6"
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
			<label for="archive-title" class="mb-2 block text-[14.5px] font-extrabold text-ink"
				>제목</label
			>
			<input
				id="archive-title"
				name="title"
				type="text"
				required
				value={form?.values?.title ?? data.archive.title}
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
				value={form?.values?.content ?? data.archive.content}
				class="w-full resize-y rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
			></textarea>
		</div>

		<label class="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-bold text-ink">
			<input
				type="checkbox"
				name="is_visible"
				checked={form?.values?.is_visible ?? data.archive.is_visible}
				class="h-[18px] w-[18px] accent-navy"
			/>
			노출
		</label>

		<button
			type="submit"
			disabled={submitting}
			class="mt-2 min-h-12 rounded-lg bg-navy text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
		>
			{submitting ? '저장 중…' : '저장하기'}
		</button>
	</form>

	<div class="rounded-xl border border-line bg-surface p-6">
		<h2 class="mb-4 text-[17px] font-black text-ink">첨부파일</h2>

		{#if uploadError}
			<p role="alert" class="mb-3 text-[14px] font-semibold text-status-cancelled-fg">
				{uploadError}
			</p>
		{/if}

		{#if data.files.length > 0}
			<ul class="mb-4 flex flex-col gap-2">
				{#each data.files as file (file.id)}
					<li
						class="flex items-center justify-between gap-3 rounded-lg border border-line-2 px-4 py-3"
					>
						<div class="min-w-0">
							<p class="truncate text-[14.5px] font-bold text-ink">{file.filename}</p>
							<p class="text-[13px] text-sub">{formatFileSize(file.filesize)}</p>
						</div>
						<button
							type="button"
							onclick={() => deleteFile(file.id)}
							class="min-h-9 rounded-md border border-status-cancelled-fg/40 bg-status-cancelled-bg px-3 text-[13px] font-extrabold whitespace-nowrap text-status-cancelled-fg"
						>
							삭제
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mb-4 text-[14.5px] text-sub">등록된 첨부파일이 없습니다.</p>
		{/if}

		<label
			for="archive-file-input"
			class="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-dashed border-line-2 bg-bg px-5 text-[14.5px] font-bold text-sub"
		>
			{uploading ? '업로드 중…' : '파일 추가하기 (여러 개 선택 가능)'}
		</label>
		<input
			id="archive-file-input"
			bind:this={fileInput}
			type="file"
			multiple
			disabled={uploading}
			onchange={onFilesSelected}
			class="sr-only"
		/>
	</div>

	<form method="POST" action="?/delete" use:enhance onsubmit={confirmDelete}>
		<button
			type="submit"
			class="min-h-11 rounded-lg border border-status-cancelled-fg/40 bg-status-cancelled-bg px-5 text-[14.5px] font-extrabold text-status-cancelled-fg"
		>
			자료 삭제
		</button>
	</form>
</div>
