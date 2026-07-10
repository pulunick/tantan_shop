<script lang="ts">
	/**
	 * 배너 관리. 등록 시 이미지 업로드(media 버킷) 후 URL을 banners 행에 저장한다.
	 * 목록의 토글/삭제/순서변경도 관리자 세션의 브라우저 Supabase 클라이언트로 직접 수행한다
	 * (RLS banners_admin_write 정책이 admin 세션의 전체 쓰기를 허용).
	 */
	import { invalidateAll } from '$app/navigation';
	import { formatDate } from '$lib/utils/format';
	import { uploadToMedia } from '$lib/upload';
	import { compressImage, formatFileSize } from '$lib/image-compress';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let banners = $derived(data.banners);

	let fileInput: HTMLInputElement | undefined = $state();
	let selectedFile: File | null = $state(null);
	let previewUrl: string | null = $state(null);
	let compressing = $state(false);
	let linkUrl = $state('');
	let startAt = $state('');
	let endAt = $state('');
	let submitting = $state(false);
	let errorMessage = $state('');

	// selectedFile이 바뀔 때마다(파일 재선택/취소/컴포넌트 해제 시) 이전 objectURL을 해제한다.
	$effect(() => {
		const url = previewUrl;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});

	// 압축 진행 중인 Promise. 등록 제출 시 완료를 기다렸다가 압축본을 업로드한다.
	let compressTask: Promise<File> | null = null;

	function periodLabel(start: string | null, end: string | null): string {
		if (!start && !end) return '상시 노출';
		const s = start ? formatDate(start) : '제한 없음';
		const e = end ? formatDate(end) : '제한 없음';
		return `${s} ~ ${e}`;
	}

	function handleFileChange() {
		const file = fileInput?.files?.[0];
		if (!file) return;

		errorMessage = '';
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
		compressing = true;

		compressTask = compressImage(file, { maxWidthOrHeight: 1920, maxSizeMB: 1 })
			.then((compressed) => {
				selectedFile = compressed;
				return compressed;
			})
			.finally(() => {
				compressing = false;
			});
	}

	function resetSelection() {
		selectedFile = null;
		previewUrl = null;
		compressing = false;
		compressTask = null;
		if (fileInput) fileInput.value = '';
	}

	async function handleAdd(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';

		if (!selectedFile) {
			errorMessage = '배너 이미지를 선택해 주세요.';
			return;
		}

		submitting = true;

		if (compressTask) {
			try {
				await compressTask;
			} catch {
				// 압축 실패는 compressImage 내부에서 원본으로 폴백하므로 여기서는 무시한다.
			}
		}

		const uploaded = await uploadToMedia(data.supabase, 'banners', selectedFile);
		if ('error' in uploaded) {
			errorMessage = `이미지 업로드에 실패했습니다: ${uploaded.error}`;
			submitting = false;
			return;
		}

		const nextOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.sort_order)) + 1 : 0;

		const { error } = await data.supabase.from('banners').insert({
			image_url: uploaded.url,
			link_url: linkUrl.trim() || null,
			sort_order: nextOrder,
			start_at: startAt ? new Date(startAt).toISOString() : null,
			end_at: endAt ? new Date(endAt).toISOString() : null
		});

		submitting = false;

		if (error) {
			errorMessage = `배너 등록에 실패했습니다: ${error.message}`;
			return;
		}

		linkUrl = '';
		startAt = '';
		endAt = '';
		resetSelection();
		await invalidateAll();
	}

	async function toggleVisible(id: string, current: boolean) {
		await data.supabase.from('banners').update({ is_visible: !current }).eq('id', id);
		await invalidateAll();
	}

	async function removeBanner(id: string) {
		if (!confirm('이 배너를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.')) return;
		await data.supabase.from('banners').delete().eq('id', id);
		await invalidateAll();
	}

	async function move(id: string, direction: 'up' | 'down') {
		const idx = banners.findIndex((b) => b.id === id);
		const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (idx < 0 || swapIdx < 0 || swapIdx >= banners.length) return;

		const current = banners[idx];
		const target = banners[swapIdx];
		await Promise.all([
			data.supabase.from('banners').update({ sort_order: target.sort_order }).eq('id', current.id),
			data.supabase.from('banners').update({ sort_order: current.sort_order }).eq('id', target.id)
		]);
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>배너 관리 - 탄탄 관리자</title>
</svelte:head>

<h1 class="text-[24px] font-black tracking-tight text-ink tb:text-[26px]">배너 관리</h1>

<div class="mt-6 overflow-hidden rounded-2xl border border-line-2 bg-surface">
	{#if banners.length === 0}
		<p class="px-6 py-12 text-center text-[15px] text-sub">등록된 배너가 없습니다.</p>
	{:else}
		<ul>
			{#each banners as banner, i (banner.id)}
				<li
					class="flex flex-col gap-4 border-t border-line px-5 py-4 first:border-t-0 tb:flex-row tb:items-center tb:px-6"
				>
					<img
						src={banner.image_url}
						alt="배너 미리보기"
						loading="lazy"
						class="h-20 w-36 flex-none rounded-lg border border-line object-cover"
					/>

					<div class="min-w-0 flex-1">
						<p class="truncate text-[15px] font-bold text-ink">
							링크: {banner.link_url || '없음'}
						</p>
						<p class="mt-1 text-[13.5px] text-sub">
							노출기간: {periodLabel(banner.start_at, banner.end_at)}
						</p>
					</div>

					<div class="flex flex-none items-center gap-1.5">
						<button
							type="button"
							onclick={() => move(banner.id, 'up')}
							disabled={i === 0}
							aria-label="위로 이동"
							class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-2 text-navy disabled:opacity-30"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg
							>
						</button>
						<button
							type="button"
							onclick={() => move(banner.id, 'down')}
							disabled={i === banners.length - 1}
							aria-label="아래로 이동"
							class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-2 text-navy disabled:opacity-30"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg
							>
						</button>
					</div>

					<button
						type="button"
						onclick={() => toggleVisible(banner.id, banner.is_visible)}
						aria-pressed={banner.is_visible}
						class="flex min-h-11 flex-none items-center gap-2 rounded-full border border-line-2 px-3 py-2"
					>
						<span
							class="flex h-[26px] w-[46px] items-center rounded-full p-[3px] {banner.is_visible
								? 'justify-end bg-navy'
								: 'justify-start bg-line-2'}"
						>
							<span class="h-5 w-5 rounded-full bg-white shadow"></span>
						</span>
						<span
							class="text-[13.5px] font-extrabold {banner.is_visible ? 'text-navy' : 'text-sub'}"
						>
							{banner.is_visible ? '노출중' : '숨김'}
						</span>
					</button>

					<button
						type="button"
						onclick={() => removeBanner(banner.id)}
						aria-label="배너 삭제"
						class="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-line-2 text-status-cancelled-fg hover:bg-status-cancelled-bg"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path
								d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"
							/>
						</svg>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<div class="mt-6 rounded-2xl border border-line-2 bg-surface p-5 tb:p-6">
	<h2 class="text-[18px] font-black text-ink">새 배너 등록</h2>

	{#if errorMessage}
		<div
			class="mt-4 rounded-lg border border-status-cancelled-fg/30 bg-status-cancelled-bg px-4 py-3 text-[14.5px] font-bold text-status-cancelled-fg"
			role="alert"
		>
			{errorMessage}
		</div>
	{/if}

	<form onsubmit={handleAdd} class="mt-4 flex flex-col gap-5">
		<div>
			<label for="banner-file" class="mb-2 block text-[15px] font-extrabold text-ink"
				>배너 이미지</label
			>

			{#if !previewUrl}
				<label
					for="banner-file"
					class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-2 bg-bg-admin/50 px-6 py-9 text-center hover:border-navy/50"
				>
					<svg
						width="30"
						height="30"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#8a94a6"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg
					>
					<span class="text-[15px] font-extrabold text-ink">배너 이미지를 선택하세요</span>
					<span class="text-[13.5px] text-sub"
						>권장 <b class="text-navy">1920 × 600px</b> · 5MB 이하 · JPG / PNG</span
					>
				</label>
			{/if}

			<input
				id="banner-file"
				bind:this={fileInput}
				type="file"
				accept="image/*"
				onchange={handleFileChange}
				class="sr-only"
			/>

			{#if previewUrl}
				<div class="flex flex-col gap-4 rounded-xl border border-line-2 bg-bg-admin/40 p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<p class="flex items-center gap-2 text-[14px] font-extrabold text-status-delivered-fg">
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg
							>
							{selectedFile?.name} · {selectedFile ? formatFileSize(selectedFile.size) : ''}
							{compressing ? '(압축 중…)' : '업로드 준비 완료'}
						</p>
						<button
							type="button"
							onclick={resetSelection}
							class="min-h-11 rounded-lg border border-line-2 bg-surface px-4 text-[14px] font-extrabold text-ink"
						>
							다시 업로드
						</button>
					</div>

					<div class="grid gap-5 tb:grid-cols-[1fr_240px]">
						<div>
							<p class="mb-2 text-[13px] font-extrabold text-sub">
								PC 미리보기 <span class="font-semibold text-sub/70">(1920×600 비율)</span>
							</p>
							<div class="overflow-hidden rounded-xl border border-line-2 shadow-sm">
								<div class="flex h-[26px] items-center gap-1.5 bg-line-2 px-3">
									<span class="h-2 w-2 rounded-full bg-white/70"></span>
									<span class="h-2 w-2 rounded-full bg-white/70"></span>
									<span class="h-2 w-2 rounded-full bg-white/70"></span>
								</div>
								<!-- 실제 메인 배너 PC 렌더 비율 = 1200×400(3:1, (shop)/+page.svelte) — 미리보기도 동일 비율 -->
								<div class="aspect-[3/1] w-full bg-line">
									<img src={previewUrl} alt="PC 배너 미리보기" class="h-full w-full object-cover" />
								</div>
							</div>
							<p class="mt-2 text-center text-[12.5px] font-semibold text-sub">
								PC 화면 노출 영역 (1920×600 원본 기준 좌우 소폭 크롭)
							</p>
						</div>

						<div>
							<p class="mb-2 text-[13px] font-extrabold text-sub">
								모바일 미리보기 <span class="font-semibold text-sub/70">(중앙 크롭)</span>
							</p>
							<div
								class="mx-auto max-w-[220px] overflow-hidden rounded-[26px] border-[7px] border-navy-dark shadow-sm"
							>
								<div class="flex h-[18px] items-center justify-center bg-navy-dark">
									<span class="h-1.5 w-10 rounded-full bg-white/25"></span>
								</div>
								<div class="relative aspect-[360/300] w-full overflow-hidden bg-line">
									<img
										src={previewUrl}
										alt="모바일 배너 미리보기"
										class="h-full w-full object-cover"
									/>
									<span
										class="pointer-events-none absolute inset-x-0 top-0 h-[22%] border-b border-dashed border-white/70 bg-navy-dark/35"
									></span>
									<span
										class="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] border-t border-dashed border-white/70 bg-navy-dark/35"
									></span>
								</div>
							</div>
							<p class="mt-2 text-center text-[12.5px] leading-relaxed font-semibold text-sub">
								모바일에서는 상하 일부가 잘립니다.<br />핵심 문구는 가운데 배치하세요.
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div>
			<label for="banner-link" class="mb-2 block text-[15px] font-extrabold text-ink"
				>연결 링크</label
			>
			<input
				id="banner-link"
				type="text"
				bind:value={linkUrl}
				placeholder="예) /products?category=1"
				class="min-h-11 w-full rounded-lg border border-line-2 px-4 py-3 text-[15px] outline-none focus:border-navy"
			/>
		</div>

		<div class="flex flex-wrap gap-4">
			<div>
				<label for="banner-start" class="mb-2 block text-[15px] font-extrabold text-ink"
					>노출 시작일</label
				>
				<input
					id="banner-start"
					type="date"
					bind:value={startAt}
					class="min-h-11 rounded-lg border border-line-2 px-4 py-3 text-[15px]"
				/>
			</div>
			<div>
				<label for="banner-end" class="mb-2 block text-[15px] font-extrabold text-ink"
					>노출 종료일</label
				>
				<input
					id="banner-end"
					type="date"
					bind:value={endAt}
					class="min-h-11 rounded-lg border border-line-2 px-4 py-3 text-[15px]"
				/>
			</div>
		</div>

		<button
			type="submit"
			disabled={submitting}
			class="min-h-11 rounded-lg bg-navy py-4 text-[17px] font-extrabold text-white hover:bg-navy/90 disabled:opacity-60"
		>
			{submitting ? '등록 중…' : '배너 등록하기'}
		</button>
	</form>
</div>
