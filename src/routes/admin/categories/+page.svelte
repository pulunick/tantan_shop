<script lang="ts">
	/**
	 * 카테고리 관리 — 추가 / 이름변경 / 노출토글 / 순서변경(위·아래).
	 * 각 동작은 이름 있는 form action(named action) 으로 서버에서 처리한다.
	 */
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);

	function submitHandler() {
		submitting = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			submitting = false;
		};
	}
</script>

<svelte:head>
	<title>카테고리 관리 - 탄탄 관리자</title>
</svelte:head>

<h1 class="text-[24px] font-black tracking-tight text-ink tb:text-[26px]">카테고리 관리</h1>

{#if form?.message}
	<div
		class="mt-4 rounded-lg border border-status-cancelled-fg/30 bg-status-cancelled-bg px-4 py-3 text-[14.5px] font-bold text-status-cancelled-fg"
		role="alert"
	>
		{form.message}
	</div>
{/if}

<div class="mt-6 rounded-2xl border border-line-2 bg-surface p-5 tb:p-6">
	<h2 class="text-[17px] font-black text-ink">새 카테고리 추가</h2>
	<form
		method="POST"
		action="?/add"
		use:enhance={submitHandler}
		class="mt-4 flex flex-col gap-3 tb:flex-row"
	>
		<label for="new-category-name" class="sr-only">카테고리명</label>
		<input
			id="new-category-name"
			name="name"
			type="text"
			required
			placeholder="예) 점자블럭"
			class="min-h-11 flex-1 rounded-lg border border-line-2 px-4 py-3 text-[16px] outline-none focus:border-navy"
		/>
		<button
			type="submit"
			disabled={submitting}
			class="min-h-11 rounded-lg bg-navy px-6 py-3 text-[16px] font-extrabold text-white hover:bg-navy/90 disabled:opacity-60"
		>
			추가
		</button>
	</form>
</div>

<div class="mt-6 overflow-hidden rounded-2xl border border-line-2 bg-surface">
	{#if data.categories.length === 0}
		<p class="px-6 py-12 text-center text-[15px] text-sub">등록된 카테고리가 없습니다.</p>
	{:else}
		<ul>
			{#each data.categories as category, i (category.id)}
				<li
					class="flex flex-col gap-3 border-t border-line px-5 py-4 first:border-t-0 tb:flex-row tb:items-center tb:gap-4 tb:px-6"
				>
					<!-- 순서 -->
					<div class="flex flex-none items-center gap-1.5">
						<form method="POST" action="?/move" use:enhance={submitHandler}>
							<input type="hidden" name="id" value={category.id} />
							<input type="hidden" name="direction" value="up" />
							<button
								type="submit"
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
						</form>
						<form method="POST" action="?/move" use:enhance={submitHandler}>
							<input type="hidden" name="id" value={category.id} />
							<input type="hidden" name="direction" value="down" />
							<button
								type="submit"
								disabled={i === data.categories.length - 1}
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
						</form>
					</div>

					<!-- 이름 변경 -->
					<form
						method="POST"
						action="?/rename"
						use:enhance={submitHandler}
						class="flex flex-1 items-center gap-2"
					>
						<input type="hidden" name="id" value={category.id} />
						<label for="rename-{category.id}" class="sr-only">카테고리명</label>
						<input
							id="rename-{category.id}"
							name="name"
							type="text"
							value={category.name}
							class="min-h-11 w-full min-w-0 rounded-lg border border-line-2 px-4 py-2.5 text-[16px] outline-none focus:border-navy"
						/>
						<button
							type="submit"
							class="min-h-11 flex-none rounded-lg border border-line-2 px-4 py-2.5 text-[14.5px] font-extrabold text-ink hover:bg-bg"
						>
							저장
						</button>
					</form>

					<!-- 노출 토글 -->
					<form
						method="POST"
						action="?/toggleVisible"
						use:enhance={submitHandler}
						class="flex-none"
					>
						<input type="hidden" name="id" value={category.id} />
						<input type="hidden" name="isVisible" value={category.is_visible} />
						<button
							type="submit"
							class="flex min-h-11 items-center gap-2 rounded-full border border-line-2 px-3 py-2"
							aria-pressed={category.is_visible}
						>
							<span
								class="flex h-[26px] w-[46px] items-center rounded-full p-[3px] {category.is_visible
									? 'justify-end bg-navy'
									: 'justify-start bg-line-2'}"
							>
								<span class="h-5 w-5 rounded-full bg-white shadow"></span>
							</span>
							<span
								class="text-[13.5px] font-extrabold {category.is_visible
									? 'text-navy'
									: 'text-sub'}"
							>
								{category.is_visible ? '노출중' : '숨김'}
							</span>
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>
