insert into public.services (slug, name) values
  ('home-care', 'Home Care'),
  ('assisted-living', 'Assisted Living'),
  ('memory-care', 'Memory Care'),
  ('skilled-nursing', 'Skilled Nursing'),
  ('respite-care', 'Respite Care')
on conflict (slug) do nothing;


