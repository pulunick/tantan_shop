<script lang="ts">
	/** 자료실. 첨부파일 다운로드 목록. */
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>자료실 - 탄탄 편의시설</title>
</svelte:head>

<div class="mx-auto max-w-[1000px]">
	<div class="mb-1 text-[13px] font-semibold text-sub">
		<a href={resolve('/')} class="hover:text-navy">홈</a>
		<span aria-hidden="true">›</span>
		<span class="text-navy">자료실</span>
	</div>

	<div class="mb-7">
		<div class="mb-3 h-1 w-[38px] rounded-full bg-yellow"></div>
		<h1 class="text-[27px] font-black tracking-tight text-ink">자료실</h1>
		<p class="mt-2 text-[15px] text-sub">
			제품 카탈로그 · 단가표 · 설치 기준 · 인증서를 내려받으실 수 있습니다.
		</p>
	</div>

	{#if data.files.length === 0}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface px-6 py-20 text-center"
		>
			<p class="text-[16px] font-extrabold text-ink">등록된 자료가 없습니다.</p>
		</div>
	{:else}
		<ul class="overflow-hidden rounded-xl border border-line bg-surface">
			{#each data.files as file, i (file.fileId)}
				<li class="flex items-center gap-4 px-5 py-[18px] {i > 0 ? 'border-t border-line-2' : ''}">
					<span
						class="flex h-11 w-11 flex-none items-center justify-center rounded-[9px] bg-navy-tint"
						aria-hidden="true"
					>
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.7"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-navy"
						>
							<path d="M6 2h8l4 4v16H6z" />
							<path d="M14 2v4h4M9 13h6M9 17h6" />
						</svg>
					</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-[15.5px] font-bold text-ink">{file.postTitle}</p>
						<p class="mt-[5px] text-[13px] font-semibold text-sub">
							{file.filename}{#if file.sizeLabel}
								&nbsp;·&nbsp;{file.sizeLabel}
							{/if}
						</p>
					</div>
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={file.url}
						download
						class="flex min-h-11 flex-none items-center gap-[7px] rounded-[9px] border border-navy px-[18px] text-[14px] font-extrabold whitespace-nowrap text-navy hover:bg-navy-tint"
					>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.9"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
						</svg>
						다운로드
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
