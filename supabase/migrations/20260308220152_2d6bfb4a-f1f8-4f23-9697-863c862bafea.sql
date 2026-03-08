create policy "No direct access to demo usage"
on public.demo_usage
as restrictive
for all
to authenticated, anon
using (false)
with check (false);