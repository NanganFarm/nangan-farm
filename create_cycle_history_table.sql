-- Create cycle_stage_history table
create table if not exists cycle_stage_history (
  id uuid default uuid_generate_v4() primary key,
  cycle_id uuid references cycles(id) on delete cascade,
  stage_id uuid references stages(id),
  entered_at timestamp with time zone default now()
);

-- Enable RLS
alter table cycle_stage_history enable row level security;

-- Policies
create policy "Users can view their own cycle history"
on cycle_stage_history for select
using (
  exists (
    select 1 from cycles
    where cycles.id = cycle_stage_history.cycle_id
    and cycles.user_id = auth.uid()
  )
);

create policy "Users can insert their own cycle history"
on cycle_stage_history for insert
with check (
  exists (
    select 1 from cycles
    where cycles.id = cycle_stage_history.cycle_id
    and cycles.user_id = auth.uid()
  )
);
