/**
 * media 버킷 업로드 헬퍼 (관리자 브라우저에서 사용).
 * 규칙: 저장 파일명은 uuid, 원본 파일명은 반환값으로 넘겨 DB 컬럼(original_name/filename)에 보존한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type UploadOk = { url: string; path: string; originalName: string; size: number };
export type UploadResult = UploadOk | { error: string };

/**
 * @param folder 버킷 내 폴더 (예: 'products' | 'banners' | 'cases' | 'archive')
 */
export async function uploadToMedia(
	supabase: SupabaseClient,
	folder: string,
	file: File
): Promise<UploadResult> {
	const dot = file.name.lastIndexOf('.');
	const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
	const path = `${folder}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

	const { error } = await supabase.storage.from('media').upload(path, file, {
		cacheControl: '3600',
		upsert: false,
		contentType: file.type || undefined
	});
	if (error) return { error: error.message };

	const { data } = supabase.storage.from('media').getPublicUrl(path);
	return { url: data.publicUrl, path, originalName: file.name, size: file.size };
}

/** 업로드된 파일 삭제 (교체/취소 시). */
export async function removeFromMedia(supabase: SupabaseClient, path: string): Promise<void> {
	await supabase.storage.from('media').remove([path]);
}
