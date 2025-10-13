

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."device_event_type" AS ENUM (
    'HEALTH',
    'BTN_SHORT',
    'SOS',
    'IN_SMS',
    'PAIR_OK',
    'PAIR_FAIL',
    'AGPS_BOOST',
    'AGPS_STOP',
    'OTW',
    'UNPAIR_OK',
    'UNPAIR_DENY',
    'GPS_SEARCH',
    'PAIR_OK_UNCLAIMED'
);


ALTER TYPE "public"."device_event_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'sentinel',
    'warden',
    'architect',
    'admin',
    'provider',
    'guardian'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_provider_to_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from public.sentinels s where s.id = p_sentinel_id and s.owner_guardian_id = auth.uid()) then
    raise exception 'not owner of sentinel';
  end if;
  insert into public.provider_assignments(provider_id, sentinel_id)
  values (p_provider_id, p_sentinel_id)
  on conflict do nothing;
end;
$$;


ALTER FUNCTION "public"."add_provider_to_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select role from public.profiles where id = auth.uid()
$$;


ALTER FUNCTION "public"."auth_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_sentinel"("target" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select
    auth.uid() is not null and (
      exists (
        select 1 from public.sentinels s
        where s.id = target
          and s.owner_guardian_id = auth.uid()
      )
      or exists (
        select 1 from public.provider_assignments pa
        where pa.sentinel_id = target
          and pa.provider_id = auth.uid()
      )
    )
$$;


ALTER FUNCTION "public"."can_access_sentinel"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE
    AS $$
  select role
  from public.profiles
  where id = auth.uid()
$$;


ALTER FUNCTION "public"."current_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."devices_for_sentinels"("p_sentinel_ids" "uuid"[]) RETURNS TABLE("id" "uuid", "hw_uid" "text", "model" "text", "sentinel_id" "uuid", "sentinel_name" "text", "last_seen_at" timestamp with time zone, "is_paired" boolean, "recently_active" boolean)
    LANGUAGE "sql"
    AS $$
 select
 d.id, d.hw_uid, d.model, d.sentinel_id, s.full_name as sentinel_name, d.last_seen_at,
 (d.sentinel_id is not null) as is_paired,
 (d.last_seen_at is not null and d.last_seen_at > now() - interval '5 minutes') as recently_active
 from public.devices d
 left join public.sentinels s on s.id = d.sentinel_id
 where d.sentinel_id = any(p_sentinel_ids)
 order by coalesce(d.last_seen_at, d.created_at) desc
 $$;


ALTER FUNCTION "public"."devices_for_sentinels"("p_sentinel_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only create a basic profile if the application hasn't already created one
  -- This allows the application to set display_name and other fields properly
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'warden')
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(NULLIF(public.profiles.role, ''), EXCLUDED.role);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("uid" "uuid", "roles" "public"."user_role"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = any(roles)
  );
$$;


ALTER FUNCTION "public"."has_role"("uid" "uuid", "roles" "public"."user_role"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role in ('admin'::public.user_role, 'architect'::public.user_role)
  );
$$;


ALTER FUNCTION "public"."is_admin"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_architect"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'architect'
  );
$$;


ALTER FUNCTION "public"."is_architect"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_architect"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists(
    select 1 from public.profiles p where p.id = uid and p.role = 'architect'
  )
$$;


ALTER FUNCTION "public"."is_architect"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_provider"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select current_setting('request.jwt.claim.sub', true)::uuid
         = any(select id from public.profiles where role = 'provider');
$$;


ALTER FUNCTION "public"."is_provider"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_warden"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT current_setting('request.jwt.claim.sub', true)::uuid
         = ANY(SELECT id FROM public.profiles WHERE role = 'warden');
$$;


ALTER FUNCTION "public"."is_warden"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."provider_assignments" (
    "provider_id" "uuid" NOT NULL,
    "sentinel_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."provider_assignments" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_assignments_for_owned_sentinel"("p_sentinel_id" "uuid") RETURNS SETOF "public"."provider_assignments"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select pa.*
  from public.provider_assignments pa
  where pa.sentinel_id = p_sentinel_id
    and exists (
      select 1 from public.sentinels s
      where s.id = p_sentinel_id
        and s.owner_guardian_id = auth.uid()
    );
$$;


ALTER FUNCTION "public"."list_assignments_for_owned_sentinel"("p_sentinel_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_provider_from_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from public.sentinels s where s.id = p_sentinel_id and s.owner_guardian_id = auth.uid()) then
    raise exception 'not owner of sentinel';
  end if;
  delete from public.provider_assignments where provider_id = p_provider_id and sentinel_id = p_sentinel_id;
end;
$$;


ALTER FUNCTION "public"."remove_provider_from_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_availability_on_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.sentinel_id is not null then
    new.available := false;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."set_availability_on_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_sentinel_owner_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.owner_guardian_id is null then
    NEW.owner_guardian_id := auth.uid();
  end if;
  return NEW;
end$$;


ALTER FUNCTION "public"."set_sentinel_owner_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at := now(); return new; end $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg__touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."tg__touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_device_last_seen"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.devices
     set last_seen_at = now(), updated_at = now()
   where id = new.device_id;
  return new;
end $$;


ALTER FUNCTION "public"."touch_device_last_seen"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_claims" (
    "code" "text" NOT NULL,
    "hw_uid" "text",
    "sentinel_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."device_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_events" (
    "id" bigint NOT NULL,
    "device_id" "uuid" NOT NULL,
    "sentinel_id" "uuid",
    "event_type" "public"."device_event_type" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."device_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."device_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."device_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."device_events_id_seq" OWNED BY "public"."device_events"."id";



CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hw_uid" "text" NOT NULL,
    "model" "text",
    "sentinel_id" "uuid",
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "device_token" "text",
    "available" boolean DEFAULT false NOT NULL,
    "phone" "text"
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "device_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text" NOT NULL,
    "message" "text",
    "lat" double precision,
    "lng" double precision,
    "extras" "jsonb"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."events_id_seq" OWNED BY "public"."events"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "display_name" "text",
    "role" "public"."user_role" DEFAULT 'warden'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."role" IS 'User role: architect, provider, or warden (formerly guardian)';



CREATE TABLE IF NOT EXISTS "public"."providers" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sentinels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_guardian_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sentinels" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_architect_device_overview" AS
 SELECT "d"."id" AS "device_id",
    "d"."hw_uid",
    "d"."model",
    "d"."sentinel_id",
    "s"."full_name" AS "sentinel_name",
    "s"."owner_guardian_id" AS "owner_id",
    "d"."last_seen_at",
    ( SELECT "de"."event_type"
           FROM "public"."device_events" "de"
          WHERE ("de"."device_id" = "d"."id")
          ORDER BY "de"."created_at" DESC, "de"."id" DESC
         LIMIT 1) AS "latest_event_type"
   FROM ("public"."devices" "d"
     LEFT JOIN "public"."sentinels" "s" ON (("s"."id" = "d"."sentinel_id")));


ALTER VIEW "public"."v_architect_device_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warden_provider_assignments" (
    "warden_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."warden_provider_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_architect_warden_provider_assignments" AS
 SELECT "wpa"."warden_id",
    "wpa"."provider_id",
    "wpa"."assigned_by",
    "wpa"."created_at" AS "assigned_at",
    "wpa"."updated_at",
    "wpa"."active",
    "wpa"."notes",
    "wp"."email" AS "warden_email",
    "wp"."display_name" AS "warden_display_name",
    "pp"."email" AS "provider_email",
    "pp"."display_name" AS "provider_display_name",
    "prov"."display_name" AS "provider_company_name",
    "count"("s"."id") AS "warden_sentinel_count"
   FROM (((("public"."warden_provider_assignments" "wpa"
     JOIN "public"."profiles" "wp" ON ((("wp"."id" = "wpa"."warden_id") AND ("wp"."role" = 'warden'::"public"."user_role"))))
     JOIN "public"."providers" "prov" ON (("prov"."user_id" = "wpa"."provider_id")))
     JOIN "public"."profiles" "pp" ON ((("pp"."id" = "wpa"."provider_id") AND ("pp"."role" = 'provider'::"public"."user_role"))))
     LEFT JOIN "public"."sentinels" "s" ON (("s"."owner_guardian_id" = "wpa"."warden_id")))
  GROUP BY "wpa"."warden_id", "wpa"."provider_id", "wpa"."assigned_by", "wpa"."created_at", "wpa"."updated_at", "wpa"."active", "wpa"."notes", "wp"."email", "wp"."display_name", "pp"."email", "pp"."display_name", "prov"."display_name";


ALTER VIEW "public"."v_architect_warden_provider_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_device_event_feed" AS
 SELECT "id",
    "created_at",
    "event_type",
    "payload",
    "device_id",
    "sentinel_id"
   FROM "public"."device_events" "e"
  WHERE (("event_type")::"text" <> 'GPS_SEARCH'::"text")
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."v_device_event_feed" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_device_status_v2" AS
 SELECT "id" AS "device_id",
    "sentinel_id",
    "last_seen_at",
    ("sentinel_id" IS NOT NULL) AS "is_paired",
    (("last_seen_at" IS NOT NULL) AND (("now"() - "last_seen_at") <= '00:05:00'::interval)) AS "is_active"
   FROM "public"."devices" "d";


ALTER VIEW "public"."v_device_status_v2" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_provider_assigned_wardens" AS
 SELECT "wpa"."provider_id",
    "wpa"."warden_id",
    "wpa"."assigned_by",
    "wpa"."created_at" AS "assigned_at",
    "wpa"."notes" AS "assignment_notes",
    "wpa"."active",
    "wp"."email" AS "warden_email",
    "wp"."display_name" AS "warden_display_name",
    "wp"."created_at" AS "warden_registered_at",
    "ap"."display_name" AS "assigned_by_name",
    "count"("s"."id") AS "sentinel_count",
    "count"("d"."id") AS "device_count",
    "max"("de"."created_at") AS "latest_activity"
   FROM ((((("public"."warden_provider_assignments" "wpa"
     JOIN "public"."profiles" "wp" ON ((("wp"."id" = "wpa"."warden_id") AND ("wp"."role" = 'warden'::"public"."user_role"))))
     JOIN "public"."profiles" "ap" ON (("ap"."id" = "wpa"."assigned_by")))
     LEFT JOIN "public"."sentinels" "s" ON (("s"."owner_guardian_id" = "wpa"."warden_id")))
     LEFT JOIN "public"."devices" "d" ON (("d"."sentinel_id" = "s"."id")))
     LEFT JOIN "public"."device_events" "de" ON ((("de"."device_id" = "d"."id") AND ("de"."created_at" >= ("now"() - '24:00:00'::interval)))))
  WHERE ("wpa"."active" = true)
  GROUP BY "wpa"."provider_id", "wpa"."warden_id", "wpa"."assigned_by", "wpa"."created_at", "wpa"."notes", "wpa"."active", "wp"."email", "wp"."display_name", "wp"."created_at", "ap"."display_name";


ALTER VIEW "public"."v_provider_assigned_wardens" OWNER TO "postgres";


ALTER TABLE ONLY "public"."device_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."device_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."device_claims"
    ADD CONSTRAINT "device_claims_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."device_events"
    ADD CONSTRAINT "device_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_device_token_key" UNIQUE ("device_token");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_hw_uid_key" UNIQUE ("hw_uid");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_assignments"
    ADD CONSTRAINT "provider_assignments_pkey" PRIMARY KEY ("provider_id", "sentinel_id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."sentinels"
    ADD CONSTRAINT "sentinels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warden_provider_assignments"
    ADD CONSTRAINT "warden_provider_assignments_pkey" PRIMARY KEY ("warden_id", "provider_id");



CREATE INDEX "device_claims_unused_idx" ON "public"."device_claims" USING "btree" ("code") WHERE ("used_at" IS NULL);



CREATE INDEX "device_events_device_id_created_at_idx" ON "public"."device_events" USING "btree" ("device_id", "created_at" DESC);



CREATE INDEX "idx_claims_expires" ON "public"."device_claims" USING "btree" ("expires_at");



CREATE INDEX "idx_claims_sentinel" ON "public"."device_claims" USING "btree" ("sentinel_id");



CREATE INDEX "idx_claims_unused" ON "public"."device_claims" USING "btree" ("expires_at") WHERE ("used_at" IS NULL);



CREATE INDEX "idx_devices_hw_available" ON "public"."devices" USING "btree" ("hw_uid", "available");



CREATE INDEX "idx_devices_sentinel_id" ON "public"."devices" USING "btree" ("sentinel_id");



CREATE INDEX "idx_events_device" ON "public"."device_events" USING "btree" ("device_id");



CREATE INDEX "idx_events_sentinel_created" ON "public"."device_events" USING "btree" ("sentinel_id", "created_at" DESC);



CREATE INDEX "idx_events_sentinel_created_id" ON "public"."device_events" USING "btree" ("sentinel_id", "created_at" DESC, "id" DESC);



CREATE INDEX "idx_events_sentinel_type_created" ON "public"."device_events" USING "btree" ("sentinel_id", "event_type", "created_at" DESC);



CREATE INDEX "idx_warden_provider_assignments_active" ON "public"."warden_provider_assignments" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_warden_provider_assignments_provider" ON "public"."warden_provider_assignments" USING "btree" ("provider_id");



CREATE INDEX "idx_warden_provider_assignments_warden" ON "public"."warden_provider_assignments" USING "btree" ("warden_id");



CREATE UNIQUE INDEX "uq_device_claims_unused_per_hw" ON "public"."device_claims" USING "btree" (COALESCE("hw_uid", ''::"text")) WHERE ("used_at" IS NULL);



CREATE UNIQUE INDEX "uq_device_claims_unused_per_sentinel" ON "public"."device_claims" USING "btree" ("sentinel_id") WHERE ("used_at" IS NULL);



CREATE OR REPLACE TRIGGER "trg_devices_set_availability" BEFORE INSERT OR UPDATE ON "public"."devices" FOR EACH ROW EXECUTE FUNCTION "public"."set_availability_on_assignment"();



CREATE OR REPLACE TRIGGER "trg_devices_updated_at" BEFORE UPDATE ON "public"."devices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_provider_assignments_updated_at" BEFORE UPDATE ON "public"."provider_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_providers_updated_at" BEFORE UPDATE ON "public"."providers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sentinels_set_owner" BEFORE INSERT ON "public"."sentinels" FOR EACH ROW EXECUTE FUNCTION "public"."set_sentinel_owner_from_auth"();



CREATE OR REPLACE TRIGGER "trg_sentinels_updated_at" BEFORE UPDATE ON "public"."sentinels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_device_last_seen" AFTER INSERT ON "public"."device_events" FOR EACH ROW EXECUTE FUNCTION "public"."touch_device_last_seen"();



CREATE OR REPLACE TRIGGER "trg_warden_provider_assignments_updated_at" BEFORE UPDATE ON "public"."warden_provider_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."device_claims"
    ADD CONSTRAINT "device_claims_sentinel_id_fkey" FOREIGN KEY ("sentinel_id") REFERENCES "public"."sentinels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_events"
    ADD CONSTRAINT "device_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_events"
    ADD CONSTRAINT "device_events_sentinel_id_fkey" FOREIGN KEY ("sentinel_id") REFERENCES "public"."sentinels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_sentinel_id_fkey" FOREIGN KEY ("sentinel_id") REFERENCES "public"."sentinels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_assignments"
    ADD CONSTRAINT "provider_assignments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_assignments"
    ADD CONSTRAINT "provider_assignments_sentinel_id_fkey" FOREIGN KEY ("sentinel_id") REFERENCES "public"."sentinels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sentinels"
    ADD CONSTRAINT "sentinels_owner_guardian_id_fkey" FOREIGN KEY ("owner_guardian_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warden_provider_assignments"
    ADD CONSTRAINT "warden_provider_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warden_provider_assignments"
    ADD CONSTRAINT "warden_provider_assignments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warden_provider_assignments"
    ADD CONSTRAINT "warden_provider_assignments_warden_id_fkey" FOREIGN KEY ("warden_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Architects can manage warden-provider assignments" ON "public"."warden_provider_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'architect'::"public"."user_role")))));



CREATE POLICY "Providers can view their assignments" ON "public"."warden_provider_assignments" FOR SELECT USING ((("provider_id" = "auth"."uid"()) AND ("active" = true)));



CREATE POLICY "Wardens can view their provider assignments" ON "public"."warden_provider_assignments" FOR SELECT USING ((("warden_id" = "auth"."uid"()) AND ("active" = true)));



CREATE POLICY "architect_can_all_claims" ON "public"."device_claims" TO "authenticated" USING ("public"."is_architect"()) WITH CHECK ("public"."is_architect"());



CREATE POLICY "architects_manage_devices" ON "public"."devices" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'architect'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'architect'::"public"."user_role")))));



ALTER TABLE "public"."device_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_events_read_via_device" ON "public"."device_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."devices" "d"
  WHERE (("d"."id" = "device_events"."device_id") AND ((EXISTS ( SELECT 1
           FROM "public"."sentinels" "s"
          WHERE (("s"."id" = "d"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
           FROM "public"."provider_assignments" "pa"
          WHERE (("pa"."sentinel_id" = "d"."sentinel_id") AND ("pa"."provider_id" = "auth"."uid"())))))))));



ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "devices_read_owner" ON "public"."devices" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "devices"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"())))));



CREATE POLICY "devices_read_provider" ON "public"."devices" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."provider_assignments" "pa"
  WHERE (("pa"."sentinel_id" = "devices"."sentinel_id") AND ("pa"."provider_id" = "auth"."uid"())))));



CREATE POLICY "devices_update_owner" ON "public"."devices" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "devices"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "devices"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"())))));



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "guardian_can_insert_claim" ON "public"."device_claims" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "device_claims"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"())))));



CREATE POLICY "guardian_can_select_claims" ON "public"."device_claims" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "device_claims"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"())))));



CREATE POLICY "guardian_can_update_claim" ON "public"."device_claims" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "device_claims"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "device_claims"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"())))));



CREATE POLICY "pa_provider_delete_self" ON "public"."provider_assignments" FOR DELETE TO "authenticated" USING (("provider_id" = "auth"."uid"()));



CREATE POLICY "pa_provider_read_own" ON "public"."provider_assignments" FOR SELECT TO "authenticated" USING (("provider_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_all" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "profiles_self_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_self_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_self_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_svc_all" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."provider_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_can_select_claims" ON "public"."device_claims" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."provider_assignments" "pa"
  WHERE (("pa"."sentinel_id" = "device_claims"."sentinel_id") AND ("pa"."provider_id" = "auth"."uid"())))));



ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "providers_admin_all" ON "public"."providers" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "providers_self_select" ON "public"."providers" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "providers_self_update" ON "public"."providers" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "providers_svc_all" ON "public"."providers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "sel_events_architect" ON "public"."events" FOR SELECT USING ("public"."is_architect"());



CREATE POLICY "sel_events_by_device_visibility" ON "public"."events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."devices" "d"
     JOIN "public"."sentinels" "s" ON (("s"."id" = "d"."sentinel_id")))
     LEFT JOIN "public"."provider_assignments" "pa" ON ((("pa"."sentinel_id" = "s"."id") AND ("pa"."provider_id" = "auth"."uid"()))))
  WHERE (("d"."hw_uid" = "events"."device_id") AND (("s"."owner_guardian_id" = "auth"."uid"()) OR ("pa"."provider_id" IS NOT NULL))))));



CREATE POLICY "sel_events_guardian" ON "public"."events" FOR SELECT TO "authenticated" USING (((("extras" ? 'sentinel_id'::"text") AND ((("extras" ->> 'sentinel_id'::"text"))::"uuid" IN ( SELECT "sentinels"."id"
   FROM "public"."sentinels"
  WHERE ("sentinels"."owner_guardian_id" = "auth"."uid"())))) OR true));



CREATE POLICY "sel_guardian_visible_providers" ON "public"."providers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."provider_assignments" "pa"
     JOIN "public"."sentinels" "s" ON (("s"."id" = "pa"."sentinel_id")))
  WHERE (("pa"."provider_id" = "providers"."user_id") AND ("s"."owner_guardian_id" = "auth"."uid"())))));



CREATE POLICY "sel_self_provider" ON "public"."providers" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."sentinels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sentinels_owner_all" ON "public"."sentinels" TO "authenticated" USING (("owner_guardian_id" = "auth"."uid"())) WITH CHECK (("owner_guardian_id" = "auth"."uid"()));



CREATE POLICY "sentinels_provider_read_via_assignment" ON "public"."sentinels" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."provider_assignments" "pa"
  WHERE (("pa"."sentinel_id" = "sentinels"."id") AND ("pa"."provider_id" = "auth"."uid"())))));



ALTER TABLE "public"."warden_provider_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wardens_can_read_for_pairing" ON "public"."devices" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'warden'::"public"."user_role")))) AND ((("sentinel_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sentinels" "s"
  WHERE (("s"."id" = "devices"."sentinel_id") AND ("s"."owner_guardian_id" = "auth"."uid"()))))) OR (("sentinel_id" IS NULL) AND ("available" = true)))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."device_claims";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."device_events";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."devices";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































REVOKE ALL ON FUNCTION "public"."add_provider_to_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_provider_to_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_provider_to_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_provider_to_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_sentinel"("target" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_sentinel"("target" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_sentinel"("target" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."devices_for_sentinels"("p_sentinel_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."devices_for_sentinels"("p_sentinel_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."devices_for_sentinels"("p_sentinel_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("uid" "uuid", "roles" "public"."user_role"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("uid" "uuid", "roles" "public"."user_role"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("uid" "uuid", "roles" "public"."user_role"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_architect"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_architect"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_architect"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_architect"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_architect"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_architect"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_provider"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_provider"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_provider"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_warden"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_warden"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_warden"() TO "service_role";



GRANT ALL ON TABLE "public"."provider_assignments" TO "anon";
GRANT ALL ON TABLE "public"."provider_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_assignments" TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_assignments_for_owned_sentinel"("p_sentinel_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_assignments_for_owned_sentinel"("p_sentinel_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_assignments_for_owned_sentinel"("p_sentinel_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_assignments_for_owned_sentinel"("p_sentinel_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_provider_from_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_provider_from_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_provider_from_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_provider_from_sentinel"("p_sentinel_id" "uuid", "p_provider_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_availability_on_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_availability_on_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_availability_on_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_sentinel_owner_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_sentinel_owner_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_sentinel_owner_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg__touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg__touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg__touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_device_last_seen"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_device_last_seen"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_device_last_seen"() TO "service_role";
























GRANT ALL ON TABLE "public"."device_claims" TO "anon";
GRANT ALL ON TABLE "public"."device_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."device_claims" TO "service_role";



GRANT ALL ON TABLE "public"."device_events" TO "anon";
GRANT ALL ON TABLE "public"."device_events" TO "authenticated";
GRANT ALL ON TABLE "public"."device_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."device_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."device_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."device_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."providers" TO "anon";
GRANT ALL ON TABLE "public"."providers" TO "authenticated";
GRANT ALL ON TABLE "public"."providers" TO "service_role";



GRANT ALL ON TABLE "public"."sentinels" TO "anon";
GRANT ALL ON TABLE "public"."sentinels" TO "authenticated";
GRANT ALL ON TABLE "public"."sentinels" TO "service_role";



GRANT ALL ON TABLE "public"."v_architect_device_overview" TO "anon";
GRANT ALL ON TABLE "public"."v_architect_device_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."v_architect_device_overview" TO "service_role";



GRANT ALL ON TABLE "public"."warden_provider_assignments" TO "anon";
GRANT ALL ON TABLE "public"."warden_provider_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."warden_provider_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."v_architect_warden_provider_assignments" TO "anon";
GRANT ALL ON TABLE "public"."v_architect_warden_provider_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."v_architect_warden_provider_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."v_device_event_feed" TO "anon";
GRANT ALL ON TABLE "public"."v_device_event_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."v_device_event_feed" TO "service_role";



GRANT ALL ON TABLE "public"."v_device_status_v2" TO "anon";
GRANT ALL ON TABLE "public"."v_device_status_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."v_device_status_v2" TO "service_role";



GRANT ALL ON TABLE "public"."v_provider_assigned_wardens" TO "anon";
GRANT ALL ON TABLE "public"."v_provider_assigned_wardens" TO "authenticated";
GRANT ALL ON TABLE "public"."v_provider_assigned_wardens" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
