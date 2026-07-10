<script lang="ts">
	/**
	 * 상품 등록/수정 공용 폼. new/[id] 라우트에서 함께 사용한다.
	 * 이미지 업로드는 브라우저 Supabase 클라이언트로 media 버킷에 직접 업로드하고,
	 * 저장(등록/수정)도 client-side 로 products/product_options/product_images 에 반영한다
	 * (admin 은 RLS 상 브라우저 클라이언트로도 쓰기가 허용됨).
	 *
	 * 절대 규칙: 전화문의(가격 대신 표시) 선택 시 price=null, is_price_hidden=true 로 저장한다.
	 * 재고 수량 개념은 존재하지 않는다 — status(on_sale/sold_out/hidden) 로만 관리.
	 */
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { uploadToMedia, removeFromMedia } from '$lib/upload';
	import { compressImage } from '$lib/image-compress';
	import { formatNumberInput, parseNumberInput } from '$lib/utils/format';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import type { Category, ProductStatus } from '$lib/types';

	export type ProductFormOption = { id?: string; name: string; extraPrice: number };
	export type ProductFormImage = {
		id?: string;
		url: string;
		originalName: string | null;
		isThumbnail: boolean;
	};
	export type ProductFormInitial = {
		name: string;
		categoryId: string | null;
		price: number | null;
		isPriceHidden: boolean;
		status: ProductStatus;
		descriptionHtml: string | null;
		options: ProductFormOption[];
		images: ProductFormImage[];
	};

	type Props = {
		supabase: SupabaseClient;
		categories: Category[];
		productId?: string;
		initial: ProductFormInitial;
	};

	let { supabase, categories, productId, initial }: Props = $props();

	// 폼은 최초 initial 값으로 1회만 초기화한다(이후 편집은 로컬 상태). $props 참조가
	// 초기값만 캡처하는 것이 의도이므로 untrack 으로 명시해 반응성 경고를 방지한다.
	const init = untrack(() => initial);

	let name = $state(init.name);
	let categoryId = $state(init.categoryId ?? untrack(() => categories)[0]?.id ?? '');
	let isPhoneInquiry = $state(init.isPriceHidden);
	let priceInput = $state(init.price != null ? formatNumberInput(String(init.price)) : '');
	let status = $state<ProductStatus>(init.status);
	let descriptionHtml = $state(init.descriptionHtml ?? '');

	type OptionRow = { id?: string; name: string; extraPrice: string };
	let optionRows = $state<OptionRow[]>(
		init.options.map((o) => ({ id: o.id, name: o.name, extraPrice: String(o.extraPrice) }))
	);

	type ImageRow = {
		id?: string;
		url: string;
		originalName: string | null;
		path?: string;
		isThumbnail: boolean;
	};
	let imageRows = $state<ImageRow[]>(
		init.images.map((img) => ({
			id: img.id,
			url: img.url,
			originalName: img.originalName,
			isThumbnail: img.isThumbnail
		}))
	);

	let uploading = $state(false);
	let saving = $state(false);
	let errorMsg = $state('');

	const statusOptions: { value: ProductStatus; label: string }[] = [
		{ value: 'on_sale', label: '판매중' },
		{ value: 'sold_out', label: '품절' },
		{ value: 'hidden', label: '숨김' }
	];

	function addOption() {
		optionRows.push({ name: '', extraPrice: '0' });
	}

	function removeOption(index: number) {
		optionRows.splice(index, 1);
	}

	async function handleFiles(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;

		uploading = true;
		errorMsg = '';

		for (const file of Array.from(files)) {
			// 업로드 전 클라이언트 압축(최대 1600px / 약 300KB). 실패 시 원본으로 업로드한다.
			const compressed = await compressImage(file, { maxWidthOrHeight: 1600, maxSizeMB: 0.3 });
			const result = await uploadToMedia(supabase, 'products', compressed);
			if ('error' in result) {
				errorMsg = `이미지 업로드 실패(${file.name}): ${result.error}`;
				continue;
			}
			imageRows.push({
				url: result.url,
				originalName: result.originalName,
				path: result.path,
				isThumbnail: imageRows.length === 0
			});
		}

		uploading = false;
		input.value = '';
	}

	async function removeImage(index: number) {
		const img = imageRows[index];
		const wasThumbnail = img.isThumbnail;
		imageRows.splice(index, 1);
		if (wasThumbnail && imageRows.length > 0) {
			imageRows[0].isThumbnail = true;
		}
		// 이번 세션에 새로 업로드한 파일만 storage 경로를 알고 있어 즉시 정리한다.
		if (img.path) {
			await removeFromMedia(supabase, img.path);
		}
	}

	function moveImage(index: number, dir: -1 | 1) {
		const target = index + dir;
		if (target < 0 || target >= imageRows.length) return;
		const tmp = imageRows[index];
		imageRows[index] = imageRows[target];
		imageRows[target] = tmp;
	}

	function setThumbnail(index: number) {
		imageRows.forEach((img, i) => {
			img.isThumbnail = i === index;
		});
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMsg = '';

		const trimmedName = name.trim();
		if (!trimmedName) {
			errorMsg = '상품명을 입력해 주세요.';
			return;
		}
		if (!categoryId) {
			errorMsg = '카테고리를 선택해 주세요.';
			return;
		}

		let price: number | null = null;
		if (!isPhoneInquiry) {
			const n = parseNumberInput(priceInput);
			if (n == null || n < 0) {
				errorMsg = '판매가를 올바르게 입력해 주세요.';
				return;
			}
			price = n;
		}

		if (imageRows.length === 0) {
			errorMsg = '상품 이미지를 최소 1장 업로드해 주세요.';
			return;
		}

		saving = true;

		// 상세설명(Tiptap HTML)은 저장 전 서버에서 sanitize 한다 — admin 전용 입력이라도
		// 계정 탈취 등에 대비한 XSS 방어(CLAUDE.md 관리자 UI 보강 요구사항).
		let descriptionHtmlSafe: string | null = null;
		const trimmedDescription = descriptionHtml.trim();
		if (trimmedDescription) {
			try {
				const res = await fetch(resolve('/admin/products/sanitize-description'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ html: trimmedDescription })
				});
				if (!res.ok) throw new Error('sanitize failed');
				const json = (await res.json()) as { html: string };
				descriptionHtmlSafe = json.html || null;
			} catch {
				errorMsg = '상세설명 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
				saving = false;
				return;
			}
		}

		const payload = {
			category_id: categoryId,
			name: trimmedName,
			price,
			is_price_hidden: isPhoneInquiry,
			status,
			description_html: descriptionHtmlSafe
		};

		let id = productId;
		if (id) {
			const { error: updErr } = await supabase.from('products').update(payload).eq('id', id);
			if (updErr) {
				errorMsg = '상품 저장 중 오류가 발생했습니다.';
				saving = false;
				return;
			}
		} else {
			const { data: inserted, error: insErr } = await supabase
				.from('products')
				.insert(payload)
				.select('id')
				.single();
			if (insErr || !inserted) {
				errorMsg = '상품 저장 중 오류가 발생했습니다.';
				saving = false;
				return;
			}
			id = inserted.id as string;
		}

		// 옵션/이미지는 전체 삭제 후 현재 화면 상태로 재삽입한다(단순·확실한 반영).
		await supabase.from('product_options').delete().eq('product_id', id);
		const validOptions = optionRows.filter((o) => o.name.trim());
		if (validOptions.length > 0) {
			const { error: optErr } = await supabase.from('product_options').insert(
				validOptions.map((o, i) => ({
					product_id: id,
					name: o.name.trim(),
					extra_price: Number(o.extraPrice) || 0,
					sort_order: i
				}))
			);
			if (optErr) {
				errorMsg = '옵션 저장 중 오류가 발생했습니다.';
				saving = false;
				return;
			}
		}

		await supabase.from('product_images').delete().eq('product_id', id);
		const { error: imgErr } = await supabase.from('product_images').insert(
			imageRows.map((img, i) => ({
				product_id: id,
				url: img.url,
				original_name: img.originalName,
				sort_order: i,
				is_thumbnail: img.isThumbnail
			}))
		);
		if (imgErr) {
			errorMsg = '이미지 저장 중 오류가 발생했습니다.';
			saving = false;
			return;
		}

		saving = false;
		await goto(resolve('/admin/products'));
	}
</script>

<form
	onsubmit={handleSubmit}
	class="flex flex-col gap-6 rounded-xl border border-line-2 bg-surface p-7"
>
	{#if errorMsg}
		<p
			role="alert"
			class="rounded-lg border border-line-2 bg-status-cancelled-bg px-4 py-3 text-[14.5px] font-bold text-status-cancelled-fg"
		>
			{errorMsg}
		</p>
	{/if}

	<div>
		<label for="pf-category" class="mb-2.5 block text-[16px] font-extrabold text-ink"
			>카테고리</label
		>
		<select
			id="pf-category"
			bind:value={categoryId}
			required
			class="min-h-11 w-full rounded-[10px] border border-line-2 bg-surface px-4 py-3.5 text-[16px] font-semibold text-ink focus:ring-2 focus:ring-navy focus:outline-none"
		>
			{#each categories as cat (cat.id)}
				<option value={cat.id}>{cat.name}</option>
			{/each}
		</select>
	</div>

	<div>
		<label for="pf-name" class="mb-2.5 block text-[16px] font-extrabold text-ink">상품명</label>
		<input
			id="pf-name"
			type="text"
			bind:value={name}
			required
			placeholder="예) 자기질 점자블럭(논슬립) 15T 점형"
			class="min-h-11 w-full rounded-[10px] border border-line-2 bg-surface px-4 py-3.5 text-[16px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
		/>
	</div>

	<div>
		<span class="mb-2.5 block text-[16px] font-extrabold text-ink">판매상태</span>
		<div class="flex flex-wrap gap-3">
			{#each statusOptions as opt (opt.value)}
				<label
					class="flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border px-4 text-[15px] font-bold"
					class:border-navy={status === opt.value}
					class:bg-navy-tint={status === opt.value}
					class:text-navy={status === opt.value}
					class:border-line-2={status !== opt.value}
					class:text-ink={status !== opt.value}
				>
					<input
						type="radio"
						name="pf-status"
						value={opt.value}
						checked={status === opt.value}
						onchange={() => (status = opt.value)}
						class="h-[18px] w-[18px] accent-navy"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
	</div>

	<div>
		<label for="pf-price" class="mb-2.5 block text-[16px] font-extrabold text-ink">판매가</label>
		<div class="flex items-center gap-2.5">
			<input
				id="pf-price"
				type="text"
				inputmode="numeric"
				value={priceInput}
				oninput={(e) => (priceInput = formatNumberInput(e.currentTarget.value))}
				disabled={isPhoneInquiry}
				placeholder="숫자만 입력"
				class="min-h-11 flex-1 rounded-[10px] border border-line-2 px-4 py-3.5 text-[16px] text-ink focus:ring-2 focus:ring-navy focus:outline-none disabled:bg-bg disabled:text-sub"
			/>
			<span class="text-[16px] font-bold text-sub">원</span>
		</div>
		<label
			class="mt-3 flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-bold text-ink"
		>
			<input type="checkbox" bind:checked={isPhoneInquiry} class="h-[20px] w-[20px] accent-navy" />
			가격 대신 '전화문의'로 표시 (온라인 결제 제외)
		</label>
	</div>

	<div>
		<span class="mb-2.5 block text-[16px] font-extrabold text-ink">옵션</span>
		<div class="flex flex-col gap-2.5">
			{#each optionRows as row, i (i)}
				<div class="flex items-center gap-2.5">
					<label class="sr-only" for={`pf-opt-name-${i}`}>옵션명</label>
					<input
						id={`pf-opt-name-${i}`}
						type="text"
						bind:value={row.name}
						placeholder="옵션명 (예: 점형)"
						class="min-h-11 flex-1 rounded-[10px] border border-line-2 px-3.5 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
					/>
					<label class="sr-only" for={`pf-opt-extra-${i}`}>추가금액</label>
					<input
						id={`pf-opt-extra-${i}`}
						type="number"
						step="1"
						inputmode="numeric"
						bind:value={row.extraPrice}
						placeholder="추가금액"
						class="min-h-11 w-[150px] rounded-[10px] border border-line-2 px-3.5 py-3 text-[15px] text-ink focus:ring-2 focus:ring-navy focus:outline-none"
					/>
					<button
						type="button"
						onclick={() => removeOption(i)}
						aria-label="옵션 삭제"
						class="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] border border-line-2 bg-bg text-status-cancelled-fg"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							aria-hidden="true"
						>
							<path d="M6 6l12 12M18 6L6 18" />
						</svg>
					</button>
				</div>
			{/each}
		</div>
		<button
			type="button"
			onclick={addOption}
			class="mt-3 w-full min-h-11 rounded-[10px] border border-dashed border-line-2 bg-bg py-3 text-[15px] font-extrabold text-navy"
		>
			+ 옵션 추가
		</button>
	</div>

	<div>
		<span class="mb-2.5 block text-[16px] font-extrabold text-ink">상품 이미지</span>
		<label
			for="pf-image-input"
			class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line-2 bg-bg px-7 py-7 text-center"
		>
			<svg
				width="30"
				height="30"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-sub"
				aria-hidden="true"
			>
				<path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
			</svg>
			<span class="text-[16px] font-extrabold text-ink">클릭하여 사진 선택</span>
			<span class="text-[14px] text-sub">여러 장 업로드 가능 (JPG, PNG)</span>
		</label>
		<input
			id="pf-image-input"
			type="file"
			accept="image/*"
			multiple
			onchange={handleFiles}
			class="sr-only"
		/>
		{#if uploading}
			<p class="mt-2 text-[14px] font-bold text-navy">업로드 중…</p>
		{/if}

		{#if imageRows.length > 0}
			<ul class="mt-3.5 flex flex-wrap gap-3">
				{#each imageRows as img, i (img.id ?? img.url)}
					<li class="flex flex-col items-center gap-1.5">
						<div
							class="relative h-24 w-24 overflow-hidden rounded-[10px] border-2"
							class:border-navy={img.isThumbnail}
							class:border-line-2={!img.isThumbnail}
						>
							<img
								src={img.url}
								alt={img.originalName ?? '상품 이미지'}
								loading="lazy"
								class="h-full w-full object-cover"
							/>
							{#if img.isThumbnail}
								<span
									class="absolute top-1 left-1 rounded-md bg-navy px-1.5 py-0.5 text-[11px] font-extrabold text-white"
									>대표</span
								>
							{/if}
						</div>
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => moveImage(i, -1)}
								disabled={i === 0}
								aria-label="앞으로 이동"
								class="flex h-8 w-8 items-center justify-center rounded-md border border-line-2 text-ink disabled:opacity-40"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M15 18l-6-6 6-6" />
								</svg>
							</button>
							<button
								type="button"
								onclick={() => setThumbnail(i)}
								disabled={img.isThumbnail}
								class="rounded-md border border-line-2 px-2 py-1 text-[12px] font-extrabold text-navy disabled:opacity-40"
							>
								대표지정
							</button>
							<button
								type="button"
								onclick={() => moveImage(i, 1)}
								disabled={i === imageRows.length - 1}
								aria-label="뒤로 이동"
								class="flex h-8 w-8 items-center justify-center rounded-md border border-line-2 text-ink disabled:opacity-40"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M9 6l6 6-6 6" />
								</svg>
							</button>
							<button
								type="button"
								onclick={() => removeImage(i)}
								aria-label="이미지 삭제"
								class="flex h-8 w-8 items-center justify-center rounded-md border border-line-2 text-status-cancelled-fg"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									aria-hidden="true"
								>
									<path d="M6 6l12 12M18 6L6 18" />
								</svg>
							</button>
						</div>
					</li>
				{/each}
			</ul>
			<p class="mt-2 text-[13px] text-sub">
				· ◀▶ 로 순서를 바꾸고, '대표지정'으로 목록/상세에 보일 대표 이미지를 지정하세요.
			</p>
		{/if}
	</div>

	<div>
		<span class="mb-2.5 block text-[16px] font-extrabold text-ink">상세설명</span>
		<RichTextEditor {supabase} bind:value={descriptionHtml} />
	</div>

	<div class="flex gap-3.5 pt-1">
		<a
			href={resolve('/admin/products')}
			class="flex flex-1 min-h-11 items-center justify-center rounded-[11px] border border-line-2 bg-surface text-[17px] font-extrabold text-ink"
		>
			취소
		</a>
		<button
			type="submit"
			disabled={saving || uploading}
			class="flex flex-[2] min-h-11 items-center justify-center rounded-[11px] bg-navy text-[17px] font-black text-white disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-sub"
		>
			{saving ? '저장 중…' : '저장하기'}
		</button>
	</div>
</form>
