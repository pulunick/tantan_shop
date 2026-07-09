-- =============================================================================
-- Storage: 'media' 공개 버킷 (상품/배너/시공사례 이미지, 자료실 파일)
--  - public read (버킷 public=true + select 정책)
--  - 쓰기(업로드/수정/삭제)는 admin 만 (public.is_admin())
--  업로드 파일명은 uuid, 원본명은 각 테이블 컬럼(original_name/filename)에 보존.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- 공개 읽기 (버킷이 public 이지만 RLS select 정책도 명시)
create policy "media public read"
	on storage.objects for select
	using (bucket_id = 'media');

-- admin 업로드
create policy "media admin insert"
	on storage.objects for insert
	to authenticated
	with check (bucket_id = 'media' and public.is_admin());

-- admin 수정
create policy "media admin update"
	on storage.objects for update
	to authenticated
	using (bucket_id = 'media' and public.is_admin())
	with check (bucket_id = 'media' and public.is_admin());

-- admin 삭제
create policy "media admin delete"
	on storage.objects for delete
	to authenticated
	using (bucket_id = 'media' and public.is_admin());
