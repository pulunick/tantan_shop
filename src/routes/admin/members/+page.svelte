<script lang="ts">
	/** 회원 관리 목록. 이름/연락처 검색. 행 클릭 시 회원 상세로 이동. */
	import { resolve } from '$app/paths';
	import { formatDate } from '$lib/utils/format';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let totalPages = $derived(Math.ceil(data.total / data.pageSize));

	/**
	 * URLSearchParams 인스턴스 없이(svelte/prefer-svelte-reactivity) 쿼리 문자열을 직접 조립.
	 * resolve() 가 리터럴 '?' 를 정적으로 인식해야 하므로 삼항으로 정적 경로/템플릿을 분기한다.
	 */
	function makeHref(targetPage: number) {
		const pairs: string[] = [];
		if (data.q) pairs.push(`q=${encodeURIComponent(data.q)}`);
		if (targetPage > 1) pairs.push(`page=${targetPage}`);
		const qs = pairs.join('&');
		return qs ? resolve(`/admin/members?${qs}`) : resolve('/admin/members');
	}
</script>

<svelte:head>
	<title>회원 관리 - 탄탄 관리자</title>
</svelte:head>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">회원 관리</h1>

<form
	method="GET"
	class="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4"
>
	<label for="member-search" class="sr-only">이름 또는 연락처 검색</label>
	<input
		id="member-search"
		type="text"
		name="q"
		value={data.q}
		placeholder="이름 또는 연락처 검색"
		class="min-h-11 min-w-[220px] flex-1 rounded-lg border border-line-2 px-4 py-2.5 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
	/>
	<button
		type="submit"
		class="min-h-11 rounded-lg bg-navy px-6 text-[15px] font-extrabold text-white hover:bg-navy/90"
	>
		검색
	</button>
</form>

{#if data.members.length === 0}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-20 text-center"
	>
		<p class="text-[16px] font-extrabold text-ink">조건에 맞는 회원이 없습니다.</p>
	</div>
{:else}
	<div class="overflow-x-auto rounded-xl border border-line bg-surface">
		<table class="w-full min-w-[640px] border-collapse text-left">
			<thead>
				<tr class="bg-bg text-[14px] font-extrabold text-sub">
					<th class="px-5 py-[14px]">이름</th>
					<th class="px-3 py-[14px]">연락처</th>
					<th class="px-3 py-[14px]">구분</th>
					<th class="px-3 py-[14px]">가입일</th>
					<th class="px-5 py-[14px] text-center">관리</th>
				</tr>
			</thead>
			<tbody>
				{#each data.members as member (member.id)}
					<tr class="border-t border-line-2">
						<td class="px-5 py-[14px] text-[14.5px] font-extrabold text-ink"
							>{member.name ?? '(이름 없음)'}</td
						>
						<td class="px-3 py-[14px] text-[14px] text-ink">{member.phone ?? '-'}</td>
						<td class="px-3 py-[14px] text-[13.5px] font-bold text-sub">
							{member.role === 'admin' ? '관리자' : '일반회원'}
						</td>
						<td class="px-3 py-[14px] text-[13.5px] whitespace-nowrap text-sub"
							>{formatDate(member.created_at)}</td
						>
						<td class="px-5 py-[14px] text-center">
							<a
								href={resolve('/admin/members/[id]', { id: member.id })}
								class="inline-flex min-h-11 items-center rounded-lg border border-navy px-4 text-[14px] font-extrabold text-navy hover:bg-navy-tint"
							>
								상세
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
