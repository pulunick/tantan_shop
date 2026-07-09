<script lang="ts">
	/**
	 * 시공사례 수정/삭제 + 이미지 관리.
	 * 이미지 업로드/삭제는 관리자 브라우저에서 uploadToMedia() 로 storage 에 직접 올리고
	 * post_images 행을 client supabase 로 바로 쓴 뒤 invalidateAll() 로 목록을 새로고침한다
	 * (admin RLS 가 전체 쓰기를 허용 — /lib/cart 등 기존 클라이언트 직접쓰기 패턴과 동일).
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
		if (!confirm('정말 삭제하시겠습니까? 이미지를 포함한 모든 내용이 삭제됩니다.')) {
			e.preventDefault();
		}
	}

	async function onFilesSelected() {
		const files = fileInput?.files;
		if (!files || files.length === 0) return;

		uploading = true;
		uploadError = '';
		let nextSort = data.images.length;

		for (const file of Array.from(files)) {
			const result = await uploadToMedia(data.supabase, 'cases', file);
			if ('error' in result) {
				uploadError = result.error;
				continue;
			}
			const { error: insErr } = await data.supabase
				.from('post_images')
				.insert({ post_id: data.caseItem.id, url: result.url, sort_order: nextSort });
			if (insErr) uploadError = insErr.message;
			nextSort += 1;
		}

		uploading = false;
		if (fileInput) fileInput.value = '';
		await invalidateAll();
	}

	async function deleteImage(imageId: string) {
		await data.supabase.from('post_images').delete().eq('id', imageId);
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{data.caseItem.title} 수정 - 탄탄 관리자</title>
</svelte:head>

<a
	href={resolve('/admin/boards/case')}
	class="mb-4 inline-block text-[14.5px] font-bold text-sub hover:text-navy"
>
	← 시공사례 목록
</a>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">시공사례 수정</h1>

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
			<label for="case-title" class="mb-2 block text-[14.5px] font-extrabold text-ink">제목</label>
			<input
				id="case-title"
				name="title"
				type="text"
				required
				value={form?.values?.title ?? data.caseItem.title}
				class="min-h-12 w-full rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
			/>
		</div>

		<div>
			<label for="case-content" class="mb-2 block text-[14.5px] font-extrabold text-ink">설명</label
			>
			<textarea
				id="case-content"
				name="content"
				rows="6"
				value={form?.values?.content ?? data.caseItem.content}
				class="w-full resize-y rounded-lg border border-line-2 px-4 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
			></textarea>
		</div>

		<label class="flex min-h-11 cursor-pointer items-center gap-2 text-[15px] font-bold text-ink">
			<input
				type="checkbox"
				name="is_visible"
				checked={form?.values?.is_visible ?? data.caseItem.is_visible}
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
		<h2 class="mb-4 text-[17px] font-black text-ink">시공 이미지</h2>

		{#if uploadError}
			<p role="alert" class="mb-3 text-[14px] font-semibold text-status-cancelled-fg">
				{uploadError}
			</p>
		{/if}

		{#if data.images.length > 0}
			<ul class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each data.images as image (image.id)}
					<li class="relative overflow-hidden rounded-lg border border-line-2">
						<img src={image.url} alt="시공사례 이미지" class="aspect-square w-full object-cover" />
						<button
							type="button"
							onclick={() => deleteImage(image.id)}
							aria-label="이미지 삭제"
							class="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg
							>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mb-4 text-[14.5px] text-sub">등록된 이미지가 없습니다.</p>
		{/if}

		<label
			for="case-image-input"
			class="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-dashed border-line-2 bg-bg px-5 text-[14.5px] font-bold text-sub"
		>
			{uploading ? '업로드 중…' : '이미지 추가하기 (여러 장 선택 가능)'}
		</label>
		<input
			id="case-image-input"
			bind:this={fileInput}
			type="file"
			accept="image/*"
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
			시공사례 삭제
		</button>
	</form>
</div>
