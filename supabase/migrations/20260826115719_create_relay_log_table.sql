/*
# Create relay_log table for packet relay logging

1. Purpose
- Stores packets relayed through the MeeChain control plane from both external clients and the dashboard.
- All writes go through the `relay-packet` Edge Function using the service role key (bypasses RLS).
- The dashboard reads logs server-side via the Next.js API route (also using the service role key).
- No anon/authenticated RLS policies are created — clients cannot read or write this table directly.

2. New Tables
- `relay_log`
  - `id` (uuid, primary key)
  - `source` (text, identifies who sent the packet: 'dashboard', 'external-client', etc.)
  - `from_node` (text, the originating node name)
  - `to_node` (text, the destination node name)
  - `payload` (text, the relay message content, max 500 chars enforced in edge function)
  - `created_at` (timestamptz, when the packet was logged)

3. Security
- Row Level Security is ENABLED on `relay_log`.
- No policies are created for anon or authenticated roles — the table is completely locked from direct client access.
- All reads and writes must go through the Edge Function or Next.js server-side code using the service role key.

4. Indexes
- `relay_log_created_at_idx` on `created_at DESC` for efficient newest-first queries.
*/

CREATE TABLE IF NOT EXISTS public.relay_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'unknown',
  from_node text NOT NULL,
  to_node text NOT NULL,
  payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS relay_log_created_at_idx
  ON public.relay_log (created_at DESC);

ALTER TABLE public.relay_log ENABLE ROW LEVEL SECURITY;