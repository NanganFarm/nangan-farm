-- Enable RLS on cycles if not already enabled
alter table cycles enable row level security;

-- Policy for SELECT
create policy "Users can view their own cycles"
on cycles for select
using ( auth.uid() = user_id );

-- Policy for INSERT
create policy "Users can insert their own cycles"
on cycles for insert
with check ( auth.uid() = user_id );

-- Policy for UPDATE
create policy "Users can update their own cycles"
on cycles for update
using ( auth.uid() = user_id );

-- Policy for DELETE
create policy "Users can delete their own cycles"
on cycles for delete
using ( auth.uid() = user_id );

-- Milling Records Policies (if table exists)
alter table milling_records enable row level security;

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
