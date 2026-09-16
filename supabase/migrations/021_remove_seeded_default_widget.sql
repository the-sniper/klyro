-- Remove the ownerless seeded widget.
--
-- Migration 001 seeds `insert into widgets (widget_key, name, welcome_message)
-- values ('default', ...)` with no user_id. Retrieval passes user_id straight
-- into match_document_chunks, where a null filter_user_id means "search every
-- tenant" -- so this one row was a public, unauthenticated widget key that
-- could read every customer's documents.
--
-- The application now refuses to answer for an ownerless widget, but the row
-- should not exist at all.

delete from widgets where widget_key = 'default' and user_id is null;

-- Any other ownerless widget is the same hazard; deactivate rather than delete,
-- since these may be real widgets that simply lost their owner.
update widgets
   set is_active = false
 where user_id is null
   and is_active;
