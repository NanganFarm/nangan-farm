-- Enable RLS on cycles if not already enabled
alter table cycles enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own cycles" on cycles;
drop policy if exists "Users can insert their own cycles" on cycles;
drop policy if exists "Users can update their own cycles" on cycles;
drop policy if exists "Users can delete their own cycles" on cycles;

-- Re-create policies
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

-- Milling Records Policies
-- Check if table exists first (optional, but good practice if we can, but SQL is declarative)
-- We'll just assume it exists or the user created it. 
-- If milling_records doesn't exist, these will fail, which is fine as it alerts the user they missed a step.

alter table milling_records enable row level security;

drop policy if exists "Users can view their own milling records" on milling_records;
drop policy if exists "Users can insert their own milling records" on milling_records;

create policy "Users can view their own milling records"
on milling_records for select
using ( 
  exists (
    select 1 from cycles 
    where cycles.id = milling_records.cycle_id 
    and cycles.user_id = auth.uid()
  )
);

create policy "Users can insert their own milling records"
on milling_records for insert
with check (
  exists (
    select 1 from cycles 
    where cycles.id = milling_records.cycle_id 
    and cycles.user_id = auth.uid()
  )
);
