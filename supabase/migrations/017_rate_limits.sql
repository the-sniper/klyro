-- Rate limiting for the public chat endpoint.
--
-- /api/chat is unauthenticated and was completely uncapped: a single widget
-- key or IP could drive unlimited OpenAI spend. This adds a counter table and
-- an atomic check used by the route.
--
-- One row per (bucket, fixed window). The check blends the current window with
-- the tail of the previous one so the limit slides instead of resetting hard on
-- the minute boundary.

create table if not exists rate_limits (
  bucket_key    text        not null,
  window_start  timestamptz not null,
  request_count integer     not null default 0,
  primary key (bucket_key, window_start)
);

create index if not exists idx_rate_limits_window_start
  on rate_limits (window_start);

-- Records one request against a bucket and reports whether it is over the
-- limit. Increments before deciding, so callers that keep hammering while
-- blocked stay blocked.
create or replace function check_rate_limit(
  p_bucket_key     text,
  p_limit          integer,
  p_window_seconds integer
)
returns table (
  allowed             boolean,
  current_count       numeric,
  retry_after_seconds integer
)
language plpgsql
as $$
declare
  v_now          timestamptz := now();
  v_window_start timestamptz;
  v_prev_start   timestamptz;
  v_current      integer;
  v_previous     integer;
  v_elapsed      numeric;
  v_weighted     numeric;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );
  v_prev_start := v_window_start - make_interval(secs => p_window_seconds);

  insert into rate_limits (bucket_key, window_start, request_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
    do update set request_count = rate_limits.request_count + 1
  returning rate_limits.request_count into v_current;

  select coalesce(r.request_count, 0)
    into v_previous
    from rate_limits r
   where r.bucket_key = p_bucket_key
     and r.window_start = v_prev_start;

  v_previous := coalesce(v_previous, 0);

  -- Weight the previous window by how much of it is still inside the trailing
  -- window: at 15s into a 60s window, 75% of the previous window still counts.
  v_elapsed  := extract(epoch from v_now - v_window_start) / p_window_seconds;
  v_weighted := v_current + (v_previous * (1 - v_elapsed));

  -- Opportunistic cleanup so the table stays bounded without a cron job.
  delete from rate_limits r
   where r.bucket_key = p_bucket_key
     and r.window_start < v_prev_start;

  return query select
    (v_weighted <= p_limit),
    v_weighted,
    greatest(
      1,
      ceil(
        extract(
          epoch from (v_window_start + make_interval(secs => p_window_seconds)) - v_now
        )
      )::integer
    );
end;
$$;
