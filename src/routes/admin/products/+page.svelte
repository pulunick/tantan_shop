<script lang="ts">
	/**
	 * 상품 관리 목록 — 필터(판매상태/카테고리/상품명) + 판매중↔품절 토글 + 노출 토글 + 수정 진입.
	 * 필터는 URL 쿼리로 표현(새로고침/공유 안전), 토글은 폼 액션(use:enhance)으로 즉시 반영한다.
	 */
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatPrice } from '$lib/utils/format';
	import type { ProductStatus } from '$lib/types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const statusOptions: { value: ProductStatus | ''; label: string }[] = [
		{ value: '', label: '판매상태 전체' },
		{ value: 'on_sale', label: '판매중' },
		{ value: 'sold_out', label: '품절' },
		{ value: 'hidden', label: '숨김' }
	];

	function statusLabel(status: ProductStatus): { label: string; classes: string } {
		if (status === 'sold_out') return { label: '품절', classes: 'text-status-cancelled-fg' };
		if (status === 'hidden') return { label: '숨김', classes: 'text-sub' };
		return { label: '판매중', classes: 'text-navy' };
	}
</script>

<svelte:head>
	<title>상품 관리 - 관리자</title>
</svelte:head>

<h1 class="text-[22px] font-black tracking-tight text-ink">상품 관리</h1>

{#if form?.message}
	<p
		role="alert"
		class="mt-4 rounded-lg border border-line-2 bg-status-cancelled-bg px-4 py-3 text-[14.5px] font-bold text-status-cancelled-fg"
	>
		{form.message}
	</p>
{/if}

<!-- 필터 -->
<form
	method="GET"
	action={resolve('/admin/products')}
	class="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-line-2 bg-surface p-5"
>
	<label class="sr-only" for="filter-status">판매상태</label>
	<select
		id="filter-status"
		name="status"
		value={data.status}
		onchange={(e) => e.currentTarget.form?.requestSubmit()}
		class="min-h-11 rounded-lg border border-line-2 bg-surface px-3 py-2.5 text-[15px] font-semibold text-ink"
	>
		{#each statusOptions as opt (opt.value)}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>

	<label class="sr-only" for="filter-category">카테고리</label>
	<select
		id="filter-category"
		name="category"
		value={data.category}
		onchange={(e) => e.currentTarget.form?.requestSubmit()}
		class="min-h-11 rounded-lg border border-line-2 bg-surface px-3 py-2.5 text-[15px] font-semibold text-ink"
	>
		<option value="">전체 카테고리</option>
		{#each data.categories as cat (cat.id)}
			<option value={cat.id}>{cat.name}</option>
		{/each}
	</select>

	<div class="flex min-w-[220px] flex-1 items-center gap-2">
		<label class="sr-only" for="filter-q">상품명 검색</label>
		<input
			id="filter-q"
			name="q"
			type="search"
			value={data.q}
			placeholder="상품명 검색"
			class="min-h-11 w-full rounded-lg border border-line-2 bg-surface px-3.5 py-2.5 text-[15px] text-ink"
		/>
		<button
			type="submit"
			class="min-h-11 flex-none rounded-lg bg-navy px-5 text-[15px] font-bold whitespace-nowrap text-white hover:bg-navy/90"
		>
			검색
		</button>
	</div>

	<a
		href={resolve('/admin/products/new')}
		class="ml-auto flex min-h-11 items-center rounded-lg bg-yellow px-5 text-[15.5px] font-extrabold text-navy hover:bg-yellow-hover"
	>
		+ 상품 등록
	</a>
</form>

<!-- 목록 -->
<div class="mt-5 overflow-hidden rounded-xl border border-line-2 bg-surface">
	<div class="overflow-x-auto">
		<table class="w-full min-w-[820px] border-collapse text-left">
			<thead>
				<tr class="bg-bg">
					<th class="px-5 py-3.5 text-[14px] font-extrabold text-sub">상품</th>
					<th class="px-4 py-3.5 text-[14px] font-extrabold text-sub">카테고리</th>
					<th class="px-4 py-3.5 text-right text-[14px] font-extrabold text-sub">가격</th>
					<th class="px-4 py-3.5 text-center text-[14px] font-extrabold text-sub">판매상태</th>
					<th class="px-4 py-3.5 text-center text-[14px] font-extrabold text-sub">노출</th>
					<th class="px-5 py-3.5 text-center text-[14px] font-extrabold text-sub">관리</th>
				</tr>
			</thead>
			<tbody>
				{#each data.products as p (p.id)}
					{@const st = statusLabel(p.status)}
					{@const isHidden = p.status === 'hidden'}
					<tr class="border-t border-line">
						<td class="px-5 py-3.5">
							<div class="flex items-center gap-3.5">
								<div
									class="h-14 w-14 flex-none overflow-hidden rounded-lg border border-line-2 bg-bg"
								>
									{#if p.thumbnailUrl}
										<img
											src={p.thumbnailUrl}
											alt={p.name}
											loading="lazy"
											class="h-full w-full object-cover"
										/>
									{/if}
								</div>
								<span class="text-[15px] font-bold text-ink">{p.name}</span>
							</div>
						</td>
						<td class="px-4 py-3.5 text-[14.5px] font-semibold text-ink">
							{p.categoryName ?? '-'}
						</td>
						<td
							class="px-4 py-3.5 text-right text-[15px] font-extrabold whitespace-nowrap"
							class:text-phone-price={p.is_price_hidden}
							class:text-ink={!p.is_price_hidden}
						>
							{p.is_price_hidden ? '전화문의' : formatPrice(p.price ?? 0)}
						</td>
						<td class="px-4 py-3.5 text-center">
							{#if isHidden}
								<span class="text-[13.5px] font-bold text-sub">{st.label}</span>
							{:else}
								<form method="POST" action="?/toggleSale" use:enhance class="inline-flex">
									<input type="hidden" name="id" value={p.id} />
									<input type="hidden" name="status" value={p.status} />
									<button
										type="submit"
										aria-label={p.status === 'on_sale' ? '품절로 변경' : '판매중으로 변경'}
										aria-pressed={p.status === 'on_sale'}
										class="inline-flex items-center gap-2.5"
									>
										<span
											class="flex h-[30px] w-[54px] items-center rounded-full p-[3px] transition-colors"
											class:bg-navy={p.status === 'on_sale'}
											class:bg-line-2={p.status === 'sold_out'}
										>
											<span
												class="h-6 w-6 rounded-full bg-white shadow transition-transform"
												class:translate-x-6={p.status === 'on_sale'}
											></span>
										</span>
										<!-- 라벨 폭 고정으로 토글 위치를 안정시키되, '판매중'(3자)이 들어갈 만큼은 확보한다 -->
										<span
											class="w-11 text-left text-[14px] font-extrabold whitespace-nowrap {st.classes}"
										>
											{st.label}
										</span>
									</button>
								</form>
							{/if}
						</td>
						<td class="px-4 py-3.5 text-center">
							<form method="POST" action="?/toggleVisibility" use:enhance>
								<input type="hidden" name="id" value={p.id} />
								<input type="hidden" name="status" value={p.status} />
								<button
									type="submit"
									class="min-h-11 rounded-lg border px-3.5 text-[13.5px] font-extrabold whitespace-nowrap"
									class:border-line-2={isHidden}
									class:bg-bg={isHidden}
									class:text-sub={isHidden}
									class:border-navy-tint={!isHidden}
									class:bg-navy-tint={!isHidden}
									class:text-navy={!isHidden}
								>
									{isHidden ? '숨김 (노출하기)' : '노출'}
								</button>
							</form>
						</td>
						<td class="px-5 py-3.5 text-center">
							<a
								href={resolve('/admin/products/[id]', { id: p.id })}
								class="inline-flex min-h-11 items-center rounded-lg border border-navy px-4 text-[14px] font-extrabold whitespace-nowrap text-navy hover:bg-navy-tint"
							>
								수정
							</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-5 py-16 text-center text-[15px] font-semibold text-sub">
							조건에 맞는 상품이 없습니다.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
