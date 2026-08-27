/*
# Create MeeChain dashboard telemetry storage

1. Purpose
- Adds durable storage for the operational dashboard so live measurements and verification history survive page refreshes and server restarts.
- This is a single-tenant dashboard with no sign-in screen; records are intentionally shared across the dashboard.

2. New tables
- `network_telemetry_snapshots`: periodic Node, API, and RPC measurements. `id` identifies the snapshot, `captured_at` records when it was measured, `source` identifies the collector, and `payload` stores the validated measurement object.
- `orb_pulses`: Magic Orb resonance events. `pulse_id` is the public event identifier, `energy_level`, `resonance_frequency`, `coherence_index`, and `active_nodes_connected` store the displayed metrics, and `raw_payload` stores the contract response.
- `relay_packets`: ComPort and control-plane relay events. `packet_id`, source, destination, payload name, and `transmitted_at` describe each packet.
- `verification_runs`: one row per verification-suite execution. `started_at`, `completed_at`, `passed_count`, `failed_count`, and `status` summarize the run.
- `verification_results`: individual assertions belonging to a verification run. `test_id`, `test_name`, `suite`, `status`, `duration_ms`, and `details` preserve the result shown in the dashboard.

3. Security
- Row Level Security is enabled on every new table.
- The dashboard has no authentication, so separate SELECT, INSERT, UPDATE, and DELETE policies allow `anon` and `authenticated` access to intentionally shared operational records.
- No user identity columns or private account data are created.

4. Notes
- JSON payloads use `jsonb` so the API contract can evolve without destructive schema changes.
- Indexes support newest-first telemetry, pulse, relay, and verification history queries.
*/

CREATE TABLE IF NOT EXISTS public.network_telemetry_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'dashboard',
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orb_pulses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id text NOT NULL UNIQUE,
  energy_level numeric(6,2) NOT NULL CHECK (energy_level >= 0 AND energy_level <= 100),
  resonance_frequency numeric(10,2) NOT NULL CHECK (resonance_frequency >= 0),
  harmonic_state text NOT NULL,
  coherence_index numeric(6,4) NOT NULL CHECK (coherence_index >= 0 AND coherence_index <= 1),
  active_nodes_connected integer NOT NULL DEFAULT 0 CHECK (active_nodes_connected >= 0),
  entropy_hash text NOT NULL,
  raw_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.relay_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id text NOT NULL UNIQUE,
  source text NOT NULL,
  destination text NOT NULL,
  payload_name text NOT NULL,
  transmitted_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.verification_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'passed', 'failed')),
  passed_count integer NOT NULL DEFAULT 0 CHECK (passed_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0)
);

CREATE TABLE IF NOT EXISTS public.verification_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.verification_runs(id) ON DELETE CASCADE,
  test_id text NOT NULL,
  test_name text NOT NULL,
  suite text NOT NULL,
  status text NOT NULL CHECK (status IN ('passed', 'failed', 'running', 'pending')),
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  details text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS network_telemetry_snapshots_captured_at_idx
  ON public.network_telemetry_snapshots (captured_at DESC);

CREATE INDEX IF NOT EXISTS orb_pulses_created_at_idx
  ON public.orb_pulses (created_at DESC);

CREATE INDEX IF NOT EXISTS relay_packets_transmitted_at_idx
  ON public.relay_packets (transmitted_at DESC);

CREATE INDEX IF NOT EXISTS verification_runs_started_at_idx
  ON public.verification_runs (started_at DESC);

CREATE INDEX IF NOT EXISTS verification_results_run_id_idx
  ON public.verification_results (run_id);

ALTER TABLE public.network_telemetry_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orb_pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shared telemetry snapshots are readable" ON public.network_telemetry_snapshots;
CREATE POLICY "Shared telemetry snapshots are readable" ON public.network_telemetry_snapshots
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared telemetry snapshots are insertable" ON public.network_telemetry_snapshots;
CREATE POLICY "Shared telemetry snapshots are insertable" ON public.network_telemetry_snapshots
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared telemetry snapshots are editable" ON public.network_telemetry_snapshots;
CREATE POLICY "Shared telemetry snapshots are editable" ON public.network_telemetry_snapshots
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared telemetry snapshots are removable" ON public.network_telemetry_snapshots;
CREATE POLICY "Shared telemetry snapshots are removable" ON public.network_telemetry_snapshots
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Shared orb pulses are readable" ON public.orb_pulses;
CREATE POLICY "Shared orb pulses are readable" ON public.orb_pulses
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared orb pulses are insertable" ON public.orb_pulses;
CREATE POLICY "Shared orb pulses are insertable" ON public.orb_pulses
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared orb pulses are editable" ON public.orb_pulses;
CREATE POLICY "Shared orb pulses are editable" ON public.orb_pulses
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared orb pulses are removable" ON public.orb_pulses;
CREATE POLICY "Shared orb pulses are removable" ON public.orb_pulses
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Shared relay packets are readable" ON public.relay_packets;
CREATE POLICY "Shared relay packets are readable" ON public.relay_packets
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared relay packets are insertable" ON public.relay_packets;
CREATE POLICY "Shared relay packets are insertable" ON public.relay_packets
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared relay packets are editable" ON public.relay_packets;
CREATE POLICY "Shared relay packets are editable" ON public.relay_packets
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared relay packets are removable" ON public.relay_packets;
CREATE POLICY "Shared relay packets are removable" ON public.relay_packets
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Shared verification runs are readable" ON public.verification_runs;
CREATE POLICY "Shared verification runs are readable" ON public.verification_runs
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared verification runs are insertable" ON public.verification_runs;
CREATE POLICY "Shared verification runs are insertable" ON public.verification_runs
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared verification runs are editable" ON public.verification_runs;
CREATE POLICY "Shared verification runs are editable" ON public.verification_runs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared verification runs are removable" ON public.verification_runs;
CREATE POLICY "Shared verification runs are removable" ON public.verification_runs
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Shared verification results are readable" ON public.verification_results;
CREATE POLICY "Shared verification results are readable" ON public.verification_results
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared verification results are insertable" ON public.verification_results;
CREATE POLICY "Shared verification results are insertable" ON public.verification_results
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared verification results are editable" ON public.verification_results;
CREATE POLICY "Shared verification results are editable" ON public.verification_results
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared verification results are removable" ON public.verification_results;
CREATE POLICY "Shared verification results are removable" ON public.verification_results
  FOR DELETE TO anon, authenticated USING (true);
