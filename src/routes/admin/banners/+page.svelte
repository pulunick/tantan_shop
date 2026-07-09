<script lang="ts">
	/**
	 * 배너 관리. 등록 시 이미지 업로드(media 버킷) 후 URL을 banners 행에 저장한다.
	 * 목록의 토글/삭제/순서변경도 관리자 세션의 브라우저 Supabase 클라이언트로 직접 수행한다
	 * (RLS banners_admin_write 정책이 admin 세션의 전체 쓰기를 허용).
	 */
	import { invalidateAll } from '$app/navigation';
	import { formatDate } from '$lib/utils/format';
	import { uploadToMedia } from '$lib/upload';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let banners = $derived(data.banners);

	let fileInput: HTMLInputElement | undefined = $state();
	let linkUrl = $state('');
	let startAt = $state('');
	let endAt = $state('');
	let submitting = $state(false);
	let errorMessage = $state('');

	function periodLabel(start: string | null, end: string | null): string {
		if (!start && !end) return '상시 노출';
		const s = start ? formatDate(start) : '제한 없음';
		const e = end ? formatDate(end) : '제한 없음';
		return `${s} ~ ${e}`;
	}

	async function handleAdd(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';

		const file = fileInput?.files?.[0];
		if (!file) {
			errorMessage = '배너 이미지를 선택해 주세요.';
			return;
		}

		submitting = true;

		const uploaded = await uploadToMedia(data.supabase, 'banners', file);
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
		if (fileInput) fileInput.value = '';
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
			<input
				id="banner-file"
				bind:this={fileInput}
				type="file"
				accept="image/*"
				required
				class="block w-full rounded-lg border border-line-2 px-4 py-3 text-[15px]"
			/>
			<p class="mt-1.5 text-[13px] text-sub">권장 사이즈 1200 × 400px</p>
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
