-- Add launcher display options to widgets table
alter table widgets add column launcher_mode text default 'icon' check (launcher_mode in ('icon', 'text'));
alter table widgets add column launcher_text text;
