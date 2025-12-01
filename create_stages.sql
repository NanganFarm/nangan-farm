-- Create stages table
create table if not exists stages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  "order" integer not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table stages enable row level security;

-- Drop existing policies
drop policy if exists "Everyone can view stages" on stages;

-- Allow everyone (authenticated) to view stages
create policy "Everyone can view stages"
on stages for select
using ( true );

-- Insert default stages (if empty)
insert into stages (name, "order")
select 'Land Preparation', 1
where not exists (select 1 from stages where name = 'Land Preparation');

insert into stages (name, "order")
select 'Planting', 2
where not exists (select 1 from stages where name = 'Planting');

insert into stages (name, "order")
select 'Growing', 3
where not exists (select 1 from stages where name = 'Growing');

insert into stages (name, "order")
select 'Harvest', 4
where not exists (select 1 from stages where name = 'Harvest');

insert into stages (name, "order")
select 'Milling', 5
where not exists (select 1 from stages where name = 'Milling');
