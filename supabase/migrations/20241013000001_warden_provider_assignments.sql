-- Create warden-provider assignment table
-- This allows architects to assign providers to wardens
-- Providers can then monitor ALL sentinels owned by their assigned wardens

create table public.warden_provider_assignments (
  warden_id uuid not null,
  provider_id uuid not null,
  assigned_by uuid not null, -- architect who made the assignment
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  active boolean not null default true,
  notes text null, -- architect notes about the assignment
  constraint warden_provider_assignments_pkey primary key (warden_id, provider_id),
  constraint warden_provider_assignments_warden_id_fkey foreign key (warden_id) references auth.users (id) on delete cascade,
  constraint warden_provider_assignments_provider_id_fkey foreign key (provider_id) references providers (user_id) on delete cascade,
  constraint warden_provider_assignments_assigned_by_fkey foreign key (assigned_by) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Indexes for performance
create index idx_warden_provider_assignments_warden on public.warden_provider_assignments using btree (warden_id) tablespace pg_default;
create index idx_warden_provider_assignments_provider on public.warden_provider_assignments using btree (provider_id) tablespace pg_default;
create index idx_warden_provider_assignments_active on public.warden_provider_assignments using btree (active) tablespace pg_default
where (active = true);

-- Trigger for updated_at
create trigger trg_warden_provider_assignments_updated_at before update on warden_provider_assignments for each row
execute function set_updated_at();

-- Create view for provider dashboard to get assigned wardens with their details
create or replace view v_provider_assigned_wardens as
select 
  wpa.provider_id,
  wpa.warden_id,
  wpa.assigned_by,
  wpa.created_at as assigned_at,
  wpa.notes as assignment_notes,
  wpa.active,
  wp.email as warden_email,
  wp.display_name as warden_display_name,
  wp.created_at as warden_registered_at,
  ap.display_name as assigned_by_name,
  count(s.id) as sentinel_count,
  count(d.id) as device_count,
  max(de.created_at) as latest_activity
from warden_provider_assignments wpa
join profiles wp on wp.id = wpa.warden_id and wp.role = 'warden'
join profiles ap on ap.id = wpa.assigned_by
left join sentinels s on s.owner_guardian_id = wpa.warden_id
left join devices d on d.sentinel_id = s.id
left join device_events de on de.device_id = d.id and de.created_at >= (now() - interval '24 hours')
where wpa.active = true
group by wpa.provider_id, wpa.warden_id, wpa.assigned_by, wpa.created_at, wpa.notes, wpa.active,
         wp.email, wp.display_name, wp.created_at, ap.display_name;

-- Create view for architect dashboard to manage assignments
create or replace view v_architect_warden_provider_assignments as
select 
  wpa.warden_id,
  wpa.provider_id,
  wpa.assigned_by,
  wpa.created_at as assigned_at,
  wpa.updated_at,
  wpa.active,
  wpa.notes,
  wp.email as warden_email,
  wp.display_name as warden_display_name,
  pp.email as provider_email,
  pp.display_name as provider_display_name,
  prov.display_name as provider_company_name,
  count(s.id) as warden_sentinel_count
from warden_provider_assignments wpa
join profiles wp on wp.id = wpa.warden_id and wp.role = 'warden'
join providers prov on prov.user_id = wpa.provider_id
join profiles pp on pp.id = wpa.provider_id and pp.role = 'provider'
left join sentinels s on s.owner_guardian_id = wpa.warden_id
group by wpa.warden_id, wpa.provider_id, wpa.assigned_by, wpa.created_at, wpa.updated_at, 
         wpa.active, wpa.notes, wp.email, wp.display_name, pp.email, pp.display_name, 
         prov.display_name;

-- RLS Policies
alter table public.warden_provider_assignments enable row level security;

-- Architects can manage all assignments
create policy "Architects can manage warden-provider assignments" on public.warden_provider_assignments
  for all using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'architect'
    )
  );

-- Providers can view their own assignments
create policy "Providers can view their assignments" on public.warden_provider_assignments
  for select using (
    provider_id = auth.uid() and active = true
  );

-- Wardens can view assignments where they are the warden
create policy "Wardens can view their provider assignments" on public.warden_provider_assignments
  for select using (
    warden_id = auth.uid() and active = true
  );