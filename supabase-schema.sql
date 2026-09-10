-- Alwatin / Supabase schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  name_ar text not null,
  name_fr text not null,
  name_en text not null,
  description_ar text not null default '',
  description_fr text not null default '',
  description_en text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  image_url text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  compare_price numeric(10,2) not null default 0 check (compare_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  pleats text not null default '',
  sku text not null unique,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists colors jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists pleats text not null default '';

create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'الوَتِين',
  tagline text not null default 'لباس مغربي تقليدي',
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  payment text not null default 'cod',
  delivery_fee numeric(10,2) not null default 35,
  free_delivery_from numeric(10,2) not null default 800,
  delivery_time text not null default '24 إلى 72 ساعة',
  delivery_areas text not null default 'جميع المدن المغربية',
  currency text not null default 'MAD',
  default_language text not null default 'ar',
  languages jsonb not null default '["ar","fr","en"]'::jsonb,
  instagram text not null default '',
  facebook text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id boolean primary key default true check (id),
  hero_ar text not null default '',
  hero_fr text not null default '',
  hero_en text not null default '',
  home_description text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  seo_keywords text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null default '',
  language text not null default 'ar',
  payment_method text not null default 'cod',
  status text not null default 'new' check (status in ('new','confirmed','shipping','completed','cancelled')),
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text not null default '',
  size text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null default 0,
  line_total numeric(10,2) not null default 0
);

create index if not exists products_active_index on public.products(active, featured);
create index if not exists orders_status_index on public.orders(status, created_at desc);
create index if not exists order_items_order_index on public.order_items(order_id);

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.site_content enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select auth.email() = 'admin@example.com' or exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

drop policy if exists "public can view active products" on public.products;
create policy "public can view active products" on public.products for select using (active = true or public.is_admin());
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public can read store settings" on public.store_settings;
create policy "public can read store settings" on public.store_settings for select using (true);
drop policy if exists "admins manage store settings" on public.store_settings;
create policy "admins manage store settings" on public.store_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public can read site content" on public.site_content;
create policy "public can read site content" on public.site_content for select using (true);
drop policy if exists "admins manage site content" on public.site_content;
create policy "admins manage site content" on public.site_content for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public can create orders" on public.orders;
create policy "public can create orders" on public.orders for insert with check (true);
drop policy if exists "admins view orders" on public.orders;
create policy "admins view orders" on public.orders for select using (public.is_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public can create order items" on public.order_items;
create policy "public can create order items" on public.order_items for insert with check (true);
drop policy if exists "admins view order items" on public.order_items;
create policy "admins view order items" on public.order_items for select using (public.is_admin());

insert into public.store_settings (id) values (true) on conflict (id) do nothing;
insert into public.site_content (id) values (true) on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public can view product images" on storage.objects;
create policy "public can view product images" on storage.objects
for select using (bucket_id = 'product-images');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images" on storage.objects
for update using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
for delete using (bucket_id = 'product-images' and public.is_admin());

-- After creating your Supabase Auth user, replace the email below and run:
-- insert into public.admin_users (user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
