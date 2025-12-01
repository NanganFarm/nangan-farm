-- 1. Create milling_records table
create table if not exists milling_records (
  id uuid default uuid_generate_v4() primary key,
  cycle_id uuid references cycles(id) on delete cascade,
  lkg_per_ton numeric,
  sugar_price numeric,
  planters_share_percent numeric,
  net_amount numeric,
  gross_amount numeric,
  milling_date timestamp with time zone default now(),
  receipt_urls text[]
);

-- 2. Enable RLS on cycles
alter table cycles enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own cycles" on cycles;
drop policy if exists "Users can insert their own cycles" on cycles;
drop policy if exists "Users can update their own cycles" on cycles;
drop policy if exists "Users can delete their own cycles" on cycles;

-- Re-create policies for cycles
create policy "Users can view their own cycles"
on cycles for select
using ( auth.uid() = user_id );

create policy "Users can insert their own cycles"
on cycles for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own cycles"
on cycles for update
using ( auth.uid() = user_id );

create policy "Users can delete their own cycles"
on cycles for delete
using ( auth.uid() = user_id );

-- 3. Enable RLS on milling_records
alter table milling_records enable row level security;

drop policy if exists "Users can view their own milling records" on milling_records;
drop policy if exists "Users can insert their own milling records" on milling_records;

-- Policy: Users can view milling records if they own the related cycle
create policy "Users can view their own milling records"
on milling_records for select
using ( 
  exists (
    select 1 from cycles 
    where cycles.id = milling_records.cycle_id 
    and cycles.user_id = auth.uid()
  )
);

-- Policy: Users can insert milling records if they own the related cycle
create policy "Users can insert their own milling records"
on milling_records for insert
with check (
  exists (
    select 1 from cycles 
    where cycles.id = milling_records.cycle_id 
    and cycles.user_id = auth.uid()
  )
);
