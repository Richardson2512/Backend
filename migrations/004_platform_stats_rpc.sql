-- Migration: Platform stats RPC (bypass RLS for public counters)
-- Run this in Supabase SQL Editor.
-- This function returns global counts used on the landing page and dashboards.

-- NOTE: This uses SECURITY DEFINER to bypass RLS for read-only aggregated stats.
-- Make sure it is created by a privileged role (e.g., postgres) in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_searches bigint;
  v_keywords_baseline bigint := 20000;
  v_searches_today bigint;
  v_total_auth_users bigint;
  v_top_keywords jsonb;
BEGIN
  -- Total searches (all time)
  SELECT COUNT(*) INTO v_total_searches
  FROM public.search_history;

  -- Searches today
  SELECT COUNT(*) INTO v_searches_today
  FROM public.search_history
  WHERE created_at >= date_trunc('day', now());

  -- Total authenticated users (from auth.users)
  -- If auth schema is not accessible, this can error; in that case you can remove this block
  BEGIN
    SELECT COUNT(*) INTO v_total_auth_users
    FROM auth.users;
  EXCEPTION WHEN OTHERS THEN
    v_total_auth_users := NULL;
  END;

  -- Top keywords (global) - based on last 1000 searches to keep it fast
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('keyword', search_query, 'count', c) ORDER BY c DESC),
    '[]'::jsonb
  )
  INTO v_top_keywords
  FROM (
    SELECT sh.search_query, COUNT(*) AS c
    FROM (
      SELECT search_query
      FROM public.search_history
      ORDER BY created_at DESC
      LIMIT 1000
    ) sh
    GROUP BY sh.search_query
    ORDER BY c DESC
    LIMIT 5
  ) t;

  RETURN jsonb_build_object(
    -- Display baseline + real count so the counter starts at 20k and continues incrementing
    'totalSearches', COALESCE(v_total_searches, 0) + v_keywords_baseline,
    'searchesToday', COALESCE(v_searches_today, 0),
    'totalAuthUsers', COALESCE(v_total_auth_users, 0),
    'topKeywords', COALESCE(v_top_keywords, '[]'::jsonb)
  );
END;
$$;

-- Allow clients to call it
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;


