<script lang="ts">
	/**
	 * 상품 상세설명용 위지윅 에디터 (Tiptap, vanilla core — Svelte 5 runes로 라이프사이클 관리).
	 * 60대 대표 사용성: 툴바 버튼은 최소 구성(제목 H2/H3, 굵게, 글머리 목록, 이미지 삽입, 실행취소/재실행)만
	 * 두고, 각 버튼은 min-h-11 + 아이콘 + 라벨로 크게 표시한다. 그 이상 기능은 의도적으로 넣지 않는다.
	 *
	 * 저장 포맷: HTML 문자열 (value 로 양방향 바인딩). 실제 XSS 방어는 저장 시점에
	 * 서버(/admin/products/sanitize-description, sanitize-html)에서 정제한다 — 이 컴포넌트는
	 * 신뢰 경계가 아니라 입력 UI일 뿐이다.
	 *
	 * 이미지 삽입: 업로드 전 browser-image-compression 으로 압축(최대 1600px/약 300KB) 후
	 * uploadToMedia() 로 media 버킷에 올리고, 반환된 공개 URL을 에디터에 삽입한다.
	 */
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import { onDestroy, untrack } from 'svelte';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { uploadToMedia } from '$lib/upload';
	import { compressImage } from '$lib/image-compress';

	type Props = {
		supabase: SupabaseClient;
		value: string;
	};

	let { supabase, value = $bindable('') }: Props = $props();

	let editorEl: HTMLDivElement;
	let fileInput: HTMLInputElement;
	let editor: Editor | undefined = $state(undefined);
	let uploadingImage = $state(false);
	let imageError = $state('');

	// Tiptap 내부 트랜잭션/선택 상태는 Svelte 반응성 밖에 있으므로, 변경이 생길 때마다
	// 이 카운터를 올려 툴바의 활성(active) 표시가 다시 계산되도록 강제한다.
	let rev = $state(0);

	$effect(() => {
		// ⚠️ value 를 여기서 동기적으로 읽으면 이 effect 의 의존성이 되어, onUpdate 가 value 를
		// 쓸 때마다(=타이핑마다) 에디터가 파괴/재생성된다. untrack 으로 초기값 1회만 읽는다.
		const initialContent = untrack(() => value) || '';
		const instance = new Editor({
			element: editorEl,
			extensions: [
				StarterKit.configure({ link: false, underline: false }),
				Image.configure({ inline: false })
			],
			content: initialContent,
			onUpdate: ({ editor: e }) => {
				value = e.getHTML();
			},
			onTransaction: () => {
				rev += 1;
			}
		});
		editor = instance;

		return () => {
			instance.destroy();
		};
	});

	onDestroy(() => {
		editor?.destroy();
	});

	function isActive(name: string, attrs?: Record<string, unknown>): boolean {
		void rev; // 반응 의존성 확보용 참조
		return editor?.isActive(name, attrs) ?? false;
	}

	function openImagePicker() {
		imageError = '';
		fileInput?.click();
	}

	async function handleImageSelect(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || !editor) return;

		uploadingImage = true;
		imageError = '';
		const compressed = await compressImage(file, { maxWidthOrHeight: 1600, maxSizeMB: 0.3 });
		const result = await uploadToMedia(supabase, 'products', compressed);
		uploadingImage = false;

		if ('error' in result) {
			imageError = `이미지 업로드 실패: ${result.error}`;
			return;
		}
		editor.chain().focus().setImage({ src: result.url, alt: result.originalName }).run();
	}
</script>

<div class="rounded-[10px] border border-line-2 bg-surface">
	<div class="flex flex-wrap items-center gap-2 border-b border-line-2 bg-bg p-2.5">
		<button
			type="button"
			onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
			aria-pressed={isActive('heading', { level: 2 })}
			class="flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-[14px] font-extrabold"
			class:border-navy={isActive('heading', { level: 2 })}
			class:bg-navy-tint={isActive('heading', { level: 2 })}
			class:text-navy={isActive('heading', { level: 2 })}
			class:border-line-2={!isActive('heading', { level: 2 })}
			class:text-ink={!isActive('heading', { level: 2 })}
		>
			<span class="text-[15px] leading-none font-black">H2</span>
			큰제목
		</button>
		<button
			type="button"
			onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
			aria-pressed={isActive('heading', { level: 3 })}
			class="flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-[14px] font-extrabold"
			class:border-navy={isActive('heading', { level: 3 })}
			class:bg-navy-tint={isActive('heading', { level: 3 })}
			class:text-navy={isActive('heading', { level: 3 })}
			class:border-line-2={!isActive('heading', { level: 3 })}
			class:text-ink={!isActive('heading', { level: 3 })}
		>
			<span class="text-[14px] leading-none font-black">H3</span>
			작은제목
		</button>

		<span class="mx-1 h-7 w-px bg-line-2" aria-hidden="true"></span>

		<button
			type="button"
			onclick={() => editor?.chain().focus().toggleBold().run()}
			aria-pressed={isActive('bold')}
			class="flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-[14px] font-extrabold"
			class:border-navy={isActive('bold')}
			class:bg-navy-tint={isActive('bold')}
			class:text-navy={isActive('bold')}
			class:border-line-2={!isActive('bold')}
			class:text-ink={!isActive('bold')}
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M6 4h6a4 4 0 0 1 0 8H6z" />
				<path d="M6 12h7a4 4 0 0 1 0 8H6z" />
			</svg>
			굵게
		</button>

		<button
			type="button"
			onclick={() => editor?.chain().focus().toggleBulletList().run()}
			aria-pressed={isActive('bulletList')}
			class="flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-[14px] font-extrabold"
			class:border-navy={isActive('bulletList')}
			class:bg-navy-tint={isActive('bulletList')}
			class:text-navy={isActive('bulletList')}
			class:border-line-2={!isActive('bulletList')}
			class:text-ink={!isActive('bulletList')}
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="9" y1="6" x2="21" y2="6" />
				<line x1="9" y1="12" x2="21" y2="12" />
				<line x1="9" y1="18" x2="21" y2="18" />
				<circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
				<circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
				<circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
			</svg>
			목록
		</button>

		<span class="mx-1 h-7 w-px bg-line-2" aria-hidden="true"></span>

		<button
			type="button"
			onclick={openImagePicker}
			disabled={uploadingImage}
			class="flex min-h-11 items-center gap-1.5 rounded-lg border border-line-2 px-3 text-[14px] font-extrabold text-ink disabled:opacity-50"
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<circle cx="8.5" cy="8.5" r="1.5" />
				<path d="M21 15l-5-5L5 21" />
			</svg>
			{uploadingImage ? '업로드 중…' : '사진 삽입'}
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			onchange={handleImageSelect}
			class="sr-only"
		/>

		<span class="mx-1 h-7 w-px bg-line-2" aria-hidden="true"></span>

		<button
			type="button"
			onclick={() => editor?.chain().focus().undo().run()}
			disabled={!(editor?.can().undo() ?? false)}
			aria-label="실행취소"
			class="flex min-h-11 items-center gap-1.5 rounded-lg border border-line-2 px-3 text-[14px] font-extrabold text-ink disabled:opacity-40"
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<polyline points="9 14 4 9 9 4" />
				<path d="M20 20v-7a4 4 0 0 0-4-4H4" />
			</svg>
			실행취소
		</button>
		<button
			type="button"
			onclick={() => editor?.chain().focus().redo().run()}
			disabled={!(editor?.can().redo() ?? false)}
			aria-label="다시실행"
			class="flex min-h-11 items-center gap-1.5 rounded-lg border border-line-2 px-3 text-[14px] font-extrabold text-ink disabled:opacity-40"
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<polyline points="15 14 20 9 15 4" />
				<path d="M4 20v-7a4 4 0 0 1 4-4h12" />
			</svg>
			다시실행
		</button>
	</div>

	{#if imageError}
		<p
			class="border-b border-line-2 bg-status-cancelled-bg px-3.5 py-2 text-[13.5px] font-bold text-status-cancelled-fg"
		>
			{imageError}
		</p>
	{/if}

	<div
		bind:this={editorEl}
		class="prose prose-headings:text-ink prose-img:rounded-lg max-w-none px-4 py-3.5 text-[15px] text-ink focus-within:outline-none [&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:outline-none"
	></div>
</div>
