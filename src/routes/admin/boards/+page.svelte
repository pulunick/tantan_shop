<script lang="ts">
	/** 게시판 관리 허브. 공지/시공사례/자료실/문의 답변 관리 화면으로 이동. */
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const cards = $derived([
		{
			title: '공지사항 관리',
			desc: '고정/노출 여부를 설정하고 공지를 등록·수정합니다.',
			count: data.noticeCount,
			countLabel: '건',
			href: resolve('/admin/boards/notice')
		},
		{
			title: '시공사례 관리',
			desc: '시공 사진과 설명을 갤러리 형태로 등록합니다.',
			count: data.caseCount,
			countLabel: '건',
			href: resolve('/admin/boards/case')
		},
		{
			title: '자료실 관리',
			desc: '다운로드 가능한 첨부파일을 등록·관리합니다.',
			count: data.archiveCount,
			countLabel: '건',
			href: resolve('/admin/boards/archive')
		},
		{
			title: '문의 답변',
			desc: '고객 문의를 확인하고 답변을 작성합니다.',
			count: data.waitingInquiryCount,
			countLabel: '건 미답변',
			href: resolve('/admin/boards/inquiries'),
			highlight: data.waitingInquiryCount > 0
		}
	]);
</script>

<svelte:head>
	<title>게시판 관리 - 탄탄 관리자</title>
</svelte:head>

<h1 class="mb-6 text-[24px] font-black tracking-tight text-ink">게시판 관리</h1>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
	{#each cards as card (card.title)}
		<a
			href={card.href}
			class="flex flex-col gap-2 rounded-xl border bg-surface p-6 hover:border-navy {card.highlight
				? 'border-yellow'
				: 'border-line'}"
		>
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-[18px] font-black text-ink">{card.title}</h2>
				<span
					class="rounded-md px-[10px] py-[4px] text-[13px] font-extrabold {card.highlight
						? 'bg-status-preparing-bg text-phone-price'
						: 'bg-navy-tint text-navy'}"
				>
					{card.count}{card.countLabel}
				</span>
			</div>
			<p class="text-[14.5px] text-sub">{card.desc}</p>
		</a>
	{/each}
</div>
