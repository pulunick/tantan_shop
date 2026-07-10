/**
 * 업로드 전 이미지 리사이즈/압축 (browser-image-compression 래퍼).
 * 배너/상품 등 관리자 이미지 업로드 폼에서 uploadToMedia() 호출 전에 사용한다.
 * 압축 실패 시 원본 파일을 그대로 반환해 업로드 자체는 막히지 않도록 한다.
 */
import imageCompression from 'browser-image-compression';

export type CompressImageOptions = {
	/** 리사이즈 기준 최대 가로/세로 px */
	maxWidthOrHeight?: number;
	/** 목표 최대 용량 MB */
	maxSizeMB?: number;
};

export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
	if (!file.type.startsWith('image/')) return file;

	try {
		return await imageCompression(file, {
			maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
			maxSizeMB: options.maxSizeMB ?? 1,
			useWebWorker: true,
			fileType: file.type
		});
	} catch (err) {
		console.error('이미지 압축 실패, 원본으로 업로드합니다:', err);
		return file;
	}
}

/** 바이트 -> "1.8MB" / "480KB" 표시 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
