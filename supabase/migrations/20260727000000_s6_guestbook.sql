-- S6: projeção pública segura para o mural.
--
-- guests e claims continuam sem políticas públicas. Esta view é deliberadamente
-- executada com os privilégios do proprietário para atravessar o RLS, mas expõe
-- somente quatro colunas não sensíveis e filtra textos aprovados.

drop view if exists public.public_messages;

create view public.public_messages
with (security_barrier = true)
as
  select
    g.name::text as name,
    btrim(c.message)::text as message,
    'PRESENTE'::text as source,
    c.created_at as created_at
  from public.claims c
  join public.guests g on g.id = c.guest_id
  where c.message_approved is true
    and nullif(btrim(c.message), '') is not null

  union all

  select
    g.name::text as name,
    btrim(g.rsvp_notes)::text as message,
    'RSVP'::text as source,
    coalesce(g.rsvp_at, g.created_at) as created_at
  from public.guests g
  where g.notes_approved is true
    and nullif(btrim(g.rsvp_notes), '') is not null;

revoke all on public.public_messages from public;
grant select on public.public_messages to anon, authenticated;

comment on view public.public_messages is
  'Mural público: somente nome e texto previamente aprovados; nunca expõe telefone, token ou dados financeiros.';
