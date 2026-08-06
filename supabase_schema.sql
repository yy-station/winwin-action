-- ============================================================
-- YY大脑发电站 · Supabase 数据表
-- 使用方法：在 Supabase 后台左侧 "SQL Editor" 里粘贴本文件全部内容，点 "Run" 执行一次即可。
-- 作用：建一张 app_data 表，并用 RLS 策略保证每个用户只能访问自己的数据。
-- ============================================================

-- 1. 建表
create table if not exists app_data (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  value       jsonb,
  updated_at  timestamptz default now(),
  unique (user_id, key)
);

-- 2. 加速查询的索引
create index if not exists app_data_uid_idx on app_data(user_id);

-- 3. 开启行级安全（RLS）
alter table app_data enable row level security;

-- 4. 策略：只允许本人读写自己的数据
drop policy if exists "own data rw" on app_data;
create policy "own data rw" on app_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
