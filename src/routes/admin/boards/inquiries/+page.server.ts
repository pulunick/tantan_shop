import type { PageServerLoad } from './$types';

/**
 * 문의 답변 목록. 미답변 필터 기본, 유형 배지·비밀글 아이콘 표시.
 * inquiries.user_id 는 auth.users 참조라 profiles 와 직접 FK 조인이 안 되므로
 * 회원 문의의 작성자 이름은 profiles 를 별도 조회해 매핑한다.
 */

const PAGE_SIZE = 20;

export type InquiryFilter = 'waiting' | 'all';
export type InquiryType = 'general' | 'quote' | 'reservation';

export type InquiryRow = {
	id: string;
	type: InquiryType;
	title: string;
	is_secret: boolean;
	status: 'waiting' | 'answered';
	created_at: string;
	authorName: string;
};

type InquiryRawRow = {
	id: string;
	type: InquiryType;
	title: string;
	is_secret: boolean;
	status: 'waiting' | 'answered';
	created_at: string;
	user_id: string | null;
	guest_name: string | null;
};

function parseFilter(value: string | null): InquiryFilter {
	return value === 'all' ? 'all' : 'waiting';
}

function parsePage(value: string | null): number {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : 1;
}

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const filter = parseFilter(url.searchParams.get('filter'));
	const page = parsePage(url.searchParams.get('page'));

	let query = supabase
		.from('inquiries')
		.select('id, type, title, is_secret, status, created_at, user_id, guest_name', {
			count: 'exact'
		});

	if (filter === 'waiting') query = query.eq('status', 'waiting');

	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;
	const { data, count } = await query.order('created_at', { ascending: false }).range(from, to);

	const rows = (data ?? []) as InquiryRawRow[];
	const memberIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))];

	let nameMap: Record<string, string> = {};
	if (memberIds.length > 0) {
		const { data: profiles } = await supabase
			.from('profiles')
			.select('id, name')
			.in('id', memberIds);
		nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name ?? '(이름 없음)']));
	}

	const [{ count: waitingCount }] = await Promise.all([
		supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'waiting')
	]);

	const inquiries: InquiryRow[] = rows.map((r) => ({
		id: r.id,
		type: r.type,
		title: r.title,
		is_secret: r.is_secret,
		status: r.status,
		created_at: r.created_at,
		authorName: r.user_id ? (nameMap[r.user_id] ?? '회원') : (r.guest_name ?? '비회원')
	}));

	return {
		inquiries,
		total: count ?? 0,
		page,
		pageSize: PAGE_SIZE,
		filter,
		waitingCount: waitingCount ?? 0
	};
};
