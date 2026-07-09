import type { PageServerLoad } from './$types';

/**
 * 자료실. board_type='archive' 글에 딸린 첨부파일을 평탄화해 다운로드 목록으로 보여준다.
 * (글 1개에 여러 파일이 달릴 수 있어, 글 최신순 → 글 내 sort_order 순으로 나열)
 */

export type ArchiveFileRow = {
	fileId: string;
	postId: string;
	postTitle: string;
	filename: string;
	url: string;
	sizeLabel: string | null;
};

type PostFileRow = {
	id: string;
	url: string;
	filename: string;
	filesize: number | null;
	sort_order: number;
};

type ArchivePostRow = {
	id: string;
	title: string;
	created_at: string;
	post_files: PostFileRow[] | null;
};

/** 바이트 → "12.4 MB" / "240 KB" / "512 B" 형태로 표시. */
function formatFileSize(bytes: number | null): string | null {
	if (bytes == null) return null;
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
	const mb = kb / 1024;
	return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('posts')
		.select('id,title,created_at,post_files(id,url,filename,filesize,sort_order)')
		.eq('board_type', 'archive')
		.eq('is_visible', true)
		.order('created_at', { ascending: false });

	const posts = (data ?? []) as unknown as ArchivePostRow[];

	const files: ArchiveFileRow[] = posts.flatMap((post) => {
		const sortedFiles = [...(post.post_files ?? [])].sort((a, b) => a.sort_order - b.sort_order);
		return sortedFiles.map((file) => ({
			fileId: file.id,
			postId: post.id,
			postTitle: post.title,
			filename: file.filename,
			url: file.url,
			sizeLabel: formatFileSize(file.filesize)
		}));
	});

	return { files };
};
