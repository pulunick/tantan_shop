<script lang="ts">
	/** 자료실 관리 목록. 첨부파일 개수 표시 + 노출 토글 + 등록/수정 이동. */
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils/format';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	function makeHref(targetPage: number) {
		return targetPage > 1
			? resolve(`/admin/boards/archive?page=${targetPage}`)
			: resolve('/admin/boards/archive');
	}
</script>

<svelte:head>
	<title>자료실 관리 - 탄탄 관리자</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-[24px] font-black tracking-tight text-ink">자료실 관리</h1>
	<a
		href={resolve('/admin/boards/archive/new')}
		class="min-h-11 rounded-lg bg-navy px-5 py-[10px] text-[15px] font-extrabold text-white hover:bg-navy/90"
	>
		+ 새 자료 등록
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

{#if data.archives.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">등록된 자료가 없습니다.</p>
	</div>
{:else}
	<div class="overflow-x-auto rounded-xl border border-line bg-surface">
		<table class="w-full min-w-[640px] border-collapse text-left">
			<thead>
				<tr class="bg-bg text-[14px] font-extrabold text-sub">
					<th class="px-5 py-[14px]">제목</th>
					<th class="px-3 py-[14px]">첨부파일</th>
					<th class="px-3 py-[14px]">등록일</th>
					<th class="px-3 py-[14px] text-center">노출</th>
					<th class="px-5 py-[14px] text-center">관리</th>
				</tr>
			</thead>
			<tbody>
				{#each data.archives as item (item.id)}
					<tr class="border-t border-line-2">
						<td class="max-w-[280px] truncate px-5 py-[14px] text-[14.5px] font-bold text-ink"
							>{item.title}</td
						>
						<td class="px-3 py-[14px] text-[14px] text-sub">{item.fileCount}개</td>
						<td class="px-3 py-[14px] text-[13.5px] whitespace-nowrap text-sub"
							>{formatDate(item.created_at)}</td
						>
						<td class="px-3 py-[14px] text-center">
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
						</td>
						<td class="px-5 py-[14px] text-center">
							<a
								href={resolve('/admin/boards/archive/[id]', { id: item.id })}
								class="inline-flex min-h-11 items-center rounded-lg border border-navy px-4 text-[14px] font-extrabold text-navy hover:bg-navy-tint"
							>
								수정
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1}
		<div class="mt-8">
			<Pagination currentPage={data.page} {totalPages} {makeHref} />
		</div>
	{/if}
{/if}
