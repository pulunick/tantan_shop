<script lang="ts">
	/** 시공사례 관리 목록. 대표 이미지 미리보기 + 노출 토글 + 등록/수정 이동. */
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils/format';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	function makeHref(targetPage: number) {
		return targetPage > 1
			? resolve(`/admin/boards/case?page=${targetPage}`)
			: resolve('/admin/boards/case');
	}
</script>

<svelte:head>
	<title>시공사례 관리 - 탄탄 관리자</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-[24px] font-black tracking-tight text-ink">시공사례 관리</h1>
	<a
		href={resolve('/admin/boards/case/new')}
		class="min-h-11 rounded-lg bg-navy px-5 py-[10px] text-[15px] font-extrabold text-white hover:bg-navy/90"
	>
		+ 새 시공사례 등록
	</a>
</div>

{#if form?.message}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-line-2 bg-status-preparing-bg px-4 py-3 text-[14.5px] font-semibold text-phone-price"
	>
		{form.message}
	</p>
{/if}

{#if data.cases.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">등록된 시공사례가 없습니다.</p>
	</div>
{:else}
	<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.cases as item (item.id)}
			<li class="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
				<div class="aspect-video w-full bg-bg">
					{#if item.thumbnailUrl}
						<img src={item.thumbnailUrl} alt={item.title} class="h-full w-full object-cover" />
					{/if}
				</div>
				<div class="flex flex-1 flex-col gap-2 p-4">
					<p class="truncate text-[15px] font-extrabold text-ink">{item.title}</p>
					<p class="text-[13px] text-sub">{formatDate(item.created_at)}</p>
					<div class="mt-auto flex items-center justify-between gap-2 pt-2">
						<form method="POST" action="?/toggleVisible" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<input type="hidden" name="next" value={(!item.is_visible).toString()} />
							<button
								type="submit"
								class="min-h-9 rounded-md px-3 text-[13px] font-extrabold {item.is_visible
									? 'bg-status-delivered-bg text-status-delivered-fg'
									: 'border border-line-2 bg-surface text-sub'}"
							>
								{item.is_visible ? '노출' : '숨김'}
							</button>
						</form>
						<a
							href={resolve('/admin/boards/case/[id]', { id: item.id })}
							class="inline-flex min-h-9 items-center rounded-lg border border-navy px-4 text-[13.5px] font-extrabold text-navy hover:bg-navy-tint"
						>
							수정
						</a>
					</div>
				</div>
			</li>
		{/each}
	</ul>

	{#if totalPages > 1}
		<div class="mt-8">
			<Pagination currentPage={data.page} {totalPages} {makeHref} />
		</div>
	{/if}
{/if}
