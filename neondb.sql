--
-- PostgreSQL database dump
--

\restrict mQhYbwcviusqqP3To1BhrdItE8hqBT8qZYxH6D6mN47wkXhpet6ub7r9UpwiL91

-- Dumped from database version 16.11 (df20cf9)
-- Dumped by pg_dump version 16.10

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

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    account_id integer NOT NULL,
    user_id character varying NOT NULL,
    activity_type character varying(50) NOT NULL,
    notes text,
    activity_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    company_id integer NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    company_id integer NOT NULL,
    user_id character varying,
    action character varying(50) NOT NULL,
    resource_type character varying(50) NOT NULL,
    resource_id integer,
    details text,
    ip_address character varying(45),
    user_agent character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: billing_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.billing_accounts (
    id integer NOT NULL,
    company_id integer NOT NULL,
    status character varying(20) DEFAULT 'trial'::character varying NOT NULL,
    plan_type character varying(20),
    trial_start_date timestamp without time zone DEFAULT now(),
    trial_end_date timestamp without time zone,
    subscription_start_date timestamp without time zone,
    next_billing_date timestamp without time zone,
    cancelled_at timestamp without time zone,
    authnet_customer_profile_id character varying(50),
    authnet_payment_profile_id character varying(50),
    authnet_base_subscription_id character varying(50),
    authnet_user_subscription_id character varying(50),
    card_last4 character varying(4),
    card_type character varying(20),
    card_exp_month character varying(2),
    card_exp_year character varying(4),
    base_price_cents integer,
    per_user_price_cents integer,
    active_user_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.billing_accounts OWNER TO neondb_owner;

--
-- Name: billing_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.billing_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_accounts_id_seq OWNER TO neondb_owner;

--
-- Name: billing_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.billing_accounts_id_seq OWNED BY public.billing_accounts.id;


--
-- Name: billing_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.billing_events (
    id integer NOT NULL,
    company_id integer,
    event_type character varying(50) NOT NULL,
    event_source character varying(20) NOT NULL,
    authnet_transaction_id character varying(50),
    authnet_subscription_id character varying(50),
    raw_payload jsonb,
    processed character varying(10) DEFAULT 'no'::character varying,
    processed_at timestamp without time zone,
    error_message text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.billing_events OWNER TO neondb_owner;

--
-- Name: billing_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.billing_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_events_id_seq OWNER TO neondb_owner;

--
-- Name: billing_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.billing_events_id_seq OWNED BY public.billing_events.id;


--
-- Name: billing_invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.billing_invoices (
    id integer NOT NULL,
    company_id integer NOT NULL,
    billing_account_id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    description text,
    subtotal_cents integer NOT NULL,
    tax_cents integer DEFAULT 0,
    total_cents integer NOT NULL,
    status character varying(20) NOT NULL,
    paid_at timestamp without time zone,
    authnet_transaction_id character varying(50),
    authnet_response_code character varying(10),
    period_start timestamp without time zone,
    period_end timestamp without time zone,
    line_items jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.billing_invoices OWNER TO neondb_owner;

--
-- Name: billing_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.billing_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_invoices_id_seq OWNER TO neondb_owner;

--
-- Name: billing_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.billing_invoices_id_seq OWNED BY public.billing_invoices.id;


--
-- Name: call_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.call_logs (
    id integer NOT NULL,
    company_id integer NOT NULL,
    inquiry_id integer NOT NULL,
    phone_e164 character varying(20) NOT NULL,
    direction character varying(10) NOT NULL,
    source character varying(20) NOT NULL,
    ctm_call_id character varying(100),
    duration_seconds integer,
    recording_url text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.call_logs OWNER TO neondb_owner;

--
-- Name: call_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.call_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.call_logs_id_seq OWNER TO neondb_owner;

--
-- Name: call_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.call_logs_id_seq OWNED BY public.call_logs.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) DEFAULT 'Gulf Breeze'::character varying NOT NULL,
    billing_email character varying(255),
    billing_address text,
    billing_phone character varying(50),
    billing_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ctm_webhook_token character varying(64),
    ctm_webhook_secret character varying(255),
    ctm_enabled character varying(10) DEFAULT 'no'::character varying,
    ai_assistance_enabled character varying(10) DEFAULT 'yes'::character varying,
    ai_budget_limit_cents integer,
    ai_usage_this_month_cents integer DEFAULT 0,
    ai_usage_reset_date timestamp without time zone,
    total_beds integer DEFAULT 32
);


ALTER TABLE public.companies OWNER TO neondb_owner;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO neondb_owner;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: contact_submissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contact_submissions (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    company_name character varying(255),
    message text NOT NULL,
    source character varying(50) DEFAULT 'landing_page'::character varying,
    user_id character varying,
    status character varying(20) DEFAULT 'new'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact_submissions OWNER TO neondb_owner;

--
-- Name: contact_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contact_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_submissions_id_seq OWNER TO neondb_owner;

--
-- Name: contact_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contact_submissions_id_seq OWNED BY public.contact_submissions.id;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inquiries (
    id integer NOT NULL,
    user_id character varying,
    stage character varying(50) DEFAULT 'inquiry'::character varying NOT NULL,
    caller_name character varying(255),
    client_name character varying(255),
    phone_number character varying(50),
    email character varying(255),
    date_of_birth date,
    referral_source character varying(50),
    referral_details text,
    call_date_time timestamp without time zone DEFAULT now(),
    initial_notes text,
    is_viable character varying(10),
    non_viable_reason character varying(50),
    non_viable_notes text,
    insurance_provider character varying(255),
    insurance_policy_id character varying(100),
    insurance_notes text,
    vob_status character varying(50),
    vob_details text,
    coverage_details text,
    quoted_cost character varying(100),
    client_responsibility text,
    vob_completed_at timestamp without time zone,
    quote_accepted character varying(10),
    quote_notes text,
    pre_assessment_completed character varying(10),
    pre_assessment_date timestamp without time zone,
    pre_assessment_notes text,
    expected_admit_date date,
    level_of_care character varying(50),
    admission_type character varying(50),
    scheduling_notes text,
    actual_admit_date date,
    admitted_notes text,
    call_recording_url text,
    transcription text,
    ai_extracted_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ctm_call_id character varying(100),
    ctm_tracking_number character varying(50),
    ctm_source character varying(100),
    call_duration_seconds integer,
    lost_reason character varying(50),
    lost_notes text,
    referral_origin character varying(20),
    referral_account_id integer,
    online_source character varying(50),
    vob_file_url text,
    in_network_deductible character varying(100),
    in_network_deductible_met character varying(100),
    in_network_oop_max character varying(100),
    in_network_oop_met character varying(100),
    has_out_of_network_benefits character varying(10),
    out_of_network_deductible character varying(100),
    out_of_network_deductible_met character varying(100),
    out_of_network_oop_max character varying(100),
    out_of_network_oop_met character varying(100),
    state_restrictions text,
    pre_cert_required character varying(10),
    pre_auth_required character varying(10),
    pre_cert_auth_details text,
    has_substance_use_benefits character varying(10),
    has_mental_health_benefits character varying(10),
    benefit_notes text,
    arrival_email_sent_at timestamp without time zone,
    call_summary text,
    company_id integer NOT NULL,
    seeking_sud_treatment character varying(10),
    seeking_mental_health character varying(10),
    seeking_eating_disorder character varying(10),
    presenting_problems text
);


ALTER TABLE public.inquiries OWNER TO neondb_owner;

--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiries_id_seq OWNER TO neondb_owner;

--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: inquiry_phone_map; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inquiry_phone_map (
    id integer NOT NULL,
    company_id integer NOT NULL,
    inquiry_id integer NOT NULL,
    phone_e164 character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inquiry_phone_map OWNER TO neondb_owner;

--
-- Name: inquiry_phone_map_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inquiry_phone_map_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiry_phone_map_id_seq OWNER TO neondb_owner;

--
-- Name: inquiry_phone_map_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inquiry_phone_map_id_seq OWNED BY public.inquiry_phone_map.id;


--
-- Name: inquiry_stage_status; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inquiry_stage_status (
    id integer NOT NULL,
    company_id integer NOT NULL,
    inquiry_id integer NOT NULL,
    stage_name character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'not_started'::character varying NOT NULL,
    stage_data jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp without time zone,
    completed_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inquiry_stage_status OWNER TO neondb_owner;

--
-- Name: inquiry_stage_status_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inquiry_stage_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiry_stage_status_id_seq OWNER TO neondb_owner;

--
-- Name: inquiry_stage_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inquiry_stage_status_id_seq OWNED BY public.inquiry_stage_status.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.login_attempts (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    user_id character varying,
    success character varying(10) NOT NULL,
    failure_reason character varying(100),
    ip_address character varying(45),
    user_agent character varying(500),
    two_factor_method character varying(20),
    two_factor_success character varying(10),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO neondb_owner;

--
-- Name: login_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.login_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_attempts_id_seq OWNER TO neondb_owner;

--
-- Name: login_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.login_attempts_id_seq OWNED BY public.login_attempts.id;


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_settings (
    id integer NOT NULL,
    stage_name character varying(50) NOT NULL,
    email_addresses text,
    enabled character varying(10) DEFAULT 'no'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id integer NOT NULL
);


ALTER TABLE public.notification_settings OWNER TO neondb_owner;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_settings_id_seq OWNER TO neondb_owner;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_settings_id_seq OWNED BY public.notification_settings.id;


--
-- Name: nursing_assessment_forms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.nursing_assessment_forms (
    id integer NOT NULL,
    inquiry_id integer NOT NULL,
    form_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_complete character varying(10) DEFAULT 'no'::character varying,
    completed_at timestamp without time zone,
    completed_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id integer NOT NULL
);


ALTER TABLE public.nursing_assessment_forms OWNER TO neondb_owner;

--
-- Name: nursing_assessment_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.nursing_assessment_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nursing_assessment_forms_id_seq OWNER TO neondb_owner;

--
-- Name: nursing_assessment_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.nursing_assessment_forms_id_seq OWNED BY public.nursing_assessment_forms.id;


--
-- Name: password_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_history (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_history OWNER TO neondb_owner;

--
-- Name: password_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.password_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_history_id_seq OWNER TO neondb_owner;

--
-- Name: password_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.password_history_id_seq OWNED BY public.password_history.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO neondb_owner;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO neondb_owner;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: pre_cert_forms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pre_cert_forms (
    id integer NOT NULL,
    inquiry_id integer NOT NULL,
    form_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_complete character varying(10) DEFAULT 'no'::character varying,
    completed_at timestamp without time zone,
    completed_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id integer NOT NULL
);


ALTER TABLE public.pre_cert_forms OWNER TO neondb_owner;

--
-- Name: pre_cert_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pre_cert_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pre_cert_forms_id_seq OWNER TO neondb_owner;

--
-- Name: pre_cert_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pre_cert_forms_id_seq OWNED BY public.pre_cert_forms.id;


--
-- Name: pre_screening_forms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pre_screening_forms (
    id integer NOT NULL,
    inquiry_id integer NOT NULL,
    form_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_complete character varying(10) DEFAULT 'no'::character varying,
    completed_at timestamp without time zone,
    completed_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id integer NOT NULL
);


ALTER TABLE public.pre_screening_forms OWNER TO neondb_owner;

--
-- Name: pre_screening_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pre_screening_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pre_screening_forms_id_seq OWNER TO neondb_owner;

--
-- Name: pre_screening_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pre_screening_forms_id_seq OWNED BY public.pre_screening_forms.id;


--
-- Name: referral_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.referral_accounts (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50),
    address text,
    phone character varying(50),
    website character varying(255),
    notes text,
    assigned_bd_rep_id character varying,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id integer NOT NULL
);


ALTER TABLE public.referral_accounts OWNER TO neondb_owner;

--
-- Name: referral_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.referral_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_accounts_id_seq OWNER TO neondb_owner;

--
-- Name: referral_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.referral_accounts_id_seq OWNED BY public.referral_accounts.id;


--
-- Name: referral_contacts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.referral_contacts (
    id integer NOT NULL,
    account_id integer NOT NULL,
    name character varying(255) NOT NULL,
    "position" character varying(100),
    phone character varying(50),
    email character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    company_id integer NOT NULL
);


ALTER TABLE public.referral_contacts OWNER TO neondb_owner;

--
-- Name: referral_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.referral_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_contacts_id_seq OWNER TO neondb_owner;

--
-- Name: referral_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.referral_contacts_id_seq OWNED BY public.referral_contacts.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: stage_edit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stage_edit_logs (
    id integer NOT NULL,
    company_id integer NOT NULL,
    inquiry_id integer NOT NULL,
    stage_name character varying(50) NOT NULL,
    user_id character varying NOT NULL,
    action character varying(20) NOT NULL,
    changed_fields jsonb DEFAULT '{}'::jsonb,
    edited_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.stage_edit_logs OWNER TO neondb_owner;

--
-- Name: stage_edit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stage_edit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stage_edit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: stage_edit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stage_edit_logs_id_seq OWNED BY public.stage_edit_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id integer,
    role character varying(20) DEFAULT 'admissions'::character varying NOT NULL,
    is_active character varying(10) DEFAULT 'yes'::character varying NOT NULL,
    password_hash character varying(255),
    password_changed_at timestamp without time zone,
    password_expires_at timestamp without time zone,
    must_change_password character varying(10) DEFAULT 'yes'::character varying,
    totp_secret character varying(255),
    totp_enabled character varying(10) DEFAULT 'no'::character varying,
    sms_phone_number character varying(20),
    sms_2fa_enabled character varying(10) DEFAULT 'no'::character varying,
    two_factor_setup_complete character varying(10) DEFAULT 'no'::character varying,
    failed_login_attempts integer DEFAULT 0,
    locked_at timestamp without time zone,
    locked_reason character varying(255),
    locked_by character varying,
    last_login_at timestamp without time zone,
    last_activity_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: billing_accounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_accounts ALTER COLUMN id SET DEFAULT nextval('public.billing_accounts_id_seq'::regclass);


--
-- Name: billing_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_events ALTER COLUMN id SET DEFAULT nextval('public.billing_events_id_seq'::regclass);


--
-- Name: billing_invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_invoices ALTER COLUMN id SET DEFAULT nextval('public.billing_invoices_id_seq'::regclass);


--
-- Name: call_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_logs ALTER COLUMN id SET DEFAULT nextval('public.call_logs_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: contact_submissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contact_submissions ALTER COLUMN id SET DEFAULT nextval('public.contact_submissions_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: inquiry_phone_map id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_phone_map ALTER COLUMN id SET DEFAULT nextval('public.inquiry_phone_map_id_seq'::regclass);


--
-- Name: inquiry_stage_status id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_stage_status ALTER COLUMN id SET DEFAULT nextval('public.inquiry_stage_status_id_seq'::regclass);


--
-- Name: login_attempts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_attempts ALTER COLUMN id SET DEFAULT nextval('public.login_attempts_id_seq'::regclass);


--
-- Name: notification_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_settings ALTER COLUMN id SET DEFAULT nextval('public.notification_settings_id_seq'::regclass);


--
-- Name: nursing_assessment_forms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nursing_assessment_forms ALTER COLUMN id SET DEFAULT nextval('public.nursing_assessment_forms_id_seq'::regclass);


--
-- Name: password_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_history ALTER COLUMN id SET DEFAULT nextval('public.password_history_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: pre_cert_forms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_cert_forms ALTER COLUMN id SET DEFAULT nextval('public.pre_cert_forms_id_seq'::regclass);


--
-- Name: pre_screening_forms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_screening_forms ALTER COLUMN id SET DEFAULT nextval('public.pre_screening_forms_id_seq'::regclass);


--
-- Name: referral_accounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_accounts ALTER COLUMN id SET DEFAULT nextval('public.referral_accounts_id_seq'::regclass);


--
-- Name: referral_contacts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_contacts ALTER COLUMN id SET DEFAULT nextval('public.referral_contacts_id_seq'::regclass);


--
-- Name: stage_edit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stage_edit_logs ALTER COLUMN id SET DEFAULT nextval('public.stage_edit_logs_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	302ede96-3711-470f-b56f-c1ac51a68b69	688e2277-2fce-402a-bc49-426b03d18cad	4	2025-12-15 19:37:35.708958+00
2	8d185fcb-046e-4303-827a-4adbd0070285	688e2277-2fce-402a-bc49-426b03d18cad	4	2025-12-16 02:55:48.471613+00
3	33d5d2ae-bccc-4684-a460-e45227c8ea88	688e2277-2fce-402a-bc49-426b03d18cad	13	2025-12-20 16:24:57.092778+00
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_logs (id, account_id, user_id, activity_type, notes, activity_date, created_at, company_id) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, company_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
1	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 02:33:57.875064
2	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-16 12:50:32.139778
3	1	51375099	login	user	\N	Successful login	172.59.70.178	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-16 16:46:07.774652
4	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:24:03.731337
5	1	51375099	update	inquiry	2	Fields updated: seekingSudTreatment	35.231.40.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:26:18.2711
6	1	51375099	update	inquiry	2	Fields updated: presentingProblems	35.229.120.181	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:27:12.310092
7	1	51375099	create	inquiry	7	Inquiry created	35.227.15.160	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:28:19.070037
8	1	51375099	update	inquiry	7	Fields updated: seekingSudTreatment	34.26.22.152	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:28:28.573925
9	1	51375099	update	inquiry	7	Fields updated: presentingProblems	34.74.106.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:28:37.911315
10	1	51375099	update	inquiry	7	Fields updated: callerName, clientName, insuranceProvider, insurancePolicyId, dateOfBirth, insuranceNotes, stage	34.74.106.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:28:52.132389
11	1	51375099	update	inquiry	7	Fields updated: vobDetails, coverageDetails, quotedCost, clientResponsibility, vobFileUrl, inNetworkDeductible, inNetworkDeductibleMet, inNetworkOopMax, inNetworkOopMet, hasOutOfNetworkBenefits, outOfNetworkDeductible, outOfNetworkDeductibleMet, outOfNetworkOopMax, outOfNetworkOopMet, stateRestrictions, preCertRequired, preAuthRequired, preCertAuthDetails, hasSubstanceUseBenefits, hasMentalHealthBenefits, benefitNotes, stage, vobCompletedAt	34.23.211.114	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:31:31.5357
12	1	51375099	update	inquiry	7	Fields updated: quoteAccepted, quoteNotes, stage	34.26.99.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:31:55.918611
13	1	51375099	update	inquiry	7	Fields updated: preAssessmentCompleted, preAssessmentDate, preAssessmentNotes, stage	34.26.99.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:33:22.191606
14	1	51375099	update	inquiry	7	Fields updated: actualAdmitDate, stage	34.23.211.114	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:34:25.507945
15	1	51375099	update	inquiry	6	Fields updated: referralOrigin, referralAccountId, onlineSource	34.23.211.114	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:40:51.59777
16	1	51375099	login	user	\N	Successful login	172.59.66.61	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-17 13:24:17.177611
17	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 15:41:48.885085
18	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 16:35:19.719718
19	1	51375099	create	inquiry	19	Inquiry created	35.231.177.91	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 16:36:08.612982
20	1	51375099	update	inquiry	19	Fields updated: seekingSudTreatment	34.75.119.55	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 16:36:13.653122
21	1	51375099	update	inquiry	19	Fields updated: presentingProblems	34.23.182.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 16:36:44.071907
22	1	51375099	update	inquiry	19	Fields updated: callerName, clientName, insuranceProvider, insurancePolicyId, dateOfBirth, insuranceNotes, stage	34.75.119.55	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 16:37:47.347509
23	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 16:42:28.945375
24	1	51375099	login	user	\N	Successful login	172.59.70.83	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-19 19:27:19.372316
25	1	51375099	update	inquiry	24	Fields updated: isViable, nonViableReason, nonViableNotes, stage	35.196.203.103	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-19 19:30:03.799592
26	1	51375099	update	inquiry	23	Fields updated: isViable, nonViableReason, nonViableNotes, stage	35.227.15.160	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-19 19:30:54.279064
27	1	51375099	update	inquiry	22	Fields updated: isViable, nonViableReason, nonViableNotes, stage	35.227.15.160	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-19 19:31:08.05027
28	1	51375099	update	inquiry	21	Fields updated: isViable, nonViableReason, nonViableNotes, stage	34.74.106.240	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-19 19:31:19.791336
29	1	51375099	update	inquiry	20	Fields updated: isViable, nonViableReason, nonViableNotes, stage	34.74.106.240	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-19 19:31:31.918762
30	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 02:20:23.685561
31	1	51375099	update	inquiry	26	Fields updated: isViable, nonViableReason, nonViableNotes, stage	34.75.119.55	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 02:21:41.943461
32	1	51375099	update	inquiry	27	Fields updated: isViable, nonViableReason, nonViableNotes, stage	34.26.99.240	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 02:22:04.615678
33	1	51375099	update	inquiry	25	Fields updated: isViable, nonViableReason, nonViableNotes, stage	34.139.219.171	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 02:22:43.969064
34	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 15:40:39.612129
35	1	51375099	update	inquiry	19	Fields updated: vobDetails, coverageDetails, quotedCost, clientResponsibility, vobFileUrl, inNetworkDeductible, inNetworkDeductibleMet, inNetworkOopMax, inNetworkOopMet, hasOutOfNetworkBenefits, outOfNetworkDeductible, outOfNetworkDeductibleMet, outOfNetworkOopMax, outOfNetworkOopMet, stateRestrictions, preCertRequired, preAuthRequired, preCertAuthDetails, hasSubstanceUseBenefits, hasMentalHealthBenefits, benefitNotes, stage, vobCompletedAt	34.23.182.216	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 15:43:22.305625
36	1	51375099	update	inquiry	19	Fields updated: quoteAccepted, quoteNotes, stage	35.227.47.41	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 15:43:26.280172
37	1	51375099	update	inquiry	19	Fields updated: preAssessmentCompleted, preAssessmentDate, preAssessmentNotes, stage	34.75.119.55	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:04:29.451238
38	1	51375099	update	inquiry	19	Fields updated: expectedAdmitDate, levelOfCare, admissionType, schedulingNotes	35.231.177.91	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:05:10.46235
39	1	51375099	update	inquiry	19	Fields updated: actualAdmitDate, stage	34.26.99.240	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:05:11.923341
40	1	51375099	login	user	\N	Successful login	172.59.64.255	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:25:46.320729
41	1	51375099	view	inquiry_documents	19	Downloaded all documents as ZIP	34.75.119.55	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:26:03.892092
42	1	51375099	view	inquiry_documents	19	Downloaded all documents as ZIP	35.231.177.91	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:40:30.325856
43	1	51375099	view	inquiry_documents	19	Downloaded all documents as ZIP	34.75.119.55	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:40:51.157886
44	1	51375099	view	inquiry_documents	19	Downloaded all documents as ZIP	35.231.177.91	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 16:40:57.268232
45	1	51375099	login	user	\N	Successful login	172.59.64.5	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 17:41:37.308262
46	1	51375099	view	inquiry_documents	19	Downloaded pre-assessment forms as ZIP	35.243.160.31	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 17:42:09.543695
47	1	51375099	login	user	\N	Successful login	172.59.65.111	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 18:14:59.032207
48	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.231.177.91	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 18:15:12.370647
49	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 18:40:43.353189
50	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.231.177.91	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 18:41:06.1477
51	1	51375099	login	user	\N	Successful login	172.59.65.95	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 19:19:48.984569
52	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.243.160.31	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-20 19:20:02.5225
53	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-21 22:31:31.023145
54	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.139.219.171	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-21 22:32:21.913594
55	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-21 23:06:54.258304
56	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.23.182.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-21 23:07:22.849714
57	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 00:09:14.714476
58	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.26.99.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 00:09:21.059735
59	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.26.99.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 00:17:57.686065
60	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.23.182.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 00:28:12.881755
61	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.227.15.160	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 00:40:14.9771
62	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.243.160.31	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 00:50:26.573931
63	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.26.99.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 01:00:49.409082
64	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.227.15.160	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-22 01:04:43.523909
65	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-22 19:59:21.144266
66	1	51375099	update	inquiry	57	Fields updated: referralOrigin, referralAccountId, onlineSource	34.74.106.240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-22 20:00:12.631866
67	1	51375099	update	inquiry	57	Fields updated: seekingSudTreatment	35.227.15.160	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-22 20:00:18.722879
68	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.75.119.55	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-22 20:04:11.207574
69	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.227.47.41	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-22 20:11:24.356794
70	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-22 20:43:26.479676
71	1	51375099	login	user	\N	Successful login	172.59.66.115	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-23 16:37:16.976655
72	1	51375099	login	user	\N	Successful login	172.59.68.25	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-23 17:08:08.983412
73	1	51375099	login	user	\N	Successful login	172.59.68.181	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-23 17:45:27.834907
74	1	51375099	login	user	\N	Successful login	172.59.67.15	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-23 22:48:32.409476
75	1	51375099	create	user	\N	Created user: ivonnem@gulfbreezerecovery.com with role: admissions	172.59.67.15	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-23 22:49:36.120632
76	1	b0eec3a3-6090-4239-ac31-337606e41eb3	login	user	\N	Successful login	172.59.67.15	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-23 22:50:07.116182
77	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 17:48:04.441292
78	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	35.243.129.130	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 17:49:34.797153
79	1	b0eec3a3-6090-4239-ac31-337606e41eb3	login	user	\N	Successful login	141.224.132.10	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-27 15:52:26.422594
80	1	51375099	login	user	\N	Successful login	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-27 17:31:17.484872
81	1	51375099	login	user	\N	Successful login	172.59.71.193	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-27 22:13:46.30459
82	1	51375099	update	inquiry	96	Fields updated: seekingSudTreatment	34.23.182.216	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-27 22:13:54.053422
83	1	51375099	update	inquiry	96	Fields updated: presentingProblems	35.243.160.31	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-27 22:14:30.357751
84	1	51375099	update	inquiry	96	Fields updated: presentingProblems	34.26.99.240	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-27 22:15:47.394898
85	1	51375099	update	inquiry	96	Fields updated: callerName, clientName, insuranceProvider, insurancePolicyId, dateOfBirth, insuranceNotes, stage	34.26.99.240	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-12-27 22:16:56.117262
86	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2026-01-14 18:55:33.095382
87	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.139.219.171	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2026-01-14 19:06:25.545926
88	1	51375099	login	user	\N	Successful login	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2026-01-16 16:03:35.150403
89	1	51375099	update	inquiry	212	Fields updated: seekingSudTreatment	35.196.109.179	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2026-01-16 16:05:56.76976
90	1	51375099	view	inquiry_documents	19	Generated Admissions PDF Report	34.23.182.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2026-01-16 16:10:04.960252
91	1	51375099	login	user	\N	Successful login	172.59.64.95	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2026-01-26 14:48:22.660581
\.


--
-- Data for Name: billing_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.billing_accounts (id, company_id, status, plan_type, trial_start_date, trial_end_date, subscription_start_date, next_billing_date, cancelled_at, authnet_customer_profile_id, authnet_payment_profile_id, authnet_base_subscription_id, authnet_user_subscription_id, card_last4, card_type, card_exp_month, card_exp_year, base_price_cents, per_user_price_cents, active_user_count, created_at, updated_at) FROM stdin;
1	1	trial	\N	2025-12-16 12:51:09.866	2025-12-30 12:51:09.866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	2025-12-16 12:51:09.876701	2025-12-16 12:51:09.876701
\.


--
-- Data for Name: billing_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.billing_events (id, company_id, event_type, event_source, authnet_transaction_id, authnet_subscription_id, raw_payload, processed, processed_at, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: billing_invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.billing_invoices (id, company_id, billing_account_id, invoice_number, description, subtotal_cents, tax_cents, total_cents, status, paid_at, authnet_transaction_id, authnet_response_code, period_start, period_end, line_items, created_at) FROM stdin;
\.


--
-- Data for Name: call_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.call_logs (id, company_id, inquiry_id, phone_e164, direction, source, ctm_call_id, duration_seconds, recording_url, notes, created_at) FROM stdin;
19	1	20	+15185916920	inbound	ctm	3916629723	33	\N	Initial call from CTM	2025-12-19 16:51:51.248505
20	1	21	+18508966460	inbound	ctm	3916733694	25	\N	Initial call from CTM	2025-12-19 17:18:50.930407
21	1	22	+18503235894	inbound	ctm	3916734648	9	\N	Initial call from CTM	2025-12-19 17:18:51.032384
22	1	23	+19704563268	inbound	ctm	3916813044	121	\N	Initial call from CTM	2025-12-19 17:42:15.751435
23	1	24	+18506194209	inbound	ctm	3916884780	28	\N	Initial call from CTM	2025-12-19 18:00:39.490689
25	1	25	+16172905060	inbound	ctm	3917489733	83	\N	Initial call from CTM	2025-12-19 21:00:20.500986
26	1	26	+14156926481	inbound	ctm	3917499699	103	\N	Initial call from CTM	2025-12-19 21:03:35.244603
27	1	27	+15868991344	inbound	ctm	3917652618	59	\N	Initial call from CTM	2025-12-19 21:51:47.259309
28	1	28	+16162853208	inbound	ctm	3913917684	151	\N	Initial call from CTM	2025-12-20 03:11:07.856251
29	1	29	+12109952873	inbound	ctm	3918020121	133	\N	Initial call from CTM	2025-12-20 03:24:43.338096
30	1	30	+18569009692	inbound	ctm	3918052422	317	\N	Initial call from CTM	2025-12-20 07:23:17.499695
31	1	31	+19012084915	inbound	ctm	3918065355	310	\N	Initial call from CTM	2025-12-20 10:49:56.441979
32	1	32	+17472553458	inbound	ctm	3918077286	202	\N	Initial call from CTM	2025-12-20 12:41:16.450201
33	1	33	+19044057787	inbound	ctm	3918102381	104	\N	Initial call from CTM	2025-12-20 14:01:45.162666
34	1	34	+18505825588	inbound	ctm	3918118098	55	\N	Initial call from CTM	2025-12-20 14:13:49.03149
35	1	35	+13344015844	inbound	ctm	3918122463	36	\N	Initial call from CTM	2025-12-20 14:18:42.963515
36	1	36	+17408518007	inbound	ctm	3918156057	75	\N	Initial call from CTM	2025-12-20 14:56:31.603569
37	1	37	+18505037912	inbound	ctm	3918313497	72	\N	Initial call from CTM	2025-12-20 16:44:20.070518
38	1	38	+13058074252	inbound	ctm	3918371838	37	\N	Initial call from CTM	2025-12-20 17:18:24.128738
39	1	39	+13183590857	inbound	ctm	3918410607	62	\N	Initial call from CTM	2025-12-20 17:45:20.400234
40	1	38	+13058074252	inbound	ctm	3918496815	\N	\N	Follow-up call from CTM	2025-12-20 18:37:20.629375
41	1	40	+12397768552	inbound	ctm	3918502707	55	\N	Initial call from CTM	2025-12-20 18:43:12.992102
42	1	41	+14783029145	inbound	ctm	3918582789	13	\N	Initial call from CTM	2025-12-20 19:43:18.218228
43	1	42	+17143510350	inbound	ctm	3918609675	85	\N	Initial call from CTM	2025-12-20 20:06:17.630151
44	1	43	+16018435000	inbound	ctm	3918730359	36	\N	Initial call from CTM	2025-12-20 21:50:24.509011
45	1	44	+19047554020	inbound	ctm	3918942891	232	\N	Initial call from CTM	2025-12-21 06:05:57.273892
46	1	42	+17143510350	inbound	ctm	3919078143	37	\N	Follow-up call from CTM	2025-12-21 15:38:25.126148
47	1	45	+13343041167	inbound	ctm	3919080918	66	\N	Initial call from CTM	2025-12-21 15:43:13.368334
48	1	46	+15042326440	inbound	ctm	3919085790	117	\N	Initial call from CTM	2025-12-21 15:51:41.944351
49	1	47	+18508651250	inbound	ctm	3919165128	82	\N	Initial call from CTM	2025-12-21 17:20:42.710386
50	1	48	+18509342000	inbound	ctm	3919173222	67	\N	Initial call from CTM	2025-12-21 17:28:42.474032
51	1	49	+12564401713	inbound	ctm	3919579161	13	\N	Initial call from CTM	2025-12-22 05:14:22.635983
52	1	50	+16208750065	inbound	ctm	3919688235	63	\N	Initial call from CTM	2025-12-22 13:34:00.738801
53	1	50	+16208750065	inbound	ctm	3919710540	718	\N	Follow-up call from CTM	2025-12-22 14:01:46.878496
54	1	51	+12254832298	inbound	ctm	3919847187	26	\N	Initial call from CTM	2025-12-22 14:44:30.156129
55	1	52	+12056399081	inbound	ctm	3919848963	196	\N	Initial call from CTM	2025-12-22 14:47:58.120122
56	1	50	+16208750065	inbound	ctm	3920111220	91	\N	Follow-up call from CTM	2025-12-22 16:05:30.753179
57	1	23	+19704563268	inbound	ctm	3920123094	184	\N	Follow-up call from CTM	2025-12-22 16:09:47.396408
58	1	53	+12282179342	inbound	ctm	3920343888	38	\N	Initial call from CTM	2025-12-22 17:03:57.579315
59	1	54	+12056124698	inbound	ctm	3920568033	36	\N	Initial call from CTM	2025-12-22 17:56:07.278358
60	1	55	+18502329068	inbound	ctm	3920862585	56	\N	Initial call from CTM	2025-12-22 19:09:31.791738
61	1	56	+14153160763	inbound	ctm	3920992497	89	\N	Initial call from CTM	2025-12-22 19:39:10.579828
62	1	57	+18053006625	inbound	ctm	3921050484	14	\N	Initial call from CTM	2025-12-22 19:53:44.439955
63	1	58	+12513248012	inbound	ctm	3921090942	17	\N	Initial call from CTM	2025-12-22 20:04:08.281364
64	1	58	+12513248012	inbound	ctm	3921094521	15	\N	Follow-up call from CTM	2025-12-22 20:04:52.721274
65	1	54	+12056124698	inbound	ctm	3921295224	214	\N	Follow-up call from CTM	2025-12-22 21:02:58.933591
66	1	54	+12056124698	inbound	ctm	3921483519	103	\N	Follow-up call from CTM	2025-12-22 21:59:07.722816
67	1	59	+17047734291	inbound	ctm	3921781365	170	\N	Initial call from CTM	2025-12-23 00:18:35.04628
68	1	60	+13194647590	inbound	ctm	3921822927	33	\N	Initial call from CTM	2025-12-23 00:49:19.944866
69	1	60	+13194647590	inbound	ctm	3921825411	28	\N	Follow-up call from CTM	2025-12-23 00:50:55.310679
70	1	61	+19726895264	inbound	ctm	3921832779	215	\N	Initial call from CTM	2025-12-23 00:59:30.346506
71	1	62	+19048066265	inbound	ctm	3921870402	55	\N	Initial call from CTM	2025-12-23 01:45:25.566225
72	1	63	+15044428373	inbound	ctm	3921893268	203	\N	Initial call from CTM	2025-12-23 02:33:32.618992
73	1	64	+12253630015	inbound	ctm	3921954642	143	\N	Initial call from CTM	2025-12-23 07:54:57.325948
74	1	65	+18507241997	inbound	ctm	3922038681	71	\N	Initial call from CTM	2025-12-23 13:33:54.864394
75	1	66	+13184010284	inbound	ctm	3922394172	33	\N	Initial call from CTM	2025-12-23 16:00:55.673402
76	1	67	+12542719155	inbound	ctm	3922470228	94	\N	Initial call from CTM	2025-12-23 16:19:51.866192
77	1	68	+18507686750	inbound	ctm	3922832739	45	\N	Initial call from CTM	2025-12-23 17:49:45.346113
78	1	69	+18507361528	inbound	ctm	3923168166	35	\N	Initial call from CTM	2025-12-23 19:28:30.872133
79	1	69	+18507361528	inbound	ctm	3923170161	31	\N	Follow-up call from CTM	2025-12-23 19:28:55.771856
80	1	69	+18507361528	inbound	ctm	3923173320	30	\N	Follow-up call from CTM	2025-12-23 19:29:58.024303
81	1	70	+19046352315	inbound	ctm	3923179026	65	\N	Initial call from CTM	2025-12-23 19:32:22.07144
82	1	23	+19704563268	inbound	ctm	3923258499	95	\N	Follow-up call from CTM	2025-12-23 19:58:06.310707
83	1	57	+18053006625	inbound	ctm	3923297802	69	\N	Follow-up call from CTM	2025-12-23 20:09:42.876613
84	1	71	+19132382910	inbound	ctm	3923506500	46	\N	Initial call from CTM	2025-12-23 21:17:37.66695
85	1	71	+19132382910	inbound	ctm	3923515788	\N	\N	Follow-up call from CTM	2025-12-23 21:19:06.225943
86	1	69	+18507361528	inbound	ctm	3923611890	1067	\N	Follow-up call from CTM	2025-12-23 22:11:30.90479
87	1	72	+13155570122	inbound	ctm	3923933889	24	\N	Initial call from CTM	2025-12-24 01:13:32.920961
88	1	73	+12563283112	inbound	ctm	3923980824	55	\N	Initial call from CTM	2025-12-24 02:50:53.529305
89	1	74	+12562672527	inbound	ctm	3924529434	29	\N	Initial call from CTM	2025-12-24 17:43:44.85132
90	1	75	+12512940334	inbound	ctm	3924585525	49	\N	Initial call from CTM	2025-12-24 18:18:01.343444
91	1	76	+19852856569	inbound	ctm	3924941631	32	\N	Initial call from CTM	2025-12-25 00:04:23.660548
92	1	77	+16028039265	inbound	ctm	3925010010	355	\N	Initial call from CTM	2025-12-25 04:17:23.541718
93	1	78	+17867202002	inbound	ctm	3925017714	339	\N	Initial call from CTM	2025-12-25 05:23:55.660023
94	1	78	+17867202002	inbound	ctm	3925019022	608	\N	Follow-up call from CTM	2025-12-25 05:43:12.544127
95	1	61	+19726895264	inbound	ctm	3925029432	128	\N	Follow-up call from CTM	2025-12-25 07:26:41.539692
96	1	79	+14482405661	inbound	ctm	3925125618	46	\N	Initial call from CTM	2025-12-25 15:23:55.737311
97	1	80	+18506969400	inbound	ctm	3925170426	41	\N	Initial call from CTM	2025-12-25 17:10:55.201603
98	1	80	+18506969400	inbound	ctm	3925171050	39	\N	Follow-up call from CTM	2025-12-25 17:12:15.99272
99	1	80	+18506969400	inbound	ctm	3925171449	30	\N	Follow-up call from CTM	2025-12-25 17:13:05.697717
100	1	81	+17344504882	inbound	ctm	3925201623	51	\N	Initial call from CTM	2025-12-25 18:27:59.47203
101	1	82	+15185966200	inbound	ctm	3925297542	34	\N	Initial call from CTM	2025-12-25 22:39:00.485985
102	1	83	+19314558557	inbound	ctm	3925314765	2	\N	Initial call from CTM	2025-12-25 23:30:55.707336
103	1	84	+16783270526	inbound	ctm	3925532145	61	\N	Initial call from CTM	2025-12-26 14:28:53.565096
104	1	85	+18507365889	inbound	ctm	3925815906	172	\N	Initial call from CTM	2025-12-26 16:30:13.266974
105	1	86	+14082096581	inbound	ctm	3926060145	998	\N	Initial call from CTM	2025-12-26 18:08:08.910513
106	1	67	+12542719155	inbound	ctm	3926163009	34	\N	Follow-up call from CTM	2025-12-26 18:29:48.081085
107	1	87	+12059028386	inbound	ctm	3926164143	44	\N	Initial call from CTM	2025-12-26 18:30:22.642112
108	1	88	+17862187590	inbound	ctm	3926219895	531	\N	Initial call from CTM	2025-12-26 18:59:41.500891
109	1	89	+18507379078	inbound	ctm	3926254863	60	\N	Initial call from CTM	2025-12-26 19:04:31.08643
110	1	90	+14402895689	inbound	ctm	3926498556	421	\N	Initial call from CTM	2025-12-26 20:39:27.634587
111	1	91	+18503758691	inbound	ctm	3926790726	63	\N	Initial call from CTM	2025-12-26 22:32:39.836318
112	1	92	+18508046000	inbound	ctm	3926893782	402	\N	Initial call from CTM	2025-12-26 23:31:43.285656
113	1	93	+19044283080	inbound	ctm	3927314673	53	\N	Initial call from CTM	2025-12-27 15:24:43.212272
114	1	94	+19548214656	inbound	ctm	3927631527	520	\N	Initial call from CTM	2025-12-27 19:45:41.629368
115	1	94	+19548214656	inbound	ctm	3927663186	3	\N	Follow-up call from CTM	2025-12-27 20:03:39.171821
116	1	94	+19548214656	inbound	ctm	3927663813	4	\N	Follow-up call from CTM	2025-12-27 20:04:14.777374
117	1	94	+19548214656	inbound	ctm	3927667230	\N	\N	Follow-up call from CTM	2025-12-27 20:07:17.994688
118	1	86	+14082096581	inbound	ctm	3927674493	633	\N	Follow-up call from CTM	2025-12-27 20:25:01.721353
119	1	94	+19548214656	inbound	ctm	3927687705	3	\N	Follow-up call from CTM	2025-12-27 20:25:14.689218
120	1	95	+12402736892	inbound	ctm	3927693750	36	\N	Initial call from CTM	2025-12-27 20:31:57.208083
121	1	94	+19548214656	inbound	ctm	3927687924	677	\N	Follow-up call from CTM	2025-12-27 20:37:19.447243
122	1	96	+12057846311	inbound	ctm	3927785907	25	\N	Initial call from CTM	2025-12-27 22:02:03.305984
123	1	97	+18508304829	inbound	ctm	3927772746	1408	\N	Initial call from CTM	2025-12-27 22:11:54.978213
124	1	98	+12566054782	inbound	ctm	3927868617	4	\N	Initial call from CTM	2025-12-27 23:54:58.810681
125	1	99	+15185566218	inbound	ctm	3927963195	24	\N	Initial call from CTM	2025-12-28 05:24:16.083527
126	1	100	+13527716741	inbound	ctm	3928014375	288	\N	Initial call from CTM	2025-12-28 11:44:12.67929
127	1	101	+16059209725	inbound	ctm	3928020465	315	\N	Initial call from CTM	2025-12-28 12:15:04.648035
128	1	102	+18502800247	inbound	ctm	3928035804	99	\N	Initial call from CTM	2025-12-28 13:25:02.615869
129	1	103	+12283341163	inbound	ctm	3928037268	213	\N	Initial call from CTM	2025-12-28 13:32:36.917771
130	1	100	+13527716741	inbound	ctm	3928077261	34	\N	Follow-up call from CTM	2025-12-28 14:58:30.185985
131	1	100	+13527716741	inbound	ctm	3928085232	54	\N	Follow-up call from CTM	2025-12-28 15:09:35.34936
132	1	104	+18504901756	inbound	ctm	3928153062	119	\N	Initial call from CTM	2025-12-28 16:46:49.569091
133	1	105	+12295618598	inbound	ctm	3928249758	57	\N	Initial call from CTM	2025-12-28 18:32:25.091325
134	1	106	+18502263657	inbound	ctm	3928341390	260	\N	Initial call from CTM	2025-12-28 20:29:27.260831
135	1	107	+14844677784	inbound	ctm	3928366362	55	\N	Initial call from CTM	2025-12-28 20:58:16.148069
136	1	108	+18507039998	inbound	ctm	3928390848	151	\N	Initial call from CTM	2025-12-28 21:32:24.895354
137	1	109	+19853584557	inbound	ctm	3928573755	34	\N	Initial call from CTM	2025-12-29 04:02:57.835572
138	1	110	+13343229315	inbound	ctm	3928586802	100	\N	Initial call from CTM	2025-12-29 05:31:03.712684
139	1	34	+18505825588	inbound	ctm	3928891023	56	\N	Follow-up call from CTM	2025-12-29 14:57:52.814534
140	1	111	+15733902680	inbound	ctm	3929071848	144	\N	Initial call from CTM	2025-12-29 15:50:01.526097
141	1	103	+12283341163	inbound	ctm	3929137113	31	\N	Follow-up call from CTM	2025-12-29 16:05:06.372362
142	1	107	+14844677784	inbound	ctm	3929411157	92	\N	Follow-up call from CTM	2025-12-29 17:12:47.130832
143	1	112	+13522215533	inbound	ctm	3929460723	24	\N	Initial call from CTM	2025-12-29 17:23:09.118015
144	1	112	+13522215533	inbound	ctm	3929463090	29	\N	Follow-up call from CTM	2025-12-29 17:23:44.712451
145	1	113	+12513495600	inbound	ctm	3929494872	31	\N	Initial call from CTM	2025-12-29 17:31:16.604735
146	1	94	+19548214656	inbound	ctm	3929643393	32	\N	Follow-up call from CTM	2025-12-29 18:04:44.822322
147	1	114	+12564045658	inbound	ctm	3929752302	70	\N	Initial call from CTM	2025-12-29 18:32:22.521754
148	1	68	+18507686750	inbound	ctm	3929940921	22	\N	Follow-up call from CTM	2025-12-29 19:18:53.992946
149	1	115	+13349339173	inbound	ctm	3930060681	7	\N	Initial call from CTM	2025-12-29 19:49:49.986673
150	1	116	+17867613406	inbound	ctm	3930063129	49	\N	Initial call from CTM	2025-12-29 19:51:41.287802
151	1	113	+12513495600	inbound	ctm	3930146484	18	\N	Follow-up call from CTM	2025-12-29 20:11:14.93323
152	1	117	+12023165728	inbound	ctm	3930325362	24	\N	Initial call from CTM	2025-12-29 20:56:50.644103
153	1	86	+14082096581	inbound	ctm	3930503745	129	\N	Follow-up call from CTM	2025-12-29 21:45:13.534494
154	1	86	+14082096581	inbound	ctm	3930534033	435	\N	Follow-up call from CTM	2025-12-29 21:59:49.606286
155	1	113	+12513495600	inbound	ctm	3930724833	8	\N	Follow-up call from CTM	2025-12-29 23:04:15.788702
156	1	118	+15185304821	inbound	ctm	3930872184	28	\N	Initial call from CTM	2025-12-30 00:36:41.244135
157	1	119	+13346403936	inbound	ctm	3931174872	282	\N	Initial call from CTM	2025-12-30 14:18:10.474071
158	1	120	+18507267005	inbound	ctm	3931756632	39	\N	Initial call from CTM	2025-12-30 17:04:33.298834
159	1	121	+18506864302	inbound	ctm	3931806639	60	\N	Initial call from CTM	2025-12-30 17:17:13.186854
160	1	122	+14018089180	inbound	ctm	3931852731	1059	\N	Initial call from CTM	2025-12-30 17:46:01.019214
161	1	123	+14482042199	inbound	ctm	3932011515	30	\N	Initial call from CTM	2025-12-30 18:09:40.477108
162	1	124	+15024084432	inbound	ctm	3932252271	57	\N	Initial call from CTM	2025-12-30 19:14:09.050669
163	1	125	+13375137936	inbound	ctm	3932295285	77	\N	Initial call from CTM	2025-12-30 19:26:15.487521
164	1	86	+14082096581	inbound	ctm	3932345592	57	\N	Follow-up call from CTM	2025-12-30 19:39:55.286441
165	1	126	+16504763261	inbound	ctm	3932351652	\N	\N	Initial call from CTM	2025-12-30 19:40:01.381878
166	1	86	+14082096581	inbound	ctm	3932351709	212	\N	Follow-up call from CTM	2025-12-30 19:44:15.266823
167	1	127	+13214802942	inbound	ctm	3932477178	41	\N	Initial call from CTM	2025-12-30 20:14:03.694954
168	1	128	+19045993292	inbound	ctm	3932598567	67	\N	Initial call from CTM	2025-12-30 20:48:42.132743
169	1	129	+18165990067	inbound	ctm	3932612421	106	\N	Initial call from CTM	2025-12-30 20:53:06.443815
170	1	130	+13344004058	inbound	ctm	3932627970	80	\N	Initial call from CTM	2025-12-30 20:57:10.44063
171	1	86	+14082096581	inbound	ctm	3932757579	46	\N	Follow-up call from CTM	2025-12-30 21:39:27.059759
172	1	126	+16504763261	inbound	ctm	3932772093	33	\N	Follow-up call from CTM	2025-12-30 21:44:18.317648
173	1	52	+12056399081	inbound	ctm	3932820468	730	\N	Follow-up call from CTM	2025-12-30 22:13:51.620123
174	1	131	+12564257395	inbound	ctm	3933168540	2	\N	Initial call from CTM	2025-12-31 01:38:12.730839
175	1	67	+12542719155	inbound	ctm	3933576846	318	\N	Follow-up call from CTM	2025-12-31 15:37:46.652843
176	1	132	+13348068006	inbound	ctm	3933728997	146	\N	Initial call from CTM	2025-12-31 16:29:31.191524
177	1	133	+14482422642	inbound	ctm	3933824556	36	\N	Initial call from CTM	2025-12-31 16:58:47.253021
178	1	134	+18504269573	inbound	ctm	3934238649	68	\N	Initial call from CTM	2025-12-31 19:13:07.569798
179	1	135	+18502916698	inbound	ctm	3934221159	416	\N	Initial call from CTM	2025-12-31 19:13:57.99794
180	1	136	+16054093760	inbound	ctm	3934590432	93	\N	Initial call from CTM	2025-12-31 21:48:11.362212
181	1	137	+15104625109	inbound	ctm	3934736205	30	\N	Initial call from CTM	2025-12-31 23:43:41.865318
182	1	138	+18503754373	inbound	ctm	3934890177	115	\N	Initial call from CTM	2026-01-01 09:08:27.662562
183	1	139	+18503789595	inbound	ctm	3934941723	67	\N	Initial call from CTM	2026-01-01 13:59:14.723507
184	1	94	+19548214656	inbound	ctm	3935228472	173	\N	Follow-up call from CTM	2026-01-01 19:00:39.48829
185	1	140	+16016009139	inbound	ctm	3935369478	53	\N	Initial call from CTM	2026-01-01 21:28:49.65046
186	1	141	+19047262717	inbound	ctm	3935377659	94	\N	Initial call from CTM	2026-01-01 21:39:05.070074
187	1	142	+12253244889	inbound	ctm	3935457933	142	\N	Initial call from CTM	2026-01-01 23:31:27.977071
188	1	143	+15303278247	inbound	ctm	3935573139	191	\N	Initial call from CTM	2026-01-02 05:40:29.550482
189	1	144	+18503480772	inbound	ctm	3935609208	449	\N	Initial call from CTM	2026-01-02 11:33:45.771328
190	1	145	+12564962769	inbound	ctm	3936009417	128	\N	Initial call from CTM	2026-01-02 15:44:18.771093
191	1	146	+12058551654	inbound	ctm	3936179724	58	\N	Initial call from CTM	2026-01-02 16:31:06.11939
192	1	147	+12519797618	inbound	ctm	3936242394	182	\N	Initial call from CTM	2026-01-02 16:50:09.763545
193	1	148	+18504544687	inbound	ctm	3936272070	175	\N	Initial call from CTM	2026-01-02 16:58:07.282987
194	1	149	+18507758418	inbound	ctm	3936486186	130	\N	Initial call from CTM	2026-01-02 17:55:06.546047
195	1	150	+18504473093	inbound	ctm	3936538998	144	\N	Initial call from CTM	2026-01-02 18:09:32.586875
196	1	151	+18508429169	inbound	ctm	3936589893	29	\N	Initial call from CTM	2026-01-02 18:20:31.554659
197	1	152	+13342105270	inbound	ctm	3936737277	524	\N	Initial call from CTM	2026-01-02 19:06:42.437659
198	1	153	+19143390352	inbound	ctm	3936807912	13	\N	Initial call from CTM	2026-01-02 19:16:34.671214
199	1	154	+19294822353	inbound	ctm	3936822618	10	\N	Initial call from CTM	2026-01-02 19:21:18.182773
200	1	155	+13476467710	inbound	ctm	3936837687	13	\N	Initial call from CTM	2026-01-02 19:25:39.073389
201	1	156	+13477458943	inbound	ctm	3936851853	10	\N	Initial call from CTM	2026-01-02 19:29:02.593223
202	1	154	+19294822353	inbound	ctm	3936867441	10	\N	Follow-up call from CTM	2026-01-02 19:33:18.736148
203	1	157	+13476304621	inbound	ctm	3936882396	10	\N	Initial call from CTM	2026-01-02 19:37:36.447881
204	1	158	+19143830532	inbound	ctm	3936897543	\N	\N	Initial call from CTM	2026-01-02 19:41:53.348302
205	1	158	+19143830532	inbound	ctm	3936897639	25	\N	Follow-up call from CTM	2026-01-02 19:42:58.621523
206	1	159	+18506939095	inbound	ctm	3937012485	55	\N	Initial call from CTM	2026-01-02 20:16:06.80173
207	1	160	+12055342907	inbound	ctm	3937052499	103	\N	Initial call from CTM	2026-01-02 20:27:49.098569
208	1	161	+18506125509	inbound	ctm	3937117206	35	\N	Initial call from CTM	2026-01-02 20:47:04.402078
209	1	162	+12519797621	inbound	ctm	3937512513	319	\N	Initial call from CTM	2026-01-02 23:43:12.730447
210	1	163	+12059050460	inbound	ctm	3937562823	81	\N	Initial call from CTM	2026-01-03 00:18:07.925141
211	1	164	+13183931924	inbound	ctm	3937697136	14	\N	Initial call from CTM	2026-01-03 05:35:01.669504
212	1	165	+12052397703	inbound	ctm	3937710750	3	\N	Initial call from CTM	2026-01-03 08:24:59.713042
213	1	166	+12564185559	inbound	ctm	3937744716	56	\N	Initial call from CTM	2026-01-03 13:32:53.92615
214	1	167	+12029998395	inbound	ctm	3937900323	170	\N	Initial call from CTM	2026-01-03 16:08:28.907822
215	1	168	+16016106786	inbound	ctm	3937939461	78	\N	Initial call from CTM	2026-01-03 16:32:05.312634
216	1	169	+18503707253	inbound	ctm	3938133648	108	\N	Initial call from CTM	2026-01-03 18:46:43.458304
217	1	170	+16127785627	inbound	ctm	3938406213	32	\N	Initial call from CTM	2026-01-03 22:34:36.317539
218	1	171	+12136714707	inbound	ctm	3938417748	31	\N	Initial call from CTM	2026-01-03 22:47:34.230557
219	1	171	+12136714707	inbound	ctm	3938419263	53	\N	Follow-up call from CTM	2026-01-03 22:49:38.307603
220	1	171	+12136714707	inbound	ctm	3938420364	36	\N	Follow-up call from CTM	2026-01-03 22:50:35.601652
221	1	172	+13606865031	inbound	ctm	3938537175	30	\N	Initial call from CTM	2026-01-04 02:09:30.61588
222	1	173	+12513536703	inbound	ctm	3938537211	41	\N	Initial call from CTM	2026-01-04 02:09:37.488208
223	1	174	+12282157027	inbound	ctm	3938594631	531	\N	Initial call from CTM	2026-01-04 07:32:07.223075
224	1	175	+18037576358	inbound	ctm	3938618181	73	\N	Initial call from CTM	2026-01-04 09:41:49.511635
225	1	176	+19047551324	inbound	ctm	3938653953	\N	\N	Initial call from CTM	2026-01-04 13:26:39.632698
226	1	177	+18502618509	inbound	ctm	3938703609	41	\N	Initial call from CTM	2026-01-04 15:05:58.366547
227	1	177	+18502618509	inbound	ctm	3938705289	33	\N	Follow-up call from CTM	2026-01-04 15:08:18.02366
228	1	177	+18502618509	inbound	ctm	3938705766	318	\N	Follow-up call from CTM	2026-01-04 15:13:47.074832
229	1	178	+18502073119	inbound	ctm	3938724723	212	\N	Initial call from CTM	2026-01-04 15:40:07.055653
230	1	179	+12512096454	inbound	ctm	3938807436	226	\N	Initial call from CTM	2026-01-04 17:19:04.672096
231	1	180	+17542653442	inbound	ctm	3939130143	25	\N	Initial call from CTM	2026-01-04 23:57:16.123196
232	1	181	+14793962608	inbound	ctm	3939168240	63	\N	Initial call from CTM	2026-01-05 01:09:30.864828
233	1	182	+18506197406	inbound	ctm	3939176889	40	\N	Initial call from CTM	2026-01-05 01:20:40.976179
234	1	183	+12052185543	inbound	ctm	3939374259	37	\N	Initial call from CTM	2026-01-05 13:37:52.143587
235	1	184	+18662063224	inbound	ctm	3939397146	45	\N	Initial call from CTM	2026-01-05 13:53:16.013727
236	1	185	+18166688801	inbound	ctm	3939756867	47	\N	Initial call from CTM	2026-01-05 15:40:03.269657
237	1	121	+18506864302	inbound	ctm	3939786966	19	\N	Follow-up call from CTM	2026-01-05 15:47:02.496684
238	1	23	+19704563268	inbound	ctm	3939825855	46	\N	Follow-up call from CTM	2026-01-05 15:57:15.226235
239	1	23	+19704563268	inbound	ctm	3939856482	34	\N	Follow-up call from CTM	2026-01-05 16:03:25.752357
240	1	63	+15044428373	inbound	ctm	3939959445	81	\N	Follow-up call from CTM	2026-01-05 16:25:31.66026
241	1	56	+14153160763	inbound	ctm	3940030800	82	\N	Follow-up call from CTM	2026-01-05 16:40:44.800395
242	1	186	+18504652751	inbound	ctm	3961001877	33	\N	Initial call from CTM	2026-01-14 19:26:34.581571
243	1	187	+17857175026	inbound	ctm	3961059081	29	\N	Initial call from CTM	2026-01-14 19:39:55.267156
244	1	187	+17857175026	inbound	ctm	3961061610	27	\N	Follow-up call from CTM	2026-01-14 19:40:33.844617
245	1	188	+13345961247	inbound	ctm	3961119294	42	\N	Initial call from CTM	2026-01-14 19:54:57.369111
246	1	187	+17857175026	inbound	ctm	3961153338	53	\N	Follow-up call from CTM	2026-01-14 20:03:00.714491
247	1	186	+18504652751	inbound	ctm	3961247190	95	\N	Follow-up call from CTM	2026-01-14 20:27:20.290194
248	1	189	+19012192444	inbound	ctm	3961335741	51	\N	Initial call from CTM	2026-01-14 20:49:05.691346
249	1	190	+19724397783	inbound	ctm	3961496157	28	\N	Initial call from CTM	2026-01-14 21:31:42.945916
250	1	191	+14018962541	inbound	ctm	3961682091	21	\N	Initial call from CTM	2026-01-14 22:31:06.776827
251	1	192	+12259994706	inbound	ctm	3961811115	32	\N	Initial call from CTM	2026-01-14 23:25:20.79784
252	1	193	+15752436760	inbound	ctm	3962088798	37	\N	Initial call from CTM	2026-01-15 04:23:11.129282
253	1	194	+18882799485	inbound	ctm	3962663439	105	\N	Initial call from CTM	2026-01-15 15:51:32.060561
254	1	195	+16174484872	inbound	ctm	3962770281	109	\N	Initial call from CTM	2026-01-15 16:17:43.437966
255	1	196	+18502211032	inbound	ctm	3962861943	218	\N	Initial call from CTM	2026-01-15 16:41:58.880014
256	1	197	+18506869369	inbound	ctm	3962881524	22	\N	Initial call from CTM	2026-01-15 16:42:34.912187
257	1	198	+14065422849	inbound	ctm	3963127980	145	\N	Initial call from CTM	2026-01-15 17:40:38.058352
258	1	199	+13379625740	inbound	ctm	3963342705	31	\N	Initial call from CTM	2026-01-15 18:27:05.3124
259	1	200	+12563936021	inbound	ctm	3963392232	277	\N	Initial call from CTM	2026-01-15 18:43:02.772198
260	1	201	+18506969503	inbound	ctm	3963540738	42	\N	Initial call from CTM	2026-01-15 19:13:23.979057
261	1	202	+18506499444	inbound	ctm	3963556029	118	\N	Initial call from CTM	2026-01-15 19:17:55.101094
262	1	200	+12563936021	inbound	ctm	3963563442	64	\N	Follow-up call from CTM	2026-01-15 19:18:37.972417
263	1	203	+13342560204	inbound	ctm	3963797007	30	\N	Initial call from CTM	2026-01-15 20:16:04.873818
264	1	204	+18509101900	inbound	ctm	3963961365	148	\N	Initial call from CTM	2026-01-15 21:01:23.906003
265	1	205	+14023468754	inbound	ctm	3964334094	7	\N	Initial call from CTM	2026-01-15 22:50:44.932312
266	1	206	+17739829338	inbound	ctm	3964435743	11	\N	Initial call from CTM	2026-01-15 23:33:25.940375
267	1	207	+16017239514	inbound	ctm	3964620648	684	\N	Initial call from CTM	2026-01-16 02:01:53.780462
268	1	208	+16624166906	inbound	ctm	3964630881	193	\N	Initial call from CTM	2026-01-16 02:07:28.727742
269	1	209	+13347337142	inbound	ctm	3964928541	28	\N	Initial call from CTM	2026-01-16 14:48:06.152253
270	1	210	+14697542960	inbound	ctm	3965015538	47	\N	Initial call from CTM	2026-01-16 15:17:16.64672
271	1	210	+14697542960	inbound	ctm	3965025357	20	\N	Follow-up call from CTM	2026-01-16 15:19:58.252785
272	1	211	+13479290861	inbound	ctm	3965042718	13	\N	Initial call from CTM	2026-01-16 15:24:52.057595
273	1	212	+12056013668	inbound	ctm	3965127744	109	\N	Initial call from CTM	2026-01-16 15:52:31.835212
274	1	213	+19048646464	inbound	ctm	3965313468	267	\N	Initial call from CTM	2026-01-16 16:39:54.56177
275	1	195	+16174484872	inbound	ctm	3965533278	66	\N	Follow-up call from CTM	2026-01-16 17:26:27.931539
276	1	214	+13186140483	inbound	ctm	3965563926	51	\N	Initial call from CTM	2026-01-16 17:33:06.574415
277	1	215	+18502027429	inbound	ctm	3966022392	30	\N	Initial call from CTM	2026-01-16 19:20:14.764741
278	1	216	+12513889126	inbound	ctm	3966390672	123	\N	Initial call from CTM	2026-01-16 20:49:52.829114
279	1	217	+12512641996	inbound	ctm	3967027029	153	\N	Initial call from CTM	2026-01-17 01:08:53.81028
280	1	218	+13373729594	inbound	ctm	3967334193	118	\N	Initial call from CTM	2026-01-17 15:07:19.71739
281	1	181	+14793962608	inbound	ctm	3967378476	30	\N	Follow-up call from CTM	2026-01-17 15:40:38.253853
282	1	181	+14793962608	inbound	ctm	3967380156	50	\N	Follow-up call from CTM	2026-01-17 15:41:59.043633
283	1	219	+12488958978	inbound	ctm	3967477410	94	\N	Initial call from CTM	2026-01-17 16:46:25.59038
284	1	220	+12564791244	inbound	ctm	3967550607	63	\N	Initial call from CTM	2026-01-17 17:30:20.405118
285	1	221	+16623082880	inbound	ctm	3967561278	5	\N	Initial call from CTM	2026-01-17 17:34:57.296809
286	1	221	+16623082880	inbound	ctm	3967561911	31	\N	Follow-up call from CTM	2026-01-17 17:36:26.043561
287	1	221	+16623082880	inbound	ctm	3967563522	33	\N	Follow-up call from CTM	2026-01-17 17:37:23.126959
288	1	222	+12295314186	inbound	ctm	3967569534	165	\N	Initial call from CTM	2026-01-17 17:43:20.153987
289	1	223	+19043255204	inbound	ctm	3967748052	89	\N	Initial call from CTM	2026-01-17 19:40:24.186349
290	1	223	+19043255204	inbound	ctm	3967750275	35	\N	Follow-up call from CTM	2026-01-17 19:41:10.783564
291	1	224	+12513245519	inbound	ctm	3967861902	106	\N	Initial call from CTM	2026-01-17 21:11:41.656474
292	1	225	+18504950821	inbound	ctm	3968268084	86	\N	Initial call from CTM	2026-01-18 16:07:15.06655
293	1	88	+17862187590	inbound	ctm	3968309385	91	\N	Follow-up call from CTM	2026-01-18 16:56:40.483082
294	1	226	+19124192847	inbound	ctm	3968329458	266	\N	Initial call from CTM	2026-01-18 17:17:33.205188
295	1	227	+15162424545	inbound	ctm	3968360373	595	\N	Initial call from CTM	2026-01-18 17:58:56.071164
296	1	228	+12053530676	inbound	ctm	3968386260	148	\N	Initial call from CTM	2026-01-18 18:21:27.433097
297	1	229	+15183262094	inbound	ctm	3968446224	30	\N	Initial call from CTM	2026-01-18 19:25:35.662039
298	1	230	+16013238883	inbound	ctm	3968453685	215	\N	Initial call from CTM	2026-01-18 19:37:07.148578
299	1	231	+18503416417	inbound	ctm	3968664189	1090	\N	Initial call from CTM	2026-01-19 00:27:38.59969
300	1	231	+18503416417	inbound	ctm	3968695716	79	\N	Follow-up call from CTM	2026-01-19 01:13:13.224566
301	1	197	+18506869369	inbound	ctm	3968720841	10	\N	Follow-up call from CTM	2026-01-19 02:27:11.666265
302	1	197	+18506869369	inbound	ctm	3968721084	9	\N	Follow-up call from CTM	2026-01-19 02:27:47.509055
303	1	232	+13195018886	inbound	ctm	3968726031	222	\N	Initial call from CTM	2026-01-19 02:50:26.164073
304	1	233	+18506775106	inbound	ctm	3968999541	37	\N	Initial call from CTM	2026-01-19 14:40:14.363084
305	1	234	+18502880355	inbound	ctm	3969044481	343	\N	Initial call from CTM	2026-01-19 15:03:25.094829
306	1	235	+17162518671	inbound	ctm	3969183135	55	\N	Initial call from CTM	2026-01-19 15:44:01.297945
307	1	236	+12564992530	inbound	ctm	3969276432	129	\N	Initial call from CTM	2026-01-19 16:11:36.917606
308	1	237	+17042441921	inbound	ctm	3969364554	310	\N	Initial call from CTM	2026-01-19 16:39:30.82259
309	1	238	+15753170706	inbound	ctm	3969783921	74	\N	Initial call from CTM	2026-01-19 18:15:32.937817
310	1	239	+14432548580	inbound	ctm	3969810432	29	\N	Initial call from CTM	2026-01-19 18:21:49.39009
311	1	239	+14432548580	inbound	ctm	3969812916	53	\N	Follow-up call from CTM	2026-01-19 18:22:49.931487
312	1	240	+12514019344	inbound	ctm	3970105506	52	\N	Initial call from CTM	2026-01-19 19:47:16.071064
313	1	241	+18502027497	inbound	ctm	3970316334	30	\N	Initial call from CTM	2026-01-19 20:45:46.557115
314	1	212	+12056013668	inbound	ctm	3970319466	22	\N	Follow-up call from CTM	2026-01-19 20:46:24.82914
315	1	240	+12514019344	inbound	ctm	3970420551	102	\N	Follow-up call from CTM	2026-01-19 21:17:21.049985
316	1	242	+18503768866	inbound	ctm	3970478256	139	\N	Initial call from CTM	2026-01-19 21:36:47.266904
317	1	243	+18504661061	inbound	ctm	3970794234	267	\N	Initial call from CTM	2026-01-20 00:43:01.927515
318	1	244	+12259534237	inbound	ctm	3970901904	617	\N	Initial call from CTM	2026-01-20 04:33:03.612058
319	1	244	+12259534237	inbound	ctm	3970904085	223	\N	Follow-up call from CTM	2026-01-20 04:38:09.386313
320	1	245	+19044158265	inbound	ctm	3971050152	38	\N	Initial call from CTM	2026-01-20 13:57:03.512746
321	1	212	+12056013668	inbound	ctm	3971066640	7	\N	Follow-up call from CTM	2026-01-20 14:02:15.282413
322	1	246	+19414687400	inbound	ctm	3971314104	154	\N	Initial call from CTM	2026-01-20 15:27:42.273893
323	1	247	+14077294105	inbound	ctm	3971424864	18	\N	Initial call from CTM	2026-01-20 15:55:46.285784
324	1	248	+18509544214	inbound	ctm	3971432805	13	\N	Initial call from CTM	2026-01-20 15:57:52.203009
325	1	249	+19109162510	inbound	ctm	3971427912	83	\N	Initial call from CTM	2026-01-20 15:58:14.692525
326	1	248	+18509544214	inbound	ctm	3971438049	60	\N	Follow-up call from CTM	2026-01-20 16:00:47.14781
327	1	250	+18882992070	inbound	ctm	3971561157	58	\N	Initial call from CTM	2026-01-20 16:29:36.096336
328	1	251	+19707121763	inbound	ctm	3971770896	93	\N	Initial call from CTM	2026-01-20 17:16:10.95017
329	1	252	+18772020055	inbound	ctm	3972071799	77	\N	Initial call from CTM	2026-01-20 18:23:29.66977
330	1	253	+18663670661	inbound	ctm	3972144936	26	\N	Initial call from CTM	2026-01-20 18:39:28.48188
331	1	254	+12564535332	inbound	ctm	3972173418	22	\N	Initial call from CTM	2026-01-20 18:45:47.504094
332	1	255	+18059048860	inbound	ctm	3972322929	130	\N	Initial call from CTM	2026-01-20 19:21:03.909982
333	1	237	+17042441921	inbound	ctm	3972334068	379	\N	Follow-up call from CTM	2026-01-20 19:27:36.320482
334	1	256	+18503078053	inbound	ctm	3972369828	10	\N	Initial call from CTM	2026-01-20 19:29:23.432918
335	1	257	+12297338027	inbound	ctm	3972385980	114	\N	Initial call from CTM	2026-01-20 19:35:37.269362
336	1	243	+18504661061	inbound	ctm	3972488832	20	\N	Follow-up call from CTM	2026-01-20 19:59:14.915955
337	1	258	+17274188686	inbound	ctm	3972854601	53	\N	Initial call from CTM	2026-01-20 21:35:17.394761
338	1	259	+13169285579	inbound	ctm	3973367541	189	\N	Initial call from CTM	2026-01-21 01:08:54.213484
339	1	260	+18059148032	inbound	ctm	3973432380	218	\N	Initial call from CTM	2026-01-21 02:36:09.034609
340	1	261	+12564961231	inbound	ctm	3973454205	207	\N	Initial call from CTM	2026-01-21 03:28:18.890574
341	1	262	+12255034410	inbound	ctm	3973492695	74	\N	Initial call from CTM	2026-01-21 07:11:16.268851
342	1	263	+13342088867	inbound	ctm	3973704984	467	\N	Initial call from CTM	2026-01-21 14:38:25.275799
343	1	264	+14242065281	inbound	ctm	3973877343	110	\N	Initial call from CTM	2026-01-21 15:29:05.236956
344	1	256	+18503078053	inbound	ctm	3974044605	49	\N	Follow-up call from CTM	2026-01-21 16:14:12.67981
345	1	265	+12145637607	inbound	ctm	3974197107	63	\N	Initial call from CTM	2026-01-21 16:49:15.751525
346	1	266	+16017609901	inbound	ctm	3974301711	74	\N	Initial call from CTM	2026-01-21 17:10:50.149027
347	1	267	+15024092707	inbound	ctm	3974431413	47	\N	Initial call from CTM	2026-01-21 17:38:03.329274
348	1	268	+16628937196	inbound	ctm	3974560362	39	\N	Initial call from CTM	2026-01-21 18:06:57.002766
349	1	269	+19139094967	inbound	ctm	3974744286	81	\N	Initial call from CTM	2026-01-21 18:51:55.649323
350	1	270	+18502027223	inbound	ctm	3974861304	30	\N	Initial call from CTM	2026-01-21 19:16:05.563358
351	1	271	+18505019677	inbound	ctm	3974851122	327	\N	Initial call from CTM	2026-01-21 19:18:45.364384
352	1	272	+13012665177	inbound	ctm	3974996316	13	\N	Initial call from CTM	2026-01-21 19:43:34.857136
353	1	272	+13012665177	inbound	ctm	3974997834	23	\N	Follow-up call from CTM	2026-01-21 19:44:37.862885
354	1	273	+18504498860	inbound	ctm	3975022134	16	\N	Initial call from CTM	2026-01-21 19:49:32.491488
355	1	259	+13169285579	inbound	ctm	3975285108	57	\N	Follow-up call from CTM	2026-01-21 20:50:49.985366
356	1	274	+18509391200	inbound	ctm	3975291111	29	\N	Initial call from CTM	2026-01-21 20:51:41.033224
357	1	275	+14102075050	inbound	ctm	3975404094	122	\N	Initial call from CTM	2026-01-21 21:19:59.015491
358	1	276	+18502818420	inbound	ctm	3975443115	62	\N	Initial call from CTM	2026-01-21 21:28:56.905518
359	1	277	+12055312815	inbound	ctm	3975450015	137	\N	Initial call from CTM	2026-01-21 21:31:57.890838
360	1	237	+17042441921	inbound	ctm	3975590202	89	\N	Follow-up call from CTM	2026-01-21 22:10:20.420661
361	1	278	+18509242826	inbound	ctm	3975905865	138	\N	Initial call from CTM	2026-01-22 00:22:42.471619
362	1	279	+13347142142	inbound	ctm	3976311987	36	\N	Initial call from CTM	2026-01-22 14:33:05.335349
363	1	280	+12052123050	inbound	ctm	3976336836	49	\N	Initial call from CTM	2026-01-22 14:42:36.339333
364	1	281	+12285470800	inbound	ctm	3976430511	8	\N	Initial call from CTM	2026-01-22 15:12:03.648052
365	1	265	+12145637607	inbound	ctm	3976488090	122	\N	Follow-up call from CTM	2026-01-22 15:32:24.686292
366	1	282	+18507239190	inbound	ctm	3976687635	41	\N	Initial call from CTM	2026-01-22 16:23:01.116619
367	1	283	+18509101385	inbound	ctm	3976876686	69	\N	Initial call from CTM	2026-01-22 17:09:22.038622
368	1	284	+16015084590	inbound	ctm	3977249985	57	\N	Initial call from CTM	2026-01-22 18:35:07.568523
369	1	285	+18505298264	inbound	ctm	3977317512	174	\N	Initial call from CTM	2026-01-22 18:52:55.617132
370	1	286	+17155568081	inbound	ctm	3977460816	71	\N	Initial call from CTM	2026-01-22 19:26:31.286154
371	1	243	+18504661061	inbound	ctm	3977528307	264	\N	Follow-up call from CTM	2026-01-22 19:46:51.652611
372	1	286	+17155568081	inbound	ctm	3977453388	19	\N	Follow-up call from CTM	2026-01-22 20:02:54.754392
373	1	287	+19546266636	inbound	ctm	3977631054	84	\N	Initial call from CTM	2026-01-22 20:10:13.760153
374	1	287	+19546266636	inbound	ctm	3977668107	36	\N	Follow-up call from CTM	2026-01-22 20:19:14.324314
375	1	288	+18503761118	inbound	ctm	3977927745	213	\N	Initial call from CTM	2026-01-22 21:30:22.047867
376	1	243	+18504661061	inbound	ctm	3978143973	38	\N	Follow-up call from CTM	2026-01-22 22:25:14.66507
377	1	243	+18504661061	inbound	ctm	3978149196	65	\N	Follow-up call from CTM	2026-01-22 22:27:28.608081
378	1	243	+18504661061	inbound	ctm	3978154716	104	\N	Follow-up call from CTM	2026-01-22 22:29:55.335396
379	1	260	+18059148032	inbound	ctm	3978351378	\N	\N	Follow-up call from CTM	2026-01-22 23:46:23.882081
380	1	260	+18059148032	inbound	ctm	3978353232	\N	\N	Follow-up call from CTM	2026-01-22 23:47:08.98639
381	1	289	+13242011388	inbound	ctm	3978399834	\N	\N	Initial call from CTM	2026-01-23 00:10:58.881821
382	1	286	+17155568081	inbound	ctm	3977453388	20	\N	Follow-up call from CTM	2026-01-23 03:42:12.575821
383	1	290	+13189879026	inbound	ctm	3978585774	16	\N	Initial call from CTM	2026-01-23 04:25:24.896442
384	1	291	+16562261938	inbound	ctm	3978862632	50	\N	Initial call from CTM	2026-01-23 14:57:29.972413
385	1	292	+13054658205	inbound	ctm	3978950667	14	\N	Initial call from CTM	2026-01-23 15:16:16.211485
386	1	293	+18134219623	inbound	ctm	3979094940	1	\N	Initial call from CTM	2026-01-23 15:59:17.847458
387	1	294	+12512002424	inbound	ctm	3979142181	165	\N	Initial call from CTM	2026-01-23 16:12:23.578266
388	1	231	+18503416417	inbound	ctm	3979300455	86	\N	Follow-up call from CTM	2026-01-23 16:48:55.344593
389	1	295	+13477145024	inbound	ctm	3979377165	13	\N	Initial call from CTM	2026-01-23 17:05:51.161535
390	1	288	+18503761118	inbound	ctm	3979889952	60	\N	Follow-up call from CTM	2026-01-23 19:10:30.014653
391	1	288	+18503761118	inbound	ctm	3979902792	36	\N	Follow-up call from CTM	2026-01-23 19:13:12.323848
392	1	296	+13525198382	inbound	ctm	3980113077	139	\N	Initial call from CTM	2026-01-23 20:08:48.392163
393	1	297	+19039307154	inbound	ctm	3980246493	72	\N	Initial call from CTM	2026-01-23 20:44:57.595352
394	1	298	+18503908189	inbound	ctm	3980677173	155	\N	Initial call from CTM	2026-01-23 23:20:54.212221
395	1	299	+17869544197	inbound	ctm	3980900148	151	\N	Initial call from CTM	2026-01-24 03:50:19.835855
396	1	300	+16623177571	inbound	ctm	3980947470	241	\N	Initial call from CTM	2026-01-24 11:56:28.871049
397	1	301	+18432266270	inbound	ctm	3981052392	30	\N	Initial call from CTM	2026-01-24 15:08:45.942803
398	1	302	+18432260607	inbound	ctm	3981066759	5	\N	Initial call from CTM	2026-01-24 15:20:28.228891
399	1	301	+18432266270	inbound	ctm	3981067341	101	\N	Follow-up call from CTM	2026-01-24 15:23:11.030463
400	1	303	+18507758937	inbound	ctm	3981191034	40	\N	Initial call from CTM	2026-01-24 16:53:44.650494
401	1	304	+19254992016	inbound	ctm	3981335499	55	\N	Initial call from CTM	2026-01-24 18:33:02.862062
402	1	304	+19254992016	inbound	ctm	3981422079	41	\N	Follow-up call from CTM	2026-01-24 19:42:25.752962
403	1	305	+18503044069	inbound	ctm	3981466329	88	\N	Initial call from CTM	2026-01-24 20:19:57.850272
404	1	306	+19043330170	inbound	ctm	3981700305	47	\N	Initial call from CTM	2026-01-25 01:02:28.180639
405	1	307	+13344886413	inbound	ctm	3981720747	76	\N	Initial call from CTM	2026-01-25 01:53:44.700819
406	1	308	+13186579910	inbound	ctm	3981786243	87	\N	Initial call from CTM	2026-01-25 07:37:27.566508
407	1	309	+18507125092	inbound	ctm	3981922905	32	\N	Initial call from CTM	2026-01-25 16:03:34.769407
408	1	310	+12563374200	inbound	ctm	3982008708	98	\N	Initial call from CTM	2026-01-25 17:41:53.600305
409	1	220	+12564791244	inbound	ctm	3982060881	36	\N	Follow-up call from CTM	2026-01-25 18:38:06.712108
410	1	311	+18506862588	inbound	ctm	3982142625	261	\N	Initial call from CTM	2026-01-25 20:18:12.688437
411	1	312	+12512365125	inbound	ctm	3982203537	306	\N	Initial call from CTM	2026-01-25 21:31:16.833543
412	1	313	+19712285556	inbound	ctm	3982237701	26	\N	Initial call from CTM	2026-01-25 22:14:22.828718
413	1	314	+17543248262	inbound	ctm	3982255725	26	\N	Initial call from CTM	2026-01-25 22:41:56.787642
414	1	315	+18502256538	inbound	ctm	3982265790	239	\N	Initial call from CTM	2026-01-25 23:00:17.05057
415	1	316	+13347186025	inbound	ctm	3982444734	30	\N	Initial call from CTM	2026-01-26 09:47:27.847287
416	1	317	+18502027503	inbound	ctm	3982633322	30	\N	Initial call from CTM	2026-01-26 14:30:55.98507
417	1	318	+15614539055	inbound	ctm	3983268374	34	\N	Initial call from CTM	2026-01-26 17:18:58.350782
418	1	319	+15028029760	inbound	ctm	3983330216	30	\N	Initial call from CTM	2026-01-26 17:33:06.282569
419	1	320	+13863161012	inbound	ctm	3983452187	129	\N	Initial call from CTM	2026-01-26 18:03:11.964356
420	1	321	+18502075353	inbound	ctm	3983678585	55	\N	Initial call from CTM	2026-01-26 18:52:55.324955
421	1	321	+18502075353	inbound	ctm	3983784674	43	\N	Follow-up call from CTM	2026-01-26 19:17:09.961035
422	1	301	+18432266270	inbound	ctm	3984009632	54	\N	Follow-up call from CTM	2026-01-26 20:12:38.40058
423	1	322	+12055164486	inbound	ctm	3984072449	47	\N	Initial call from CTM	2026-01-26 20:28:35.017023
424	1	323	+14405703111	inbound	ctm	3984219764	93	\N	Initial call from CTM	2026-01-26 21:07:27.646456
425	1	321	+18502075353	inbound	ctm	3984431714	44	\N	Follow-up call from CTM	2026-01-26 22:05:40.738321
426	1	324	+15012760295	inbound	ctm	3984559244	50	\N	Initial call from CTM	2026-01-26 22:49:25.064079
427	1	307	+13344886413	inbound	ctm	3984546776	358	\N	Follow-up call from CTM	2026-01-26 22:49:41.932346
428	1	325	+18502883879	inbound	ctm	3984952752	174	\N	Initial call from CTM	2026-01-27 08:22:49.07918
429	1	326	+19092485589	inbound	ctm	3985373277	53	\N	Initial call from CTM	2026-01-27 15:30:31.421265
430	1	326	+19092485589	inbound	ctm	3985377075	34	\N	Follow-up call from CTM	2026-01-27 15:31:02.823285
431	1	322	+12055164486	inbound	ctm	3985742130	258	\N	Follow-up call from CTM	2026-01-27 17:04:02.811661
432	1	327	+15123689843	inbound	ctm	3986334240	51	\N	Initial call from CTM	2026-01-27 19:06:35.022885
433	1	328	+17286669966	inbound	ctm	3986369970	32	\N	Initial call from CTM	2026-01-27 19:13:58.14264
434	1	328	+17286669966	inbound	ctm	3986372880	27	\N	Follow-up call from CTM	2026-01-27 19:14:31.936619
435	1	329	+15186468254	inbound	ctm	3986440335	150	\N	Initial call from CTM	2026-01-27 19:32:44.512609
436	1	330	+19414477977	inbound	ctm	3986641680	73	\N	Initial call from CTM	2026-01-27 20:19:36.168717
437	1	331	+12512727070	inbound	ctm	3986785431	61	\N	Initial call from CTM	2026-01-27 20:52:21.566431
438	1	88	+17862187590	inbound	ctm	3987826067	1	\N	Follow-up call from CTM	2026-01-28 14:26:53.564772
439	1	88	+17862187590	inbound	ctm	3987826436	\N	\N	Follow-up call from CTM	2026-01-28 14:26:54.011486
440	1	88	+17862187590	inbound	ctm	3987826610	80	\N	Follow-up call from CTM	2026-01-28 14:28:59.034506
441	1	332	+13184010440	inbound	ctm	3988232231	51	\N	Initial call from CTM	2026-01-28 16:25:47.415215
442	1	333	+13054627831	inbound	ctm	3988421654	30	\N	Initial call from CTM	2026-01-28 17:06:48.384063
443	1	334	+18504321222	inbound	ctm	3988893131	31	\N	Initial call from CTM	2026-01-28 18:47:41.387764
444	1	335	+18505027710	inbound	ctm	3988945061	67	\N	Initial call from CTM	2026-01-28 19:01:12.67196
445	1	336	+14843505912	inbound	ctm	3988985819	58	\N	Initial call from CTM	2026-01-28 19:09:44.370954
446	1	337	+18505176320	inbound	ctm	3989174018	196	\N	Initial call from CTM	2026-01-28 19:56:53.530468
447	1	338	+19292028280	inbound	ctm	3989529884	10	\N	Initial call from CTM	2026-01-28 21:16:31.954804
448	1	339	+12513770500	inbound	ctm	3989561495	58	\N	Initial call from CTM	2026-01-28 21:26:37.654908
449	1	340	+16014804645	inbound	ctm	3989704283	60	\N	Initial call from CTM	2026-01-28 22:08:45.434897
450	1	339	+12513770500	inbound	ctm	3989707511	44	\N	Follow-up call from CTM	2026-01-28 22:09:24.920202
451	1	341	+19172300631	inbound	ctm	3989928974	33	\N	Initial call from CTM	2026-01-28 23:33:17.652613
452	1	342	+18502027220	inbound	ctm	3990292754	30	\N	Initial call from CTM	2026-01-29 13:08:18.183427
453	1	343	+13375158286	inbound	ctm	3990500042	47	\N	Initial call from CTM	2026-01-29 14:52:21.074154
454	1	344	+13867779628	inbound	ctm	3990529091	31	\N	Initial call from CTM	2026-01-29 15:01:53.261162
455	1	345	+18503465010	inbound	ctm	3990660440	341	\N	Initial call from CTM	2026-01-29 15:40:11.2378
456	1	346	+14433191722	inbound	ctm	3991003091	33	\N	Initial call from CTM	2026-01-29 16:49:54.171209
457	1	318	+15614539055	inbound	ctm	3991133768	84	\N	Follow-up call from CTM	2026-01-29 17:17:11.367868
458	1	347	+12147341020	inbound	ctm	3991143362	71	\N	Initial call from CTM	2026-01-29 17:18:42.011005
459	1	326	+19092485589	inbound	ctm	3991145438	82	\N	Follow-up call from CTM	2026-01-29 17:19:17.26295
460	1	348	+12053883433	inbound	ctm	3991216223	30	\N	Initial call from CTM	2026-01-29 17:32:03.624504
461	1	349	+18016785270	inbound	ctm	3991585913	34	\N	Initial call from CTM	2026-01-29 18:51:29.06697
462	1	349	+18016785270	inbound	ctm	3991609697	35	\N	Follow-up call from CTM	2026-01-29 18:57:02.712279
463	1	350	+18507418004	inbound	ctm	3991681799	41	\N	Initial call from CTM	2026-01-29 19:13:44.145012
464	1	349	+18016785270	inbound	ctm	3991799207	270	\N	Follow-up call from CTM	2026-01-29 19:44:37.039209
465	1	351	+16157082902	inbound	ctm	3991850333	20	\N	Initial call from CTM	2026-01-29 19:52:06.424358
466	1	351	+16157082902	inbound	ctm	3991851923	69	\N	Follow-up call from CTM	2026-01-29 19:54:02.512213
467	1	352	+14482278478	inbound	ctm	3992280092	64	\N	Initial call from CTM	2026-01-29 21:43:05.458233
468	1	353	+18507481316	inbound	ctm	3992701979	46	\N	Initial call from CTM	2026-01-30 00:33:11.154892
469	1	353	+18507481316	inbound	ctm	3992703167	30	\N	Follow-up call from CTM	2026-01-30 00:33:48.309177
470	1	318	+15614539055	inbound	ctm	3992819567	274	\N	Follow-up call from CTM	2026-01-30 02:52:01.177825
471	1	354	+12055792159	inbound	ctm	3992851181	122	\N	Initial call from CTM	2026-01-30 04:37:49.243255
472	1	326	+19092485589	inbound	ctm	3992953244	29	\N	Follow-up call from CTM	2026-01-30 13:21:08.193524
473	1	355	+19149666095	inbound	ctm	3992992778	10	\N	Initial call from CTM	2026-01-30 13:54:02.812746
474	1	356	+12144996202	inbound	ctm	3993160970	509	\N	Initial call from CTM	2026-01-30 15:07:40.538495
475	1	357	+12563888350	inbound	ctm	3993217946	195	\N	Initial call from CTM	2026-01-30 15:18:23.502766
476	1	358	+18136387582	inbound	ctm	3994095869	83	\N	Initial call from CTM	2026-01-30 18:54:30.397144
477	1	358	+18136387582	inbound	ctm	3994160183	46	\N	Follow-up call from CTM	2026-01-30 19:08:27.200491
478	1	359	+18502027340	inbound	ctm	3994373009	35	\N	Initial call from CTM	2026-01-30 20:03:50.327217
479	1	318	+15614539055	inbound	ctm	3995085074	239	\N	Follow-up call from CTM	2026-01-31 01:17:25.235562
480	1	360	+18504504105	inbound	ctm	3995090834	102	\N	Initial call from CTM	2026-01-31 01:23:32.248679
481	1	361	+14052894981	inbound	ctm	3995160719	39	\N	Initial call from CTM	2026-01-31 04:36:28.513005
482	1	318	+15614539055	inbound	ctm	3995170583	187	\N	Follow-up call from CTM	2026-01-31 05:50:44.566961
483	1	362	+12516541007	inbound	ctm	3995202941	217	\N	Initial call from CTM	2026-01-31 12:31:32.616543
484	1	363	+18137433565	inbound	ctm	3995264123	176	\N	Initial call from CTM	2026-01-31 14:33:46.641164
485	1	364	+19857144835	inbound	ctm	3995316872	110	\N	Initial call from CTM	2026-01-31 15:18:10.162034
486	1	362	+12516541007	inbound	ctm	3995441150	180	\N	Follow-up call from CTM	2026-01-31 16:38:35.100252
487	1	362	+12516541007	inbound	ctm	3995465468	86	\N	Follow-up call from CTM	2026-01-31 16:52:59.04865
488	1	362	+12516541007	inbound	ctm	3995617460	202	\N	Follow-up call from CTM	2026-01-31 18:30:51.393025
489	1	276	+18502818420	inbound	ctm	3995689949	61	\N	Follow-up call from CTM	2026-01-31 19:18:06.125138
490	1	360	+18504504105	inbound	ctm	3995727506	46	\N	Follow-up call from CTM	2026-01-31 19:45:25.86472
491	1	365	+15015998788	inbound	ctm	3995790050	60	\N	Initial call from CTM	2026-01-31 20:32:48.750928
492	1	366	+18503982932	inbound	ctm	3995796509	479	\N	Initial call from CTM	2026-01-31 20:44:15.195379
493	1	367	+14482390410	inbound	ctm	3995820068	106	\N	Initial call from CTM	2026-01-31 20:56:35.074082
494	1	360	+18504504105	inbound	ctm	3996227564	939	\N	Follow-up call from CTM	2026-02-01 15:25:46.773399
495	1	277	+12055312815	inbound	ctm	3996295307	254	\N	Follow-up call from CTM	2026-02-01 16:36:45.976663
496	1	368	+18503980982	inbound	ctm	3996685940	30	\N	Initial call from CTM	2026-02-01 23:33:03.664185
497	1	369	+12254595837	inbound	ctm	3996694991	177	\N	Initial call from CTM	2026-02-01 23:50:12.956303
498	1	370	+16592438153	inbound	ctm	3996936926	62	\N	Initial call from CTM	2026-02-02 13:29:12.746985
499	1	371	+18505868596	inbound	ctm	3997106540	385	\N	Initial call from CTM	2026-02-02 14:44:42.586491
500	1	103	+12283341163	inbound	ctm	3997166348	152	\N	Follow-up call from CTM	2026-02-02 14:57:19.407729
501	1	372	+16014021940	inbound	ctm	3997416446	150	\N	Initial call from CTM	2026-02-02 15:50:48.045139
502	1	373	+18503747167	inbound	ctm	3997464848	73	\N	Initial call from CTM	2026-02-02 16:01:58.936321
503	1	374	+12058024210	inbound	ctm	3997839998	39	\N	Initial call from CTM	2026-02-02 17:22:24.021192
504	1	375	+14125614290	inbound	ctm	3997955996	40	\N	Initial call from CTM	2026-02-02 17:46:25.695058
505	1	376	+17185752000	inbound	ctm	3997984448	59	\N	Initial call from CTM	2026-02-02 17:52:29.380241
506	1	374	+12058024210	inbound	ctm	3997922951	1468	\N	Follow-up call from CTM	2026-02-02 18:03:14.324434
507	1	377	+18503821102	inbound	ctm	3998174051	39	\N	Initial call from CTM	2026-02-02 18:33:26.146635
508	1	378	+18006696777	inbound	ctm	3998218148	35	\N	Initial call from CTM	2026-02-02 18:43:29.693391
509	1	379	+16157915440	inbound	ctm	3998566799	33	\N	Initial call from CTM	2026-02-02 20:02:41.765705
510	1	379	+16157915440	inbound	ctm	3998594060	18	\N	Follow-up call from CTM	2026-02-02 20:08:02.28006
511	1	380	+16153206772	inbound	ctm	3998618348	32	\N	Initial call from CTM	2026-02-02 20:13:50.614951
512	1	381	+14074188295	inbound	ctm	3998641916	\N	\N	Initial call from CTM	2026-02-02 20:18:05.783113
513	1	382	+19082817800	inbound	ctm	3998634806	142	\N	Initial call from CTM	2026-02-02 20:19:34.811242
514	1	379	+16157915440	inbound	ctm	3998642645	40	\N	Follow-up call from CTM	2026-02-02 20:19:34.844254
515	1	380	+16153206772	inbound	ctm	3998667974	32	\N	Follow-up call from CTM	2026-02-02 20:25:19.682364
516	1	383	+18504494862	inbound	ctm	3998753783	34	\N	Initial call from CTM	2026-02-02 20:45:41.98264
517	1	384	+12515102510	inbound	ctm	3998812007	91	\N	Initial call from CTM	2026-02-02 21:01:09.388504
518	1	385	+16019428748	inbound	ctm	3999222893	31	\N	Initial call from CTM	2026-02-02 22:45:08.251416
519	1	386	+17023307907	inbound	ctm	3999410102	130	\N	Initial call from CTM	2026-02-02 23:54:16.948142
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.companies (id, name, billing_email, billing_address, billing_phone, billing_notes, created_at, updated_at, ctm_webhook_token, ctm_webhook_secret, ctm_enabled, ai_assistance_enabled, ai_budget_limit_cents, ai_usage_this_month_cents, ai_usage_reset_date, total_beds) FROM stdin;
1	Gulf Breeze Recovery	\N	\N	\N	\N	2025-12-16 02:28:20.623392	2026-01-14 19:06:25.293	gbr2024ctm	\N	yes	yes	\N	0	2026-02-01 00:00:00	32
\.


--
-- Data for Name: contact_submissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contact_submissions (id, email, phone, company_name, message, source, user_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inquiries (id, user_id, stage, caller_name, client_name, phone_number, email, date_of_birth, referral_source, referral_details, call_date_time, initial_notes, is_viable, non_viable_reason, non_viable_notes, insurance_provider, insurance_policy_id, insurance_notes, vob_status, vob_details, coverage_details, quoted_cost, client_responsibility, vob_completed_at, quote_accepted, quote_notes, pre_assessment_completed, pre_assessment_date, pre_assessment_notes, expected_admit_date, level_of_care, admission_type, scheduling_notes, actual_admit_date, admitted_notes, call_recording_url, transcription, ai_extracted_data, created_at, updated_at, ctm_call_id, ctm_tracking_number, ctm_source, call_duration_seconds, lost_reason, lost_notes, referral_origin, referral_account_id, online_source, vob_file_url, in_network_deductible, in_network_deductible_met, in_network_oop_max, in_network_oop_met, has_out_of_network_benefits, out_of_network_deductible, out_of_network_deductible_met, out_of_network_oop_max, out_of_network_oop_met, state_restrictions, pre_cert_required, pre_auth_required, pre_cert_auth_details, has_substance_use_benefits, has_mental_health_benefits, benefit_notes, arrival_email_sent_at, call_summary, company_id, seeking_sud_treatment, seeking_mental_health, seeking_eating_disorder, presenting_problems) FROM stdin;
28	\N	inquiry	GRAND RAPIDS MI	\N	+16162853208	\N	\N	website	Previous Website	2025-12-20 03:11:07.789	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3913917684\nTracking Number: +18554006190\nCall Duration: 151 seconds\nLocation: Grand Rapids, MI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 03:11:07.801702	2025-12-20 03:11:07.801702	3913917684	+18554006190	Previous Website	151	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
29	\N	inquiry	TIMOTHY CRAIG	\N	+12109952873	\N	\N	website	DM - Multi-Organic Search	2025-12-20 03:24:43.271	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918020121\nTracking Number: +18335512356\nCall Duration: 133 seconds\nLocation: San Antonio, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 03:24:43.283725	2025-12-20 03:24:43.283725	3918020121	+18335512356	DM - Multi-Organic Search	133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
56	\N	inquiry	BELVDR TIBRN CA	\N	+14153160763	\N	\N	other	DM - Brand & SSL Search	2025-12-22 19:39:10.51	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3920992497\nTracking Number: +18335512304\nCall Duration: 89 seconds\nLocation: Belvedere (Marin), CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 19:39:10.522701	2025-12-22 19:39:10.522701	3920992497	+18335512304	DM - Brand & SSL Search	89	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
24	\N	non_viable	PENSACOLA    FL	\N	+18506194209	\N	\N	other	DM - Brand & SSL Search	2025-12-19 18:00:39.42	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3916884780\nTracking Number: +18335512304\nCall Duration: 28 seconds\nLocation: Pensacola, FL	no	other		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 18:00:39.432216	2025-12-19 19:30:03.758	3916884780	+18335512304	DM - Brand & SSL Search	28	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
23	\N	non_viable	MARTHA HORTON	\N	+19704563268	\N	\N	website	DM - Multi-Organic Search	2025-12-19 17:42:15.683	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3916813044\nTracking Number: +18335512356\nCall Duration: 121 seconds\nLocation: Glenwood Springs, CO	no	no_financial_means		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 17:42:15.695587	2025-12-19 19:30:54.246	3916813044	+18335512356	DM - Multi-Organic Search	121	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
22	\N	non_viable	APALACHICOLA FL	\N	+18503235894	\N	\N	other	DM - Brand & SSL Search	2025-12-19 17:18:50.97	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3916734648\nTracking Number: +18335512304\nCall Duration: 9 seconds\nLocation: Apalachicola, FL	no	no_financial_means		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 17:18:50.981864	2025-12-19 19:31:08.014	3916734648	+18335512304	DM - Brand & SSL Search	9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
21	\N	non_viable	PANAMA CITY  FL	\N	+18508966460	\N	\N	other	DM - Ad Extension	2025-12-19 17:18:50.858	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3916733694\nTracking Number: +18334751492\nCall Duration: 25 seconds\nLocation: Panama City, FL	no	no_financial_means		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 17:18:50.876049	2025-12-19 19:31:19.759	3916733694	+18334751492	DM - Ad Extension	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
20	\N	non_viable	ALBANY       NY	\N	+15185916920	\N	\N	google	Google My Business Listing	2025-12-19 16:51:51.172	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3916629723\nTracking Number: +18558990319\nCall Duration: 33 seconds\nLocation: Albany, NY	no	no_financial_means		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 16:51:51.183518	2025-12-19 19:31:31.881	3916629723	+18558990319	Google My Business Listing	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
26	\N	non_viable	EDGE MD SOLUTIO	\N	+14156926481	\N	\N	other	DM - Brand & SSL Search	2025-12-19 21:03:35.179	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3917499699\nTracking Number: +18335512304\nCall Duration: 103 seconds\nLocation: San Francisco:Central Da, CA	no	other		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 21:03:35.190791	2025-12-20 02:21:41.909	3917499699	+18335512304	DM - Brand & SSL Search	103	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
27	\N	non_viable	ROSEVILLE    MI	\N	+15868991344	\N	\N	google	DM - Google Ads	2025-12-19 21:51:47.189	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3917652618\nTracking Number: +18334251241\nCall Duration: 59 seconds\nLocation: Roseville, MI	no	other		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 21:51:47.205783	2025-12-20 02:22:04.582	3917652618	+18334251241	DM - Google Ads	59	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
25	\N	non_viable	PATRICK DOYLE	\N	+16172905060	\N	\N	other	DM - Brand & SSL Search	2025-12-19 21:00:20.431	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3917489733\nTracking Number: +18335512304\nCall Duration: 83 seconds\nLocation: Cambridge, MA	no	other		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 21:00:20.444539	2025-12-20 02:22:43.934	3917489733	+18335512304	DM - Brand & SSL Search	83	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
30	\N	inquiry	MOORESTOWN   NJ	\N	+18569009692	\N	\N	website	DM - Multi-Organic Search	2025-12-20 07:23:17.429	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918052422\nTracking Number: +18335512356\nCall Duration: 317 seconds\nLocation: Moorestown, NJ	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 07:23:17.442225	2025-12-20 07:23:17.442225	3918052422	+18335512356	DM - Multi-Organic Search	317	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
31	\N	inquiry	MEMPHIS      TN	\N	+19012084915	\N	\N	other	DM - Ad Extension	2025-12-20 10:49:56.376	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918065355\nTracking Number: +18334751492\nCall Duration: 310 seconds\nLocation: Memphis, TN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 10:49:56.388014	2025-12-20 10:49:56.388014	3918065355	+18334751492	DM - Ad Extension	310	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
32	\N	inquiry	LA CRESCENTA CA	\N	+17472553458	\N	\N	website	DM - Multi-Organic Search	2025-12-20 12:41:16.384	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918077286\nTracking Number: +18335512356\nCall Duration: 202 seconds\nLocation: La Crescenta, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 12:41:16.39654	2025-12-20 12:41:16.39654	3918077286	+18335512356	DM - Multi-Organic Search	202	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
33	\N	inquiry	JACKSONVILLE FL	\N	+19044057787	\N	\N	other	DM - Ad Extension	2025-12-20 14:01:45.092	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918102381\nTracking Number: +18334751492\nCall Duration: 104 seconds\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 14:01:45.105479	2025-12-20 14:01:45.105479	3918102381	+18334751492	DM - Ad Extension	104	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
34	\N	inquiry	N NADREAU	\N	+18505825588	\N	\N	other	DM - Brand & SSL Search	2025-12-20 14:13:48.964	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918118098\nTracking Number: +18335512304\nCall Duration: 55 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 14:13:48.975812	2025-12-20 14:13:48.975812	3918118098	+18335512304	DM - Brand & SSL Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
35	\N	inquiry	NOTASULGA    AL	\N	+13344015844	\N	\N	other	DM - Ad Extension	2025-12-20 14:18:42.897	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918122463\nTracking Number: +18334751492\nCall Duration: 36 seconds\nLocation: Notasulga, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 14:18:42.909459	2025-12-20 14:18:42.909459	3918122463	+18334751492	DM - Ad Extension	36	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
36	\N	inquiry	LISA CHARNEY	\N	+17408518007	\N	\N	google	DM - Google Ads	2025-12-20 14:56:31.537	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918156057\nTracking Number: +18334251241\nCall Duration: 75 seconds\nLocation: Fort Wayne, OH	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 14:56:31.548457	2025-12-20 14:56:31.548457	3918156057	+18334251241	DM - Google Ads	75	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
58	\N	inquiry	FOLEY        AL	\N	+12513248012	\N	\N	other	DM - Brand & SSL Search	2025-12-22 20:04:08.218	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921090942\nTracking Number: +18335512304\nCall Duration: 17 seconds\nLocation: Foley, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 20:04:08.22858	2025-12-22 20:04:08.22858	3921090942	+18335512304	DM - Brand & SSL Search	17	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
57	\N	inquiry	JENNIFER BURKE	\N	+18053006625	\N	\N	other	DM - Brand & SSL Search	2025-12-22 19:53:44.371	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921050484\nTracking Number: +18335512304\nCall Duration: 14 seconds\nLocation: Thousand Oaks, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 19:53:44.38322	2025-12-22 20:00:18.69	3921050484	+18335512304	DM - Brand & SSL Search	14	\N	\N	account	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	yes	\N	\N	\N
59	\N	inquiry	JESSICA WEST	\N	+17047734291	\N	\N	other	DM - Brand & SSL Search	2025-12-23 00:18:34.974	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921781365\nTracking Number: +18335512304\nCall Duration: 170 seconds\nLocation: Harrisburg, NC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 00:18:34.986849	2025-12-23 00:18:34.986849	3921781365	+18335512304	DM - Brand & SSL Search	170	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
60	\N	inquiry	ZACHARY WARD	\N	+13194647590	\N	\N	other	DM - Brand & SSL Search	2025-12-23 00:49:19.861	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921822927\nTracking Number: +18335512304\nCall Duration: 33 seconds\nLocation: Waterloo, IA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 00:49:19.874886	2025-12-23 00:49:19.874886	3921822927	+18335512304	DM - Brand & SSL Search	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
39	\N	inquiry	ANDREA AYMOND	\N	+13183590857	\N	\N	other	DM - Brand & SSL Search	2025-12-20 17:45:20.341	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918410607\nTracking Number: +18335512304\nCall Duration: 62 seconds\nLocation: Marksville, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 17:45:20.35205	2025-12-20 17:45:20.35205	3918410607	+18335512304	DM - Brand & SSL Search	62	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
40	\N	inquiry	ANGELA REEVES	\N	+12397768552	\N	\N	other	DM - Local Listing	2025-12-20 18:43:12.926	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918502707\nTracking Number: +18508459350\nCall Duration: 55 seconds\nLocation: Naples, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 18:43:12.93793	2025-12-20 18:43:12.93793	3918502707	+18508459350	DM - Local Listing	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
41	\N	inquiry	DAVID SMITH	\N	+14783029145	\N	\N	other	DM - Brand & SSL Search	2025-12-20 19:43:18.098	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918582789\nTracking Number: +18335512304\nCall Duration: 13 seconds\nLocation: Warnerrbns, GA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 19:43:18.11199	2025-12-20 19:43:18.11199	3918582789	+18335512304	DM - Brand & SSL Search	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
19	51375099	admitted	Karen Brasch	Shaina Brasch	407.729.4105		1988-04-03	\N		2025-12-19 16:36:08.574	Mom called for daughter who has been at river view in Tampa for 5 days. Wants to transfer asap. Can pay out of pocket some but wants to use bcbs.	\N	\N	\N	Blue Cross Blue Shield	ZGP819336317	Can pay some out of pocket since client is transferring 	\N	facility. \n\nFacility: Gulf Breeze Treatment Center, LLC\nPolicy Status: Active \nNetwork Status: In-Network\nVOB Name: VOB-037911\nPATIENT INFORMATION\n\nPatient First Name: Shaina\nPatient Last Name: Brasch\nDate of Birth: 4/10/1988\nStreet Address: 26220 BILTMORE STREET\nCity: SORRENTO\nState: Florida - FL\nZIP Code: 32776-9409\n\nSubscriber First Name: Self\nSubscriber Last Name:\nSubscriber Date of Birth:\n\nCOB on file: No\nCOB Last updated:\n\n\nCO-INSURANCE AND DEDUCTIBLE INFORMATION\n\nFacility Receives: 70\nIndividual Deductible: $3,500.00\nIndividual Deductible Met: $0.00\nIndividual Out of Pocket Max: $8,150.00\nIndividual Out of Pocket Met: $561.67\n\nFamily Deductible:\nFamily Deductible Met:\nFamily Out of Pocket Max:\nFamily Out of Pocket Met:\n\nAny Day or Dollar Max: $0.00\nDeductible apply to the OOP: Yes\nDoes In and OON cross Accumulate: No\n\n\nSUBSTANCE ABUSE LEVELS OF CARE INFORMATION\n\nDetox Covered: Based on Medical Necessity\nDetox Percent: 70   \nDetox days per year: BMN    \nDay days used: BMN    \nRTC Covered: Based on Medical Necessity   \nRTC Percent: 70 \nRTC days per year: BMN  \nRTC days used: BMN\n\nPHP Covered: Based on Medical Necessity\nPHP Percent: 70\nPHP days per year: BMN\nPHP days used: BMN\n\nIOP Covered: Based on Medical Necessity\nIOP Percent: 70\nIOP days per year: BMN\nIOP days used: BMN\n\nOutpatient Individual/Group Covered: Based on Medical Necessity \nOP Percent: 0\nOP days per year: BMN\nOP days used: BMN\nACCREDITATION INFORMATION\n\nFree Standing Facility Covered: Yes\nState License Sufficient for all Levels of care: Yes \nOut of Area or State Restrictions: No\nIs JCAHO/CARF required: No\nIf Yes: For which levels of care? Not Applicable\n\n\nINSURANCE INFORMATION\n\nInsurance Payor: BCBS of Texas \nPolicy Number: ZGP819336317  \nGroup Number: 129391\nGroup/Employer: TRP CONSTRUCTION GROUP LLC              \nPlan Type: PPO\nEffective Date: 11/1/2025\nPaid Thru Date:\nPolicy Term Date:\nPayor Phone Number: (800) 528-7264\nPlan Year or Calendar Year Policy: Calendar\nSelf Fund or Fully Funded:Fully Funded - Purchased through Insurance Carrier\n\n\nPAYMENT INFORMATION\n\nReimbursement Rate: Contracted Rate\nPayment sent to Facility or Patient: Accept Assignment of Benefits\nSelf Fund or Fully Funded: Fully Funded - Purchased through Insurance Carrier\nTimely Filling for Providers: 180 Days from Date of Service\n\nCOB on file: No\nCOB Last updated:\n\n\nCO-PAY INFORMATION\n\nCo-pay Apply: Yes\n\nInpatient Copay:\nInpatient Copay Frequency: \nInpatient Copay First # Of Days Due: \n\nOutpatient Copay: \nOutpatient Copay Frequency: \nOutpatient Copay First # Of Days Due: \n\nRoutine OP Copay: $35\nRoutine OP Frequency: Per Visit (Individual or Group)\nRoutine OP First # Of Days Due: \n\nIs PHP Considered Inpatient or Outpatient?: Outpatient\nAre Copays ever Waived?: Once OOP Is Met Copays are Waived\n\nCopay Information if Applicable:  \n\nMENTAL HEALTH LEVELS OF CARE INFORMATION\n\nRTC Mental Health covered: Based on Medical Necessity\nRTC Mental Health Percent: 70\nRTC Mental Health Days Per Year: BMN\nRTC Mental Health Days used: BMN\n\nPHP Mental Health covered: Based on Medical Necessity \nPHP Mental Health Percent: 70\nPHP Mental Health Days Per Year: BMN\nPHP Mental Health Days used: BMN\n\nIOP Mental Health covered: Based on Medical Necessity \nIOP Mental Health Percent: 70\nIOP Mental Health Days Per Year: BMN\nIOP Mental Health Days used: BMN\n\nOutpatient Mental Health Individual/Group Covered: Based on Medical Necessity \nRoutine Outpatient Mental Health Percent: 0\nRoutine Outpatient Days Per Year: BMN\nRoutine Outpatient Days used: BMN\n\nBEHAVIORAL HEALTH INFORMATION\n\nBehavioral Health Company: BCBS of Texas\nBehavioral Health Phone Number: (800) 851-7498  \nPre-Cert Penalty: DENIAL \nPre-Cert Timing: PRIOR ADMISSION   \n\n\nVERIFICATION OF BENEFITS ADDITIONAL COMMENTS\n\n\n\n\n\n\n\n\nVOB Department\nVOB@Remedy-Billing.com\nwww.Remedy-Billing.com\n\nCLAIMS MAILING INFORMATIO	BCBS of Texas PPO plan is in-network with Gulf Breeze Treatment Center. The policy includes coverage for substance use and mental health treatment at 70% based on medical necessity, with a $3,500 in-network deductible, $8,150 out-of-pocket max, and pre-certification required. No out-of-network benefits are available.	25000	25000	2025-12-20 15:43:19.756	yes		yes	2025-12-20 16:04:29.219		2025-12-20	residential	in_network	Client is transferring door to door from river view in Tampa. Mom is driving her. 	2025-12-20	\N	\N	\N	\N	2025-12-19 16:36:08.58634	2025-12-20 16:05:11.888	\N	\N	\N	\N	\N	\N	online	\N	google_organic		$3,500.00	$0.00	$8,150.00	$561.67	no					No	yes	yes	Pre-certification is required prior to admission. Failure to meet this requirement results in denial.	yes	yes	All levels of care for substance use and mental health are covered based on medical necessity. Copays are waived once the out-of-pocket max is met. Routine outpatient mental health and substance use coverage is 0%.	\N	\N	1	yes	\N	\N	Alcoholic that has been in treatment for 5 days. Overcrowded wants smaller community and be with people who want to be in treatment.
37	\N	inquiry	PENSACOLA    FL	\N	+18505037912	\N	\N	other	DM - Brand & SSL Search	2025-12-20 16:44:20.001	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918313497\nTracking Number: +18335512304\nCall Duration: 72 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 16:44:20.01389	2025-12-20 16:44:20.01389	3918313497	+18335512304	DM - Brand & SSL Search	72	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
38	\N	inquiry	MIAMI        FL	\N	+13058074252	\N	\N	other	DM - Brand & SSL Search	2025-12-20 17:18:24.056	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918371838\nTracking Number: +18335512304\nCall Duration: 37 seconds\nLocation: Miami, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 17:18:24.069806	2025-12-20 17:18:24.069806	3918371838	+18335512304	DM - Brand & SSL Search	37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
42	\N	inquiry	ANAHEIM      CA	\N	+17143510350	\N	\N	other	DM - Brand & SSL Search	2025-12-20 20:06:17.56	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918609675\nTracking Number: +18335512304\nCall Duration: 85 seconds\nLocation: Anaheim, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 20:06:17.572504	2025-12-20 20:06:17.572504	3918609675	+18335512304	DM - Brand & SSL Search	85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
43	\N	inquiry	DEBBIE HOUSE	\N	+16018435000	\N	\N	google	DM - Google Ads	2025-12-20 21:50:24.441	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918730359\nTracking Number: +18334251241\nCall Duration: 36 seconds\nLocation: Little Rock, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 21:50:24.452994	2025-12-20 21:50:24.452994	3918730359	+18334251241	DM - Google Ads	36	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
44	\N	inquiry	TYESHA DAVIS	\N	+19047554020	\N	\N	other	DM - Ad Extension	2025-12-21 06:05:57.205	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3918942891\nTracking Number: +18334751492\nCall Duration: 232 seconds\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 06:05:57.21661	2025-12-21 06:05:57.21661	3918942891	+18334751492	DM - Ad Extension	232	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
45	\N	inquiry	LUVERNE      AL	\N	+13343041167	\N	\N	website	DM - Multi-Organic Search	2025-12-21 15:43:13.297	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919080918\nTracking Number: +18335512356\nCall Duration: 66 seconds\nLocation: Luverne, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 15:43:13.308482	2025-12-21 15:43:13.308482	3919080918	+18335512356	DM - Multi-Organic Search	66	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
46	\N	inquiry	NEW ORLEANS  LA	\N	+15042326440	\N	\N	other	DM - Ad Extension	2025-12-21 15:51:41.877	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919085790\nTracking Number: +18334751492\nCall Duration: 117 seconds\nLocation: New Orleans, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 15:51:41.888529	2025-12-21 15:51:41.888529	3919085790	+18334751492	DM - Ad Extension	117	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
47	\N	inquiry	PAUL TYRE	\N	+18508651250	\N	\N	other	DM - Brand & SSL Search	2025-12-21 17:20:42.632	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919165128\nTracking Number: +18335512304\nCall Duration: 82 seconds\nLocation: Ftwaltnbch, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 17:20:42.645469	2025-12-21 17:20:42.645469	3919165128	+18335512304	DM - Brand & SSL Search	82	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
48	\N	inquiry	BAPTIST HOSPITA	\N	+18509342000	\N	\N	website	DM - Multi-Organic Search	2025-12-21 17:28:42.408	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919173222\nTracking Number: +18335512356\nCall Duration: 67 seconds\nLocation: Gulf Breeze, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 17:28:42.419769	2025-12-21 17:28:42.419769	3919173222	+18335512356	DM - Multi-Organic Search	67	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
49	\N	inquiry	FYFFE        AL	\N	+12564401713	\N	\N	other	DM - Ad Extension	2025-12-22 05:14:22.562	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919579161\nTracking Number: +18334751492\nCall Duration: 13 seconds\nLocation: Fyffe, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 05:14:22.57466	2025-12-22 05:14:22.57466	3919579161	+18334751492	DM - Ad Extension	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
50	\N	inquiry	PITTSBURG    KS	\N	+16208750065	\N	\N	other	DM - Brand & SSL Search	2025-12-22 13:34:00.67	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919688235\nTracking Number: +18335512304\nCall Duration: 63 seconds\nLocation: Pittsburg, KS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 13:34:00.682873	2025-12-22 13:34:00.682873	3919688235	+18335512304	DM - Brand & SSL Search	63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
51	\N	inquiry	DONALDSNVL   LA	\N	+12254832298	\N	\N	other	DM - Ad Extension	2025-12-22 14:44:30.086	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919847187\nTracking Number: +18334751492\nCall Duration: 26 seconds\nLocation: Donaldsonville, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 14:44:30.100036	2025-12-22 14:44:30.100036	3919847187	+18334751492	DM - Ad Extension	26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
52	\N	inquiry	MARK GARNER	\N	+12056399081	\N	\N	google	DM - Google Ads	2025-12-22 14:47:58.049	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3919848963\nTracking Number: +18334251241\nCall Duration: 196 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 14:47:58.064076	2025-12-22 14:47:58.064076	3919848963	+18334251241	DM - Google Ads	196	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
53	\N	inquiry	PASCAGOULA   MS	\N	+12282179342	\N	\N	other	DM - Ad Extension	2025-12-22 17:03:57.511	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3920343888\nTracking Number: +18334751492\nCall Duration: 38 seconds\nLocation: Pascagoula, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 17:03:57.524904	2025-12-22 17:03:57.524904	3920343888	+18334751492	DM - Ad Extension	38	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
54	\N	inquiry	S SCOLLARD	\N	+12056124698	\N	\N	other	DM - Brand & SSL Search	2025-12-22 17:56:07.204	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3920568033\nTracking Number: +18335512304\nCall Duration: 36 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 17:56:07.220092	2025-12-22 17:56:07.220092	3920568033	+18335512304	DM - Brand & SSL Search	36	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
55	\N	inquiry	PENSACOLA    FL	\N	+18502329068	\N	\N	other	DM - Brand & SSL Search	2025-12-22 19:09:31.719	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3920862585\nTracking Number: +18335512304\nCall Duration: 56 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 19:09:31.732708	2025-12-22 19:09:31.732708	3920862585	+18335512304	DM - Brand & SSL Search	56	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
61	\N	inquiry	CHAD GARNER	\N	+19726895264	\N	\N	other	DM - Brand & SSL Search	2025-12-23 00:59:30.277	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921832779\nTracking Number: +18335512304\nCall Duration: 215 seconds\nLocation: Grand Prairie, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 00:59:30.288809	2025-12-23 00:59:30.288809	3921832779	+18335512304	DM - Brand & SSL Search	215	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
62	\N	inquiry	SAINT JOHNS  FL	\N	+19048066265	\N	\N	other	DM - Brand & SSL Search	2025-12-23 01:45:25.496	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921870402\nTracking Number: +18335512304\nCall Duration: 55 seconds\nLocation: Saint Johns, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 01:45:25.508921	2025-12-23 01:45:25.508921	3921870402	+18335512304	DM - Brand & SSL Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
63	\N	inquiry	LEEANNE GARNER	\N	+15044428373	\N	\N	other	DM - Brand & SSL Search	2025-12-23 02:33:32.548	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921893268\nTracking Number: +18335512304\nCall Duration: 203 seconds\nLocation: New Orleans, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 02:33:32.560782	2025-12-23 02:33:32.560782	3921893268	+18335512304	DM - Brand & SSL Search	203	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
64	\N	inquiry	PRAIRIEVILLE LA	\N	+12253630015	\N	\N	other	DM - Ad Extension	2025-12-23 07:54:57.254	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3921954642\nTracking Number: +18334751492\nCall Duration: 143 seconds\nLocation: Galvez, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 07:54:57.266419	2025-12-23 07:54:57.266419	3921954642	+18334751492	DM - Ad Extension	143	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
65	\N	inquiry	HONEY LAKE CLIN	\N	+18507241997	\N	\N	google	DM - Google Ads	2025-12-23 13:33:54.798	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3922038681\nTracking Number: +18334251241\nCall Duration: 71 seconds\nLocation: Century, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 13:33:54.811646	2025-12-23 13:33:54.811646	3922038681	+18334251241	DM - Google Ads	71	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
66	\N	inquiry	SHREVEPORT   LA	\N	+13184010284	\N	\N	other	DM - Ad Extension	2025-12-23 16:00:55.6	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3922394172\nTracking Number: +18334751492\nCall Duration: 33 seconds\nLocation: Shreveport, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 16:00:55.613655	2025-12-23 16:00:55.613655	3922394172	+18334751492	DM - Ad Extension	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
67	\N	inquiry	EASTLAND     TX	\N	+12542719155	\N	\N	google	Google My Business Listing	2025-12-23 16:19:51.794	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3922470228\nTracking Number: +18558990319\nCall Duration: 94 seconds\nLocation: TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 16:19:51.807472	2025-12-23 16:19:51.807472	3922470228	+18558990319	Google My Business Listing	94	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
68	\N	inquiry	BONIFAY      FL	\N	+18507686750	\N	\N	other	DM - Brand & SSL Search	2025-12-23 17:49:45.276	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3922832739\nTracking Number: +18335512304\nCall Duration: 45 seconds\nLocation: Bonifay, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 17:49:45.287684	2025-12-23 17:49:45.287684	3922832739	+18335512304	DM - Brand & SSL Search	45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
69	\N	inquiry	CYNTHIA WILLEY	\N	+18507361528	\N	\N	other	DM - Brand & SSL Search	2025-12-23 19:28:30.8	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3923168166\nTracking Number: +18335512304\nCall Duration: 35 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 19:28:30.812941	2025-12-23 19:28:30.812941	3923168166	+18335512304	DM - Brand & SSL Search	35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
70	\N	inquiry	KATHLEEN CONRAN	\N	+19046352315	\N	\N	other	DM - Ad Extension	2025-12-23 19:32:22.003	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3923179026\nTracking Number: +18334751492\nCall Duration: 65 seconds\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 19:32:22.015225	2025-12-23 19:32:22.015225	3923179026	+18334751492	DM - Ad Extension	65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
71	\N	inquiry	COLETTE WILSON	\N	+19132382910	\N	\N	facebook	844-446-5478 Facebook	2025-12-23 21:17:37.6	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3923506500\nTracking Number: +18444465478\nCall Duration: 46 seconds\nLocation: Overland Park, KS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 21:17:37.611728	2025-12-23 21:17:37.611728	3923506500	+18444465478	844-446-5478 Facebook	46	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
72	\N	inquiry	CLINTON      NY	\N	+13155570122	\N	\N	other	NMHCS Card	2025-12-24 01:13:32.855	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3923933889\nTracking Number: +18889026913\nCall Duration: 24 seconds\nLocation: Clinton, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 01:13:32.866632	2025-12-24 01:13:32.866632	3923933889	+18889026913	NMHCS Card	24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
73	\N	inquiry	FELICIA MAYS	\N	+12563283112	\N	\N	other	DM - Brand & SSL Search	2025-12-24 02:50:53.463	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3923980824\nTracking Number: +18335512304\nCall Duration: 55 seconds\nLocation: Gadsden, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 02:50:53.474912	2025-12-24 02:50:53.474912	3923980824	+18335512304	DM - Brand & SSL Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
74	\N	inquiry	SYLACAUGA    AL	\N	+12562672527	\N	\N	other	DM - Ad Extension	2025-12-24 17:43:44.784	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3924529434\nTracking Number: +18334751492\nCall Duration: 29 seconds\nLocation: Sylacauga, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 17:43:44.795724	2025-12-24 17:43:44.795724	3924529434	+18334751492	DM - Ad Extension	29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
75	\N	inquiry	CANDICE MOYE	\N	+12512940334	\N	\N	other	DM - Ad Extension	2025-12-24 18:18:01.276	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3924585525\nTracking Number: +18334751492\nCall Duration: 49 seconds\nLocation: Huxford, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 18:18:01.287924	2025-12-24 18:18:01.287924	3924585525	+18334751492	DM - Ad Extension	49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
76	\N	inquiry	SCOTT LANDOR	\N	+19852856569	\N	\N	other	DM - Ad Extension	2025-12-25 00:04:23.59	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3924941631\nTracking Number: +18334751492\nCall Duration: 32 seconds\nLocation: Slidell, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 00:04:23.601876	2025-12-25 00:04:23.601876	3924941631	+18334751492	DM - Ad Extension	32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
77	\N	inquiry	DANIEL AVILA	\N	+16028039265	\N	\N	other	DM - Brand & SSL Search	2025-12-25 04:17:23.475	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925010010\nTracking Number: +18335512304\nCall Duration: 355 seconds\nLocation: Phoenix, AZ	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 04:17:23.486876	2025-12-25 04:17:23.486876	3925010010	+18335512304	DM - Brand & SSL Search	355	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
78	\N	inquiry	MIAMI        FL	\N	+17867202002	\N	\N	other	DM - Ad Extension	2025-12-25 05:23:55.594	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925017714\nTracking Number: +18334751492\nCall Duration: 339 seconds\nLocation: Miami, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 05:23:55.60634	2025-12-25 05:23:55.60634	3925017714	+18334751492	DM - Ad Extension	339	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
79	\N	inquiry	Incoming Call	\N	+14482405661	\N	\N	other	DM - Brand & SSL Search	2025-12-25 15:23:55.671	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925125618\nTracking Number: +18335512304\nCall Duration: 46 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 15:23:55.68329	2025-12-25 15:23:55.68329	3925125618	+18335512304	DM - Brand & SSL Search	46	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
80	\N	inquiry	PENSACOLA    FL	\N	+18506969400	\N	\N	other	DM - Ad Extension	2025-12-25 17:10:55.128	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925170426\nTracking Number: +18334751492\nCall Duration: 41 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 17:10:55.140496	2025-12-25 17:10:55.140496	3925170426	+18334751492	DM - Ad Extension	41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
81	\N	inquiry	ANN ARBOR    MI	\N	+17344504882	\N	\N	other	DM - Ad Extension	2025-12-25 18:27:59.4	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925201623\nTracking Number: +18334751492\nCall Duration: 51 seconds\nLocation: Ann Arbor, MI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 18:27:59.412618	2025-12-25 18:27:59.412618	3925201623	+18334751492	DM - Ad Extension	51	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
82	\N	inquiry	JOSEPH DIAMANTE	\N	+15185966200	\N	\N	google	Google My Business Listing	2025-12-25 22:39:00.419	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925297542\nTracking Number: +18558990319\nCall Duration: 34 seconds\nLocation: Albany, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 22:39:00.431132	2025-12-25 22:39:00.431132	3925297542	+18558990319	Google My Business Listing	34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
83	\N	inquiry	LIFE CARE CTR T	\N	+19314558557	\N	\N	other	DM - Social Media	2025-12-25 23:30:55.627	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925314765\nTracking Number: +18335512351\nCall Duration: 2 seconds\nLocation: Tullahoma, TN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-25 23:30:55.639711	2025-12-25 23:30:55.639711	3925314765	+18335512351	DM - Social Media	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
84	\N	inquiry	LILBURN      GA	\N	+16783270526	\N	\N	other	DM - Brand & SSL Search	2025-12-26 14:28:53.497	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925532145\nTracking Number: +18335512304\nCall Duration: 61 seconds\nLocation: Atlanta Northeast, GA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 14:28:53.509048	2025-12-26 14:28:53.509048	3925532145	+18335512304	DM - Brand & SSL Search	61	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
85	\N	inquiry	MILTON       FL	\N	+18507365889	\N	\N	other	DM - Brand & SSL Search	2025-12-26 16:30:13.196	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3925815906\nTracking Number: +18335512304\nCall Duration: 172 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 16:30:13.208333	2025-12-26 16:30:13.208333	3925815906	+18335512304	DM - Brand & SSL Search	172	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
86	\N	inquiry	MILPITAS     CA	\N	+14082096581	\N	\N	other	DM - Brand & SSL Search	2025-12-26 18:08:08.841	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3926060145\nTracking Number: +18335512304\nCall Duration: 998 seconds\nLocation: San Jose:North Da, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 18:08:08.852681	2025-12-26 18:08:08.852681	3926060145	+18335512304	DM - Brand & SSL Search	998	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
87	\N	inquiry	LINDSEY BEARDEN	\N	+12059028386	\N	\N	other	DM - Ad Extension	2025-12-26 18:30:22.58	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3926164143\nTracking Number: +18334751492\nCall Duration: 44 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 18:30:22.59076	2025-12-26 18:30:22.59076	3926164143	+18334751492	DM - Ad Extension	44	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
88	\N	inquiry	JERRY TEMPLER	\N	+17862187590	\N	\N	other	DM - Brand & SSL Search	2025-12-26 18:59:41.434	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3926219895\nTracking Number: +18335512304\nCall Duration: 531 seconds\nLocation: Miami, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 18:59:41.445505	2025-12-26 18:59:41.445505	3926219895	+18335512304	DM - Brand & SSL Search	531	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
89	\N	inquiry	SHEENA BROWN	\N	+18507379078	\N	\N	other	DM - Brand & SSL Search	2025-12-26 19:04:31.021	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3926254863\nTracking Number: +18335512304\nCall Duration: 60 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 19:04:31.032259	2025-12-26 19:04:31.032259	3926254863	+18335512304	DM - Brand & SSL Search	60	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
90	\N	inquiry	BRIAN JONES	\N	+14402895689	\N	\N	other	DM - Brand & SSL Search	2025-12-26 20:39:27.563	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3926498556\nTracking Number: +18335512304\nCall Duration: 421 seconds\nLocation: Willoughby, OH	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 20:39:27.575883	2025-12-26 20:39:27.575883	3926498556	+18335512304	DM - Brand & SSL Search	421	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
91	\N	inquiry	PENSACOLA    FL	\N	+18503758691	\N	\N	other	DM - Brand & SSL Search	2025-12-26 22:32:39.767	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3926790726\nTracking Number: +18335512304\nCall Duration: 63 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 22:32:39.77938	2025-12-26 22:32:39.77938	3926790726	+18335512304	DM - Brand & SSL Search	63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
92	\N	inquiry	ASCENSION FL	\N	+18508046000	\N	\N	other	DM - Brand & SSL Search	2025-12-26 23:31:43.213	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3926893782\nTracking Number: +18335512304\nCall Duration: 402 seconds\nLocation: Panama City, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-26 23:31:43.228318	2025-12-26 23:31:43.228318	3926893782	+18335512304	DM - Brand & SSL Search	402	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
93	\N	inquiry	DARRELL JOHNSON	\N	+19044283080	\N	\N	other	DM - Ad Extension	2025-12-27 15:24:43.145	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3927314673\nTracking Number: +18334751492\nCall Duration: 53 seconds\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 15:24:43.157358	2025-12-27 15:24:43.157358	3927314673	+18334751492	DM - Ad Extension	53	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
94	\N	inquiry	MICHAEL OWENS	\N	+19548214656	\N	\N	google	DM - Google Ads	2025-12-27 19:45:41.558	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3927631527\nTracking Number: +18334251241\nCall Duration: 520 seconds\nLocation: Deerfield Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 19:45:41.570841	2025-12-27 19:45:41.570841	3927631527	+18334251241	DM - Google Ads	520	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
95	\N	inquiry	OXON HILL    MD	\N	+12402736892	\N	\N	other	DM - Brand & SSL Search	2025-12-27 20:31:57.138	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3927693750\nTracking Number: +18335512304\nCall Duration: 36 seconds\nLocation: Washington Zone 6, MD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 20:31:57.149254	2025-12-27 20:31:57.149254	3927693750	+18335512304	DM - Brand & SSL Search	36	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
97	\N	inquiry	DOROTHY KLUMPP	\N	+18508304829	\N	\N	other	DM - Brand & SSL Search	2025-12-27 22:11:54.909	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3927772746\nTracking Number: +18335512304\nCall Duration: 1408 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 22:11:54.920849	2025-12-27 22:11:54.920849	3927772746	+18335512304	DM - Brand & SSL Search	1408	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
100	\N	inquiry	SHERIL FEARON	\N	+13527716741	\N	\N	other	DM - Brand & SSL Search	2025-12-28 11:44:12.609	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928014375\nTracking Number: +18335512304\nCall Duration: 288 seconds\nLocation: Umatilla, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 11:44:12.621706	2025-12-28 11:44:12.621706	3928014375	+18335512304	DM - Brand & SSL Search	288	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
101	\N	inquiry	SPEARFISH    SD	\N	+16059209725	\N	\N	other	DM - Brand & SSL Search	2025-12-28 12:15:04.578	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928020465\nTracking Number: +18335512304\nCall Duration: 315 seconds\nLocation: Spearfish, SD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 12:15:04.590094	2025-12-28 12:15:04.590094	3928020465	+18335512304	DM - Brand & SSL Search	315	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
102	\N	inquiry	FT WALTN BCH FL	\N	+18502800247	\N	\N	other	DM - Ad Extension	2025-12-28 13:25:02.547	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928035804\nTracking Number: +18334751492\nCall Duration: 99 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 13:25:02.559564	2025-12-28 13:25:02.559564	3928035804	+18334751492	DM - Ad Extension	99	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
96	\N	vob_pending	No insurance Cash pay		+12057846311	\N	1980-12-27	other	DM - Ad Extension	2025-12-27 22:02:03.237	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3927785907\nTracking Number: +18334751492\nCall Duration: 25 seconds\nLocation: Alabaster, AL	\N	\N	\N	None	None 		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 22:02:03.249418	2025-12-27 22:16:56.084	3927785907	+18334751492	DM - Ad Extension	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	yes	\N	\N	Calling for son in ER. Hasn’t been to treatment in 10 years was able to have two full years of sobriety but has been drinking for past couple years.\n
98	\N	inquiry	KODY SMALLEY	\N	+12566054782	\N	\N	website	Previous Website	2025-12-27 23:54:58.739	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3927868617\nTracking Number: +18554006190\nCall Duration: 4 seconds\nLocation: Pisgah, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 23:54:58.751457	2025-12-27 23:54:58.751457	3927868617	+18554006190	Previous Website	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
99	\N	inquiry	ALBANY       NY	\N	+15185566218	\N	\N	other	LinkedIn	2025-12-28 05:24:16.013	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3927963195\nTracking Number: +18884317763\nCall Duration: 24 seconds\nLocation: NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 05:24:16.025325	2025-12-28 05:24:16.025325	3927963195	+18884317763	LinkedIn	24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
103	\N	inquiry	OCEAN SPGS   MS	\N	+12283341163	\N	\N	other	DM - Brand & SSL Search	2025-12-28 13:32:36.847	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928037268\nTracking Number: +18335512304\nCall Duration: 213 seconds\nLocation: Ocean Springs, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 13:32:36.859419	2025-12-28 13:32:36.859419	3928037268	+18335512304	DM - Brand & SSL Search	213	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
104	\N	inquiry	PENSACOLA    FL	\N	+18504901756	\N	\N	other	DM - Brand & SSL Search	2025-12-28 16:46:49.501	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928153062\nTracking Number: +18335512304\nCall Duration: 119 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 16:46:49.512924	2025-12-28 16:46:49.512924	3928153062	+18335512304	DM - Brand & SSL Search	119	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
105	\N	inquiry	RICHARD HOLMES	\N	+12295618598	\N	\N	other	DM - Ad Extension	2025-12-28 18:32:25.019	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928249758\nTracking Number: +18334751492\nCall Duration: 57 seconds\nLocation: Valdosta, GA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 18:32:25.03286	2025-12-28 18:32:25.03286	3928249758	+18334751492	DM - Ad Extension	57	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
106	\N	inquiry	MARCUS HATCHER	\N	+18502263657	\N	\N	other	DM - Brand & SSL Search	2025-12-28 20:29:27.189	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928341390\nTracking Number: +18335512304\nCall Duration: 260 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 20:29:27.201066	2025-12-28 20:29:27.201066	3928341390	+18335512304	DM - Brand & SSL Search	260	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
107	\N	inquiry	WEST CHESTER PA	\N	+14844677784	\N	\N	website	DM - Multi-Organic Search	2025-12-28 20:58:16.076	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928366362\nTracking Number: +18335512356\nCall Duration: 55 seconds\nLocation: West Chester, PA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 20:58:16.088926	2025-12-28 20:58:16.088926	3928366362	+18335512356	DM - Multi-Organic Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
108	\N	inquiry	BRUCE PARMELE	\N	+18507039998	\N	\N	other	DM - Brand & SSL Search	2025-12-28 21:32:24.823	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928390848\nTracking Number: +18335512304\nCall Duration: 151 seconds\nLocation: Chipley, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-28 21:32:24.835247	2025-12-28 21:32:24.835247	3928390848	+18335512304	DM - Brand & SSL Search	151	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
109	\N	inquiry	COVINGTON    LA	\N	+19853584557	\N	\N	other	DM - Ad Extension	2025-12-29 04:02:57.761	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928573755\nTracking Number: +18334751492\nCall Duration: 34 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 04:02:57.776148	2025-12-29 04:02:57.776148	3928573755	+18334751492	DM - Ad Extension	34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
110	\N	inquiry	MONTGOMERY   AL	\N	+13343229315	\N	\N	other	DM - Ad Extension	2025-12-29 05:31:03.643	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3928586802\nTracking Number: +18334751492\nCall Duration: 100 seconds\nLocation: Montgomery, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 05:31:03.654836	2025-12-29 05:31:03.654836	3928586802	+18334751492	DM - Ad Extension	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
111	\N	inquiry	OLD APPLETON MO	\N	+15733902680	\N	\N	other	NMHCS Card	2025-12-29 15:50:01.45	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3929071848\nTracking Number: +18889026913\nCall Duration: 144 seconds\nLocation: Old Appleton, MO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 15:50:01.463144	2025-12-29 15:50:01.463144	3929071848	+18889026913	NMHCS Card	144	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
112	\N	inquiry	CHIEFLAND    FL	\N	+13522215533	\N	\N	other	DM - Brand & SSL Search	2025-12-29 17:23:09.044	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3929460723\nTracking Number: +18335512304\nCall Duration: 24 seconds\nLocation: Chiefland, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 17:23:09.057963	2025-12-29 17:23:09.057963	3929460723	+18335512304	DM - Brand & SSL Search	24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
113	\N	inquiry	MOBILE       AL	\N	+12513495600	\N	\N	website	DM - Multi-Organic Search	2025-12-29 17:31:16.525	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3929494872\nTracking Number: +18335512356\nCall Duration: 31 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 17:31:16.539621	2025-12-29 17:31:16.539621	3929494872	+18335512356	DM - Multi-Organic Search	31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
114	\N	inquiry	SYLACAUGA    AL	\N	+12564045658	\N	\N	other	DM - Ad Extension	2025-12-29 18:32:22.45	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3929752302\nTracking Number: +18334751492\nCall Duration: 70 seconds\nLocation: Sylacauga, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 18:32:22.463968	2025-12-29 18:32:22.463968	3929752302	+18334751492	DM - Ad Extension	70	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
115	\N	inquiry	Incoming Call	\N	+13349339173	\N	\N	other	DM - Ad Extension	2025-12-29 19:49:49.918	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3930060681\nTracking Number: +18334751492\nCall Duration: 7 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 19:49:49.930327	2025-12-29 19:49:49.930327	3930060681	+18334751492	DM - Ad Extension	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
116	\N	inquiry	MIAMI        FL	\N	+17867613406	\N	\N	other	DM - Brand & SSL Search	2025-12-29 19:51:41.216	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3930063129\nTracking Number: +18335512304\nCall Duration: 49 seconds\nLocation: Miami, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 19:51:41.228125	2025-12-29 19:51:41.228125	3930063129	+18335512304	DM - Brand & SSL Search	49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
117	\N	inquiry	WASHINGTON   DC	\N	+12023165728	\N	\N	other	DM - Brand & SSL Search	2025-12-29 20:56:50.563	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3930325362\nTracking Number: +18335512304\nCall Duration: 24 seconds\nLocation: Washington Zone 1, DC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 20:56:50.575996	2025-12-29 20:56:50.575996	3930325362	+18335512304	DM - Brand & SSL Search	24	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
118	\N	inquiry	ALBANY       NY	\N	+15185304821	\N	\N	google	Google My Business Listing	2025-12-30 00:36:41.173	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3930872184\nTracking Number: +18558990319\nCall Duration: 28 seconds\nLocation: NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 00:36:41.186142	2025-12-30 00:36:41.186142	3930872184	+18558990319	Google My Business Listing	28	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
119	\N	inquiry	TALLASSEE    AL	\N	+13346403936	\N	\N	other	DM - Ad Extension	2025-12-30 14:18:10.406	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3931174872\nTracking Number: +18334751492\nCall Duration: 282 seconds\nLocation: Tallassee, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 14:18:10.419645	2025-12-30 14:18:10.419645	3931174872	+18334751492	DM - Ad Extension	282	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
120	\N	inquiry	KATHY SELLERS	\N	+18507267005	\N	\N	other	DM - Brand & SSL Search	2025-12-30 17:04:33.226	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3931756632\nTracking Number: +18335512304\nCall Duration: 39 seconds\nLocation: Sunny Hills, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 17:04:33.242601	2025-12-30 17:04:33.242601	3931756632	+18335512304	DM - Brand & SSL Search	39	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
121	\N	inquiry	JAY MITCHELL	\N	+18506864302	\N	\N	other	DM - Brand & SSL Search	2025-12-30 17:17:13.113	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3931806639\nTracking Number: +18335512304\nCall Duration: 60 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 17:17:13.128323	2025-12-30 17:17:13.128323	3931806639	+18335512304	DM - Brand & SSL Search	60	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
122	\N	inquiry	BRETT BOLEY	\N	+14018089180	\N	\N	google	DM - Google Ads	2025-12-30 17:46:00.947	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3931852731\nTracking Number: +18334251241\nCall Duration: 1059 seconds\nLocation: North Kingstown, RI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 17:46:00.960586	2025-12-30 17:46:00.960586	3931852731	+18334251241	DM - Google Ads	1059	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
123	\N	inquiry	PENSACOLA    FL	\N	+14482042199	\N	\N	other	DM - Local Listing	2025-12-30 18:09:40.405	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932011515\nTracking Number: +18508459350\nCall Duration: 30 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 18:09:40.418194	2025-12-30 18:09:40.418194	3932011515	+18508459350	DM - Local Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
124	\N	inquiry	LINDSEY DURRETT	\N	+15024084432	\N	\N	website	DM - Multi-Organic Search	2025-12-30 19:14:08.978	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932252271\nTracking Number: +18335512356\nCall Duration: 57 seconds\nLocation: Louisville, KY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 19:14:08.991731	2025-12-30 19:14:08.991731	3932252271	+18335512356	DM - Multi-Organic Search	57	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
125	\N	inquiry	Jackson Julius	\N	+13375137936	\N	\N	google	Gulf Breeze - Google PPC	2025-12-30 19:26:15.401	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932295285\nTracking Number: +18773555327\nCall Duration: 77 seconds\nLocation: Lake Charles, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 19:26:15.414844	2025-12-30 19:26:15.414844	3932295285	+18773555327	Gulf Breeze - Google PPC	77	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
126	\N	inquiry	HLF MOON BAY CA	\N	+16504763261	\N	\N	other	DM - Brand & SSL Search	2025-12-30 19:40:01.316	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932351652\nTracking Number: +18335512304\nLocation: Half Moon Bay, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 19:40:01.331551	2025-12-30 19:40:01.331551	3932351652	+18335512304	DM - Brand & SSL Search	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
127	\N	inquiry	P CAMPBELL	\N	+13214802942	\N	\N	website	DM - Multi-Organic Search	2025-12-30 20:14:03.622	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932477178\nTracking Number: +18335512356\nCall Duration: 41 seconds\nLocation: Cocoa, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 20:14:03.635548	2025-12-30 20:14:03.635548	3932477178	+18335512356	DM - Multi-Organic Search	41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
128	\N	inquiry	PAUL YOXTHEIMER	\N	+19045993292	\N	\N	other	DM - Brand & SSL Search	2025-12-30 20:48:42.054	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932598567\nTracking Number: +18335512304\nCall Duration: 67 seconds\nLocation: Saint Johns, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 20:48:42.068918	2025-12-30 20:48:42.068918	3932598567	+18335512304	DM - Brand & SSL Search	67	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
129	\N	inquiry	KANSAS CITY  MO	\N	+18165990067	\N	\N	website	DM - Multi-Organic Search	2025-12-30 20:53:06.372	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932612421\nTracking Number: +18335512356\nCall Duration: 106 seconds\nLocation: Kansas City, MO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 20:53:06.385658	2025-12-30 20:53:06.385658	3932612421	+18335512356	DM - Multi-Organic Search	106	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
130	\N	inquiry	DALEVILLE    AL	\N	+13344004058	\N	\N	other	DM - Brand & SSL Search	2025-12-30 20:57:10.369	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3932627970\nTracking Number: +18335512304\nCall Duration: 80 seconds\nLocation: Daleville, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 20:57:10.383151	2025-12-30 20:57:10.383151	3932627970	+18335512304	DM - Brand & SSL Search	80	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
131	\N	inquiry	HUNTSVILLE   AL	\N	+12564257395	\N	\N	other	DM - Ad Extension	2025-12-31 01:38:12.658	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3933168540\nTracking Number: +18334751492\nCall Duration: 2 seconds\nLocation: Huntsville, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 01:38:12.670103	2025-12-31 01:38:12.670103	3933168540	+18334751492	DM - Ad Extension	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
132	\N	inquiry	LARRY HOWELL	\N	+13348068006	\N	\N	other	DM - Brand & SSL Search	2025-12-31 16:29:31.117	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3933728997\nTracking Number: +18335512304\nCall Duration: 146 seconds\nLocation: Enterprise, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 16:29:31.129726	2025-12-31 16:29:31.129726	3933728997	+18335512304	DM - Brand & SSL Search	146	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
133	\N	inquiry	Incoming Call	\N	+14482422642	\N	\N	other	DM - Brand & SSL Search	2025-12-31 16:58:47.181	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3933824556\nTracking Number: +18335512304\nCall Duration: 36 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 16:58:47.194724	2025-12-31 16:58:47.194724	3933824556	+18335512304	DM - Brand & SSL Search	36	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
134	\N	inquiry	PENSACOLA    FL	\N	+18504269573	\N	\N	other	DM - Brand & SSL Search	2025-12-31 19:13:07.495	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3934238649\nTracking Number: +18335512304\nCall Duration: 68 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 19:13:07.507733	2025-12-31 19:13:07.507733	3934238649	+18335512304	DM - Brand & SSL Search	68	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
135	\N	inquiry	LESLIE VILARDI	\N	+18502916698	\N	\N	other	DM - Brand & SSL Search	2025-12-31 19:13:57.937	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3934221159\nTracking Number: +18335512304\nCall Duration: 416 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 19:13:57.948779	2025-12-31 19:13:57.948779	3934221159	+18335512304	DM - Brand & SSL Search	416	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
136	\N	inquiry	HARISBGTEA   SD	\N	+16054093760	\N	\N	other	NMHCS Card	2025-12-31 21:48:11.293	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3934590432\nTracking Number: +18889026913\nCall Duration: 93 seconds\nLocation: SD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 21:48:11.305673	2025-12-31 21:48:11.305673	3934590432	+18889026913	NMHCS Card	93	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
137	\N	inquiry	UNION CITY   CA	\N	+15104625109	\N	\N	google	Gulf Breeze - Google PPC	2025-12-31 23:43:41.794	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3934736205\nTracking Number: +18773555327\nCall Duration: 30 seconds\nLocation: CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 23:43:41.807371	2025-12-31 23:43:41.807371	3934736205	+18773555327	Gulf Breeze - Google PPC	30	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
138	\N	inquiry	MARCUS VLAHOVIC	\N	+18503754373	\N	\N	website	DM - Multi-Organic Search	2026-01-01 09:08:27.592	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3934890177\nTracking Number: +18335512356\nCall Duration: 115 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-01 09:08:27.604769	2026-01-01 09:08:27.604769	3934890177	+18335512356	DM - Multi-Organic Search	115	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
139	\N	inquiry	PENSACOLA    FL	\N	+18503789595	\N	\N	website	DM - Multi-Organic Search	2026-01-01 13:59:14.647	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3934941723\nTracking Number: +18335512356\nCall Duration: 67 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-01 13:59:14.660765	2026-01-01 13:59:14.660765	3934941723	+18335512356	DM - Multi-Organic Search	67	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
140	\N	inquiry	MCCOMB       MS	\N	+16016009139	\N	\N	other	DM - Brand & SSL Search	2026-01-01 21:28:49.583	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3935369478\nTracking Number: +18335512304\nCall Duration: 53 seconds\nLocation: Mc Comb, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-01 21:28:49.594842	2026-01-01 21:28:49.594842	3935369478	+18335512304	DM - Brand & SSL Search	53	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
141	\N	inquiry	JACKSONVILLE FL	\N	+19047262717	\N	\N	google	DM - Google Ads	2026-01-01 21:39:05.002	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3935377659\nTracking Number: +18334251241\nCall Duration: 94 seconds\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-01 21:39:05.013173	2026-01-01 21:39:05.013173	3935377659	+18334251241	DM - Google Ads	94	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
142	\N	inquiry	LINDA TIPPETT	\N	+12253244889	\N	\N	other	DM - Brand & SSL Search	2026-01-01 23:31:27.909	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3935457933\nTracking Number: +18335512304\nCall Duration: 142 seconds\nLocation: Baton Rouge, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-01 23:31:27.922855	2026-01-01 23:31:27.922855	3935457933	+18335512304	DM - Brand & SSL Search	142	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
143	\N	inquiry	PARADISE     CA	\N	+15303278247	\N	\N	other	DM - Ad Extension	2026-01-02 05:40:29.479	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3935573139\nTracking Number: +18334751492\nCall Duration: 191 seconds\nLocation: Paradise, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 05:40:29.491283	2026-01-02 05:40:29.491283	3935573139	+18334751492	DM - Ad Extension	191	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
144	\N	inquiry	PANAMA CITY  FL	\N	+18503480772	\N	\N	other	DM - Brand & SSL Search	2026-01-02 11:33:45.689	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3935609208\nTracking Number: +18335512304\nCall Duration: 449 seconds\nLocation: Panama City, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 11:33:45.704016	2026-01-02 11:33:45.704016	3935609208	+18335512304	DM - Brand & SSL Search	449	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
145	\N	inquiry	JUDIE DEVINE	\N	+12564962769	\N	\N	other	DM - Brand & SSL Search	2026-01-02 15:44:18.694	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936009417\nTracking Number: +18335512304\nCall Duration: 128 seconds\nLocation: Alexander City, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 15:44:18.709756	2026-01-02 15:44:18.709756	3936009417	+18335512304	DM - Brand & SSL Search	128	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
146	\N	inquiry	BIRMINGHAM   AL	\N	+12058551654	\N	\N	other	DM - Ad Extension	2026-01-02 16:31:06.043	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936179724\nTracking Number: +18334751492\nCall Duration: 58 seconds\nLocation: AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 16:31:06.058423	2026-01-02 16:31:06.058423	3936179724	+18334751492	DM - Ad Extension	58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
147	\N	inquiry	HOWARD STUART	\N	+12519797618	\N	\N	google	DM - Google Ads	2026-01-02 16:50:09.681	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936242394\nTracking Number: +18334251241\nCall Duration: 182 seconds\nLocation: Foley, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 16:50:09.696027	2026-01-02 16:50:09.696027	3936242394	+18334251241	DM - Google Ads	182	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
148	\N	inquiry	DARLENE SACKETT	\N	+18504544687	\N	\N	other	DM - Brand & SSL Search	2026-01-02 16:58:07.213	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936272070\nTracking Number: +18335512304\nCall Duration: 175 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 16:58:07.225264	2026-01-02 16:58:07.225264	3936272070	+18335512304	DM - Brand & SSL Search	175	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
149	\N	inquiry	PANAMA CITY  FL	\N	+18507758418	\N	\N	other	DM - Ad Extension	2026-01-02 17:55:06.478	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936486186\nTracking Number: +18334751492\nCall Duration: 130 seconds\nLocation: Panama City Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 17:55:06.490402	2026-01-02 17:55:06.490402	3936486186	+18334751492	DM - Ad Extension	130	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
150	\N	inquiry	BRISTOL      FL	\N	+18504473093	\N	\N	google	DM - Google Ads	2026-01-02 18:09:32.519	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936538998\nTracking Number: +18334251241\nCall Duration: 144 seconds\nLocation: Bristol, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 18:09:32.530863	2026-01-02 18:09:32.530863	3936538998	+18334251241	DM - Google Ads	144	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
151	\N	inquiry	DESTIN       FL	\N	+18508429169	\N	\N	website	DM - Multi-Organic Search	2026-01-02 18:20:31.482	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936589893\nTracking Number: +18335512356\nCall Duration: 29 seconds\nLocation: Destin, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 18:20:31.493857	2026-01-02 18:20:31.493857	3936589893	+18335512356	DM - Multi-Organic Search	29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
152	\N	inquiry	ALAN HESTER	\N	+13342105270	\N	\N	website	DM - Multi-Organic Search	2026-01-02 19:06:42.369	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936737277\nTracking Number: +18335512356\nCall Duration: 524 seconds\nLocation: Greenville, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 19:06:42.380874	2026-01-02 19:06:42.380874	3936737277	+18335512356	DM - Multi-Organic Search	524	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
153	\N	inquiry	WESTCHESTER  NY	\N	+19143390352	\N	\N	other	DM - Brand & SSL Search	2026-01-02 19:16:34.582	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936807912\nTracking Number: +18335512304\nCall Duration: 13 seconds\nLocation: Westchester Zone 1, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 19:16:34.594275	2026-01-02 19:16:34.594275	3936807912	+18335512304	DM - Brand & SSL Search	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
154	\N	inquiry	NEW YORK     NY	\N	+19294822353	\N	\N	other	DM - Brand & SSL Search	2026-01-02 19:21:18.117	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936822618\nTracking Number: +18335512304\nCall Duration: 10 seconds\nLocation: New York City Zone 14, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 19:21:18.128455	2026-01-02 19:21:18.128455	3936822618	+18335512304	DM - Brand & SSL Search	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
155	\N	inquiry	NEW YORK     NY	\N	+13476467710	\N	\N	other	DM - Brand & SSL Search	2026-01-02 19:25:39.006	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936837687\nTracking Number: +18335512304\nCall Duration: 13 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 19:25:39.018554	2026-01-02 19:25:39.018554	3936837687	+18335512304	DM - Brand & SSL Search	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
156	\N	inquiry	STATEN IS    NY	\N	+13477458943	\N	\N	other	DM - Brand & SSL Search	2026-01-02 19:29:02.517	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936851853\nTracking Number: +18335512304\nCall Duration: 10 seconds\nLocation: New York City Zone 14, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 19:29:02.529424	2026-01-02 19:29:02.529424	3936851853	+18335512304	DM - Brand & SSL Search	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
157	\N	inquiry	STATEN IS    NY	\N	+13476304621	\N	\N	other	DM - Brand & SSL Search	2026-01-02 19:37:36.38	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936882396\nTracking Number: +18335512304\nCall Duration: 10 seconds\nLocation: New York City Zone 15, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 19:37:36.391623	2026-01-02 19:37:36.391623	3936882396	+18335512304	DM - Brand & SSL Search	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
158	\N	inquiry	WEST CHESTER NY	\N	+19143830532	\N	\N	other	DM - Brand & SSL Search	2026-01-02 19:41:53.281	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3936897543\nTracking Number: +18335512304\nLocation: Westchester Zone 3, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 19:41:53.293313	2026-01-02 19:41:53.293313	3936897543	+18335512304	DM - Brand & SSL Search	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
159	\N	inquiry	MARIANNA     FL	\N	+18506939095	\N	\N	other	DM - Brand & SSL Search	2026-01-02 20:16:06.732	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937012485\nTracking Number: +18335512304\nCall Duration: 55 seconds\nLocation: Marianna, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 20:16:06.745703	2026-01-02 20:16:06.745703	3937012485	+18335512304	DM - Brand & SSL Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
160	\N	inquiry	TUSCALOOSA   AL	\N	+12055342907	\N	\N	other	DM - Brand & SSL Search	2026-01-02 20:27:49.025	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937052499\nTracking Number: +18335512304\nCall Duration: 103 seconds\nLocation: Tuscaloosa, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 20:27:49.038974	2026-01-02 20:27:49.038974	3937052499	+18335512304	DM - Brand & SSL Search	103	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
161	\N	inquiry	CRESTVIEW    FL	\N	+18506125509	\N	\N	other	DM - Brand & SSL Search	2026-01-02 20:47:04.333	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937117206\nTracking Number: +18335512304\nCall Duration: 35 seconds\nLocation: Crestview, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 20:47:04.345821	2026-01-02 20:47:04.345821	3937117206	+18335512304	DM - Brand & SSL Search	35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
162	\N	inquiry	HOWARD STUART	\N	+12519797621	\N	\N	google	DM - Google Ads	2026-01-02 23:43:12.66	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937512513\nTracking Number: +18334251241\nCall Duration: 319 seconds\nLocation: Foley, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 23:43:12.673145	2026-01-02 23:43:12.673145	3937512513	+18334251241	DM - Google Ads	319	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
163	\N	inquiry	LOLA MCCLAIN	\N	+12059050460	\N	\N	other	DM - Ad Extension	2026-01-03 00:18:07.842	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937562823\nTracking Number: +18334751492\nCall Duration: 81 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 00:18:07.855659	2026-01-03 00:18:07.855659	3937562823	+18334751492	DM - Ad Extension	81	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
164	\N	inquiry	SHREVEPORT   LA	\N	+13183931924	\N	\N	other	DM - Ad Extension	2026-01-03 05:35:01.595	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937697136\nTracking Number: +18334751492\nCall Duration: 14 seconds\nLocation: Shreveport, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 05:35:01.609227	2026-01-03 05:35:01.609227	3937697136	+18334751492	DM - Ad Extension	14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
165	\N	inquiry	TUSCALOOSA   AL	\N	+12052397703	\N	\N	other	DM - Ad Extension	2026-01-03 08:24:59.641	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937710750\nTracking Number: +18334751492\nCall Duration: 3 seconds\nLocation: Tuscaloosa, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 08:24:59.653464	2026-01-03 08:24:59.653464	3937710750	+18334751492	DM - Ad Extension	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
166	\N	inquiry	EMILY BROWN	\N	+12564185559	\N	\N	other	DM - Brand & SSL Search	2026-01-03 13:32:53.849	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937744716\nTracking Number: +18335512304\nCall Duration: 56 seconds\nLocation: Fort Payne, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 13:32:53.866371	2026-01-03 13:32:53.866371	3937744716	+18335512304	DM - Brand & SSL Search	56	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
167	\N	inquiry	KATHRYNE DREZEK	\N	+12029998395	\N	\N	website	DM - Multi-Organic Search	2026-01-03 16:08:28.836	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937900323\nTracking Number: +18335512356\nCall Duration: 170 seconds\nLocation: Washington Zone 1, DC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 16:08:28.848322	2026-01-03 16:08:28.848322	3937900323	+18335512356	DM - Multi-Organic Search	170	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
168	\N	inquiry	HATTIESBURG  MS	\N	+16016106786	\N	\N	other	DM - Ad Extension	2026-01-03 16:32:05.24	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3937939461\nTracking Number: +18334751492\nCall Duration: 78 seconds\nLocation: Hattiesburg, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 16:32:05.253987	2026-01-03 16:32:05.253987	3937939461	+18334751492	DM - Ad Extension	78	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
169	\N	inquiry	APALACHICOLA FL	\N	+18503707253	\N	\N	google	DM - Google Ads	2026-01-03 18:46:43.382	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938133648\nTracking Number: +18334251241\nCall Duration: 108 seconds\nLocation: Apalachicola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 18:46:43.396602	2026-01-03 18:46:43.396602	3938133648	+18334251241	DM - Google Ads	108	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
170	\N	inquiry	TWINCITIES   MN	\N	+16127785627	\N	\N	other	NMHCS Card	2026-01-03 22:34:36.248	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938406213\nTracking Number: +18889026913\nCall Duration: 32 seconds\nLocation: Saint Paul, MN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 22:34:36.261738	2026-01-03 22:34:36.261738	3938406213	+18889026913	NMHCS Card	32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
171	\N	inquiry	MONTEBELLO   CA	\N	+12136714707	\N	\N	other	DM - Ad Extension	2026-01-03 22:47:34.153	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938417748\nTracking Number: +18334751492\nCall Duration: 31 seconds\nLocation: Montebello, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 22:47:34.166661	2026-01-03 22:47:34.166661	3938417748	+18334751492	DM - Ad Extension	31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
172	\N	inquiry	YACOLT       WA	\N	+13606865031	\N	\N	website	Previous Website	2026-01-04 02:09:30.543	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938537175\nTracking Number: +18554006190\nCall Duration: 30 seconds\nLocation: Yacolt, WA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 02:09:30.557107	2026-01-04 02:09:30.557107	3938537175	+18554006190	Previous Website	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
173	\N	inquiry	PETERMAN     AL	\N	+12513536703	\N	\N	website	Previous Website	2026-01-04 02:09:37.427	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938537211\nTracking Number: +18554006190\nCall Duration: 41 seconds\nLocation: AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 02:09:37.44021	2026-01-04 02:09:37.44021	3938537211	+18554006190	Previous Website	41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
174	\N	inquiry	OCEAN SPGS   MS	\N	+12282157027	\N	\N	google	DM - Google Ads	2026-01-04 07:32:07.152	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938594631\nTracking Number: +18334251241\nCall Duration: 531 seconds\nLocation: Ocean Springs, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 07:32:07.165013	2026-01-04 07:32:07.165013	3938594631	+18334251241	DM - Google Ads	531	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
175	\N	inquiry	SUMTER       SC	\N	+18037576358	\N	\N	other	DM - Ad Extension	2026-01-04 09:41:49.44	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938618181\nTracking Number: +18334751492\nCall Duration: 73 seconds\nLocation: Sumter, SC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 09:41:49.452206	2026-01-04 09:41:49.452206	3938618181	+18334751492	DM - Ad Extension	73	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
176	\N	inquiry	MARIE FLEUR	\N	+19047551324	\N	\N	other	DM - Ad Extension	2026-01-04 13:26:39.559	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938653953\nTracking Number: +18334751492\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 13:26:39.573414	2026-01-04 13:26:39.573414	3938653953	+18334751492	DM - Ad Extension	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
177	\N	inquiry	THERESA CHMIEL	\N	+18502618509	\N	\N	other	DM - Ad Extension	2026-01-04 15:05:58.293	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938703609\nTracking Number: +18334751492\nCall Duration: 41 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 15:05:58.306347	2026-01-04 15:05:58.306347	3938703609	+18334751492	DM - Ad Extension	41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
178	\N	inquiry	KAYLA WOODS	\N	+18502073119	\N	\N	other	DM - Brand & SSL Search	2026-01-04 15:40:06.978	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938724723\nTracking Number: +18335512304\nCall Duration: 212 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 15:40:06.992008	2026-01-04 15:40:06.992008	3938724723	+18335512304	DM - Brand & SSL Search	212	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
179	\N	inquiry	KAREAION EATON	\N	+12512096454	\N	\N	other	DM - Brand & SSL Search	2026-01-04 17:19:04.596	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3938807436\nTracking Number: +18335512304\nCall Duration: 226 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 17:19:04.609681	2026-01-04 17:19:04.609681	3938807436	+18335512304	DM - Brand & SSL Search	226	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
180	\N	inquiry	FT LAUDRDALE FL	\N	+17542653442	\N	\N	other	DM - Brand & SSL Search	2026-01-04 23:57:16.042	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3939130143\nTracking Number: +18335512304\nCall Duration: 25 seconds\nLocation: Fort Lauderdale, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 23:57:16.057836	2026-01-04 23:57:16.057836	3939130143	+18335512304	DM - Brand & SSL Search	25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
181	\N	inquiry	FAYETTEVL    AR	\N	+14793962608	\N	\N	google	DM - Google Ads	2026-01-05 01:09:30.796	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3939168240\nTracking Number: +18334251241\nCall Duration: 63 seconds\nLocation: AR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-05 01:09:30.807777	2026-01-05 01:09:30.807777	3939168240	+18334251241	DM - Google Ads	63	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
182	\N	inquiry	C KILLINGSWORT	\N	+18506197406	\N	\N	other	DM - Brand & SSL Search	2026-01-05 01:20:40.91	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3939176889\nTracking Number: +18335512304\nCall Duration: 40 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-05 01:20:40.922056	2026-01-05 01:20:40.922056	3939176889	+18335512304	DM - Brand & SSL Search	40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
183	\N	inquiry	BIRMINGHAM   AL	\N	+12052185543	\N	\N	other	DM - Ad Extension	2026-01-05 13:37:52.059	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3939374259\nTracking Number: +18334751492\nCall Duration: 37 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-05 13:37:52.084758	2026-01-05 13:37:52.084758	3939374259	+18334751492	DM - Ad Extension	37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
184	\N	inquiry	TOLL FREE CALL	\N	+18662063224	\N	\N	other	DM - Brand & SSL Search	2026-01-05 13:53:15.944	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3939397146\nTracking Number: +18335512304\nCall Duration: 45 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-05 13:53:15.956186	2026-01-05 13:53:15.956186	3939397146	+18335512304	DM - Brand & SSL Search	45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
185	\N	inquiry	MICHAEL DOUD	\N	+18166688801	\N	\N	facebook	844-446-5478 Facebook	2026-01-05 15:40:03.2	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3939756867\nTracking Number: +18444465478\nCall Duration: 47 seconds\nLocation: Independence, MO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-05 15:40:03.212735	2026-01-05 15:40:03.212735	3939756867	+18444465478	844-446-5478 Facebook	47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
186	\N	inquiry	PENSACOLA    FL	\N	+18504652751	\N	\N	website	DM - Multi-Organic Search	2026-01-14 19:26:34.505	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3961001877\nTracking Number: +18335512356\nCall Duration: 33 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 19:26:34.517129	2026-01-14 19:26:34.517129	3961001877	+18335512356	DM - Multi-Organic Search	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
187	\N	inquiry	TIMOTHY CROWELL	\N	+17857175026	\N	\N	other	DM - Brand & SSL Search	2026-01-14 19:39:55.193	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3961059081\nTracking Number: +18335512304\nCall Duration: 29 seconds\nLocation: Junction City, KS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 19:39:55.204917	2026-01-14 19:39:55.204917	3961059081	+18335512304	DM - Brand & SSL Search	29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
188	\N	inquiry	DOTHAN       AL	\N	+13345961247	\N	\N	other	DM - Ad Extension	2026-01-14 19:54:57.296	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3961119294\nTracking Number: +18334751492\nCall Duration: 42 seconds\nLocation: Dothan, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 19:54:57.307914	2026-01-14 19:54:57.307914	3961119294	+18334751492	DM - Ad Extension	42	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
189	\N	inquiry	MEMPHIS      TN	\N	+19012192444	\N	\N	other	DM - Brand & SSL Search	2026-01-14 20:49:05.606	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3961335741\nTracking Number: +18335512304\nCall Duration: 51 seconds\nLocation: Memphis, TN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 20:49:05.619309	2026-01-14 20:49:05.619309	3961335741	+18335512304	DM - Brand & SSL Search	51	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
190	\N	inquiry	MCKINNEY     TX	\N	+19724397783	\N	\N	website	DM - Multi-Organic Search	2026-01-14 21:31:42.86	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3961496157\nTracking Number: +18335512356\nCall Duration: 28 seconds\nLocation: Mc Kinney, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 21:31:42.87226	2026-01-14 21:31:42.87226	3961496157	+18335512356	DM - Multi-Organic Search	28	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
191	\N	inquiry	CHEPACHET    RI	\N	+14018962541	\N	\N	other	NMHCS Card	2026-01-14 22:31:06.698	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3961682091\nTracking Number: +18889026913\nCall Duration: 21 seconds\nLocation: Glocester, RI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 22:31:06.714478	2026-01-14 22:31:06.714478	3961682091	+18889026913	NMHCS Card	21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
192	\N	inquiry	BATON ROUGE  LA	\N	+12259994706	\N	\N	website	DM - Multi-Organic Search	2026-01-14 23:25:20.722	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3961811115\nTracking Number: +18335512356\nCall Duration: 32 seconds\nLocation: Baton Rouge, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 23:25:20.734491	2026-01-14 23:25:20.734491	3961811115	+18335512356	DM - Multi-Organic Search	32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
193	\N	inquiry	ARTESIA      NM	\N	+15752436760	\N	\N	other	LinkedIn	2026-01-15 04:23:11.053	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3962088798\nTracking Number: +18884317763\nCall Duration: 37 seconds\nLocation: NM	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 04:23:11.065892	2026-01-15 04:23:11.065892	3962088798	+18884317763	LinkedIn	37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
194	\N	inquiry	TOLL FREE CALL	\N	+18882799485	\N	\N	website	DM - Multi-Organic Search	2026-01-15 15:51:31.973	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3962663439\nTracking Number: +18335512356\nCall Duration: 105 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 15:51:31.985265	2026-01-15 15:51:31.985265	3962663439	+18335512356	DM - Multi-Organic Search	105	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
195	\N	inquiry	BOSTON       MA	\N	+16174484872	\N	\N	google	DM - Google Ads	2026-01-15 16:17:43.33	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3962770281\nTracking Number: +18334251241\nCall Duration: 109 seconds\nLocation: Boston, MA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 16:17:43.341909	2026-01-15 16:17:43.341909	3962770281	+18334251241	DM - Google Ads	109	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
196	\N	inquiry	PENSACOLA    FL	\N	+18502211032	\N	\N	other	DM - Brand & SSL Search	2026-01-15 16:41:58.8	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3962861943\nTracking Number: +18335512304\nCall Duration: 218 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 16:41:58.812491	2026-01-15 16:41:58.812491	3962861943	+18335512304	DM - Brand & SSL Search	218	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
197	\N	inquiry	TARA POTTER	\N	+18506869369	\N	\N	other	DM - Brand & SSL Search	2026-01-15 16:42:34.854	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3962881524\nTracking Number: +18335512304\nCall Duration: 22 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 16:42:34.866678	2026-01-15 16:42:34.866678	3962881524	+18335512304	DM - Brand & SSL Search	22	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
198	\N	inquiry	MISSOULA     MT	\N	+14065422849	\N	\N	other	DM - Ad Extension	2026-01-15 17:40:37.979	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3963127980\nTracking Number: +18334751492\nCall Duration: 145 seconds\nLocation: Missoula, MT	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 17:40:37.990603	2026-01-15 17:40:37.990603	3963127980	+18334751492	DM - Ad Extension	145	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
199	\N	inquiry	LAFAYETTE    LA	\N	+13379625740	\N	\N	google	DM - Google Ads	2026-01-15 18:27:05.237	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3963342705\nTracking Number: +18334251241\nCall Duration: 31 seconds\nLocation: Lafayette, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 18:27:05.248954	2026-01-15 18:27:05.248954	3963342705	+18334251241	DM - Google Ads	31	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
200	\N	inquiry	VANESSA BETHEL	\N	+12563936021	\N	\N	google	DM - Google Ads	2026-01-15 18:43:02.686	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3963392232\nTracking Number: +18334251241\nCall Duration: 277 seconds\nLocation: Gadsden, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 18:43:02.698662	2026-01-15 18:43:02.698662	3963392232	+18334251241	DM - Google Ads	277	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
201	\N	inquiry	PENSACOLA    FL	\N	+18506969503	\N	\N	other	DM - Brand & SSL Search	2026-01-15 19:13:23.9	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3963540738\nTracking Number: +18335512304\nCall Duration: 42 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 19:13:23.912674	2026-01-15 19:13:23.912674	3963540738	+18335512304	DM - Brand & SSL Search	42	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
202	\N	inquiry	PAXTON       FL	\N	+18506499444	\N	\N	other	DM - Brand & SSL Search	2026-01-15 19:17:55.025	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3963556029\nTracking Number: +18335512304\nCall Duration: 118 seconds\nLocation: Paxton, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 19:17:55.036443	2026-01-15 19:17:55.036443	3963556029	+18335512304	DM - Brand & SSL Search	118	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
203	\N	inquiry	FLORALA      AL	\N	+13342560204	\N	\N	other	DM - Local Listing	2026-01-15 20:16:04.793	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3963797007\nTracking Number: +18508459350\nCall Duration: 30 seconds\nLocation: Florala, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 20:16:04.806696	2026-01-15 20:16:04.806696	3963797007	+18508459350	DM - Local Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
204	\N	inquiry	NORMAN HISE	\N	+18509101900	\N	\N	website	DM - Multi-Organic Search	2026-01-15 21:01:23.83	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3963961365\nTracking Number: +18335512356\nCall Duration: 148 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 21:01:23.841542	2026-01-15 21:01:23.841542	3963961365	+18335512356	DM - Multi-Organic Search	148	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
205	\N	inquiry	OMAHA        NE	\N	+14023468754	\N	\N	website	DM - Multi-Organic Search	2026-01-15 22:50:44.855	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3964334094\nTracking Number: +18335512356\nCall Duration: 7 seconds\nLocation: Omaha, NE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 22:50:44.86759	2026-01-15 22:50:44.86759	3964334094	+18335512356	DM - Multi-Organic Search	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
206	\N	inquiry	NAJAT WILLIAMS	\N	+17739829338	\N	\N	instagram	855-6-HOLISTICREHAB Digital Ads	2026-01-15 23:33:25.865	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3964435743\nTracking Number: +18556465478\nCall Duration: 11 seconds\nLocation: Chicago Heights, IL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-15 23:33:25.876922	2026-01-15 23:33:25.876922	3964435743	+18556465478	855-6-HOLISTICREHAB Digital Ads	11	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
207	\N	inquiry	WIGGINS      MS	\N	+16017239514	\N	\N	other	DM - Ad Extension	2026-01-16 02:01:53.69	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3964620648\nTracking Number: +18334751492\nCall Duration: 684 seconds\nLocation: Wiggins, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 02:01:53.70151	2026-01-16 02:01:53.70151	3964620648	+18334751492	DM - Ad Extension	684	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
208	\N	inquiry	BOONEVILLE   MS	\N	+16624166906	\N	\N	other	DM - Brand & SSL Search	2026-01-16 02:07:28.604	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3964630881\nTracking Number: +18335512304\nCall Duration: 193 seconds\nLocation: Booneville, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 02:07:28.615897	2026-01-16 02:07:28.615897	3964630881	+18335512304	DM - Brand & SSL Search	193	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
209	\N	inquiry	OZARK        AL	\N	+13347337142	\N	\N	other	DM - Ad Extension	2026-01-16 14:48:06.072	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3964928541\nTracking Number: +18334751492\nCall Duration: 28 seconds\nLocation: Ozark, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 14:48:06.084582	2026-01-16 14:48:06.084582	3964928541	+18334751492	DM - Ad Extension	28	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
210	\N	inquiry	DALLAS       TX	\N	+14697542960	\N	\N	website	DM - Multi-Organic Search	2026-01-16 15:17:16.565	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3965015538\nTracking Number: +18335512356\nCall Duration: 47 seconds\nLocation: Dallas, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 15:17:16.579849	2026-01-16 15:17:16.579849	3965015538	+18335512356	DM - Multi-Organic Search	47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
211	\N	inquiry	NEW YORK     NY	\N	+13479290861	\N	\N	other	DM - Brand & SSL Search	2026-01-16 15:24:51.985	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3965042718\nTracking Number: +18335512304\nCall Duration: 13 seconds\nLocation: New York City Zone 7, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 15:24:51.996483	2026-01-16 15:24:51.996483	3965042718	+18335512304	DM - Brand & SSL Search	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
212	\N	inquiry	BIRMINGHAM   AL	\N	+12056013668	\N	\N	other	DM - Brand & SSL Search	2026-01-16 15:52:31.759	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3965127744\nTracking Number: +18335512304\nCall Duration: 109 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 15:52:31.771314	2026-01-16 16:05:56.734	3965127744	+18335512304	DM - Brand & SSL Search	109	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	yes	\N	\N	\N
213	\N	inquiry	MARLENE FARAH	\N	+19048646464	\N	\N	other	DM - Ad Extension	2026-01-16 16:39:54.482	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3965313468\nTracking Number: +18334751492\nCall Duration: 267 seconds\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 16:39:54.497981	2026-01-16 16:39:54.497981	3965313468	+18334751492	DM - Ad Extension	267	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
214	\N	inquiry	Brodnax Velma	\N	+13186140483	\N	\N	other	DM - Ad Extension	2026-01-16 17:33:06.487	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3965563926\nTracking Number: +18334751492\nCall Duration: 51 seconds\nLocation: Monroe, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 17:33:06.500586	2026-01-16 17:33:06.500586	3965563926	+18334751492	DM - Ad Extension	51	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
215	\N	inquiry	PENSACOLA    FL	\N	+18502027429	\N	\N	other	DM - Local Listing	2026-01-16 19:20:14.689	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3966022392\nTracking Number: +18508459350\nCall Duration: 30 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 19:20:14.702075	2026-01-16 19:20:14.702075	3966022392	+18508459350	DM - Local Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
216	\N	inquiry	ATMORE       AL	\N	+12513889126	\N	\N	other	DM - Ad Extension	2026-01-16 20:49:52.749	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3966390672\nTracking Number: +18334751492\nCall Duration: 123 seconds\nLocation: Atmore, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-16 20:49:52.762888	2026-01-16 20:49:52.762888	3966390672	+18334751492	DM - Ad Extension	123	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
217	\N	inquiry	MOBILE       AL	\N	+12512641996	\N	\N	other	DM - Brand & SSL Search	2026-01-17 01:08:53.736	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967027029\nTracking Number: +18335512304\nCall Duration: 153 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 01:08:53.749069	2026-01-17 01:08:53.749069	3967027029	+18335512304	DM - Brand & SSL Search	153	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
218	\N	inquiry	MERRYVILLE   LA	\N	+13373729594	\N	\N	other	DM - Ad Extension	2026-01-17 15:07:19.64	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967334193\nTracking Number: +18334751492\nCall Duration: 118 seconds\nLocation: Merryville, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 15:07:19.653966	2026-01-17 15:07:19.653966	3967334193	+18334751492	DM - Ad Extension	118	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
219	\N	inquiry	PONTIAC      MI	\N	+12488958978	\N	\N	google	DM - Google Ads	2026-01-17 16:46:25.515	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967477410\nTracking Number: +18334251241\nCall Duration: 94 seconds\nLocation: Pontiac, MI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 16:46:25.528392	2026-01-17 16:46:25.528392	3967477410	+18334251241	DM - Google Ads	94	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
220	\N	inquiry	HUNTSVILLE   AL	\N	+12564791244	\N	\N	other	DM - Brand & SSL Search	2026-01-17 17:30:20.33	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967550607\nTracking Number: +18335512304\nCall Duration: 63 seconds\nLocation: Huntsville, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 17:30:20.341789	2026-01-17 17:30:20.341789	3967550607	+18335512304	DM - Brand & SSL Search	63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
221	\N	inquiry	PONTOTOC     MS	\N	+16623082880	\N	\N	other	DM - Ad Extension	2026-01-17 17:34:57.223	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967561278\nTracking Number: +18334751492\nCall Duration: 5 seconds\nLocation: Pontotoc, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 17:34:57.234926	2026-01-17 17:34:57.234926	3967561278	+18334751492	DM - Ad Extension	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
222	\N	inquiry	VALDOSTA     GA	\N	+12295314186	\N	\N	google	DM - Google Ads	2026-01-17 17:43:20.077	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967569534\nTracking Number: +18334251241\nCall Duration: 165 seconds\nLocation: GA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 17:43:20.088818	2026-01-17 17:43:20.088818	3967569534	+18334251241	DM - Google Ads	165	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
223	\N	inquiry	SAINT JOHNS  FL	\N	+19043255204	\N	\N	other	DM - Ad Extension	2026-01-17 19:40:24.108	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967748052\nTracking Number: +18334751492\nCall Duration: 89 seconds\nLocation: Saint Johns, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 19:40:24.123119	2026-01-17 19:40:24.123119	3967748052	+18334751492	DM - Ad Extension	89	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
224	\N	inquiry	FOLEY        AL	\N	+12513245519	\N	\N	google	DM - Google Ads	2026-01-17 21:11:41.577	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3967861902\nTracking Number: +18334251241\nCall Duration: 106 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-17 21:11:41.59092	2026-01-17 21:11:41.59092	3967861902	+18334251241	DM - Google Ads	106	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
225	\N	inquiry	JOHN SHARRON	\N	+18504950821	\N	\N	other	DM - Ad Extension	2026-01-18 16:07:14.988	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968268084\nTracking Number: +18334751492\nCall Duration: 86 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-18 16:07:15.001297	2026-01-18 16:07:15.001297	3968268084	+18334751492	DM - Ad Extension	86	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
226	\N	inquiry	BRUNSWICK    GA	\N	+19124192847	\N	\N	google	DM - Google Ads	2026-01-18 17:17:33.13	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968329458\nTracking Number: +18334251241\nCall Duration: 266 seconds\nLocation: GA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-18 17:17:33.142572	2026-01-18 17:17:33.142572	3968329458	+18334251241	DM - Google Ads	266	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
227	\N	inquiry	ERIC WARNER	\N	+15162424545	\N	\N	google	DM - Google Ads	2026-01-18 17:58:55.996	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968360373\nTracking Number: +18334251241\nCall Duration: 595 seconds\nLocation: Garden City, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-18 17:58:56.008293	2026-01-18 17:58:56.008293	3968360373	+18334251241	DM - Google Ads	595	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
228	\N	inquiry	ONEONTA      AL	\N	+12053530676	\N	\N	other	DM - Ad Extension	2026-01-18 18:21:27.36	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968386260\nTracking Number: +18334751492\nCall Duration: 148 seconds\nLocation: Oneonta, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-18 18:21:27.371916	2026-01-18 18:21:27.371916	3968386260	+18334751492	DM - Ad Extension	148	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
229	\N	inquiry	TROY         NY	\N	+15183262094	\N	\N	google	Google My Business Listing	2026-01-18 19:25:35.586	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968446224\nTracking Number: +18558990319\nCall Duration: 30 seconds\nLocation: Troy, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-18 19:25:35.598343	2026-01-18 19:25:35.598343	3968446224	+18558990319	Google My Business Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
230	\N	inquiry	ROBERTA GIBSON	\N	+16013238883	\N	\N	other	DM - Ad Extension	2026-01-18 19:37:07.069	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968453685\nTracking Number: +18334751492\nCall Duration: 215 seconds\nLocation: Laurel, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-18 19:37:07.081315	2026-01-18 19:37:07.081315	3968453685	+18334751492	DM - Ad Extension	215	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
231	\N	inquiry	BRENT HOUGH	\N	+18503416417	\N	\N	google	DM - Google Ads	2026-01-19 00:27:38.525	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968664189\nTracking Number: +18334251241\nCall Duration: 1090 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 00:27:38.537096	2026-01-19 00:27:38.537096	3968664189	+18334251241	DM - Google Ads	1090	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
232	\N	inquiry	Incoming Call	\N	+13195018886	\N	\N	google	DM - Google Ads	2026-01-19 02:50:26.086	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968726031\nTracking Number: +18334251241\nCall Duration: 222 seconds\nLocation: IA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 02:50:26.097976	2026-01-19 02:50:26.097976	3968726031	+18334251241	DM - Google Ads	222	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
233	\N	inquiry	GULF BREEZE  FL	\N	+18506775106	\N	\N	other	DM - Brand & SSL Search	2026-01-19 14:40:14.274	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3968999541\nTracking Number: +18335512304\nCall Duration: 37 seconds\nLocation: Gulf Breeze, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 14:40:14.28791	2026-01-19 14:40:14.28791	3968999541	+18335512304	DM - Brand & SSL Search	37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
234	\N	inquiry	PENSACOLA    FL	\N	+18502880355	\N	\N	other	DM - Ad Extension	2026-01-19 15:03:25.009	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3969044481\nTracking Number: +18334751492\nCall Duration: 343 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 15:03:25.023876	2026-01-19 15:03:25.023876	3969044481	+18334751492	DM - Ad Extension	343	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
235	\N	inquiry	LOCKPORT     NY	\N	+17162518671	\N	\N	website	DM - Multi-Organic Search	2026-01-19 15:44:01.222	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3969183135\nTracking Number: +18335512356\nCall Duration: 55 seconds\nLocation: Lockport, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 15:44:01.234517	2026-01-19 15:44:01.234517	3969183135	+18335512356	DM - Multi-Organic Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
236	\N	inquiry	WENDIE ENTREKIN	\N	+12564992530	\N	\N	other	DM - Brand & SSL Search	2026-01-19 16:11:36.835	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3969276432\nTracking Number: +18335512304\nCall Duration: 129 seconds\nLocation: Anniston, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 16:11:36.848257	2026-01-19 16:11:36.848257	3969276432	+18335512304	DM - Brand & SSL Search	129	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
237	\N	inquiry	ALBEMARLE    NC	\N	+17042441921	\N	\N	other	DM - Brand & SSL Search	2026-01-19 16:39:30.746	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3969364554\nTracking Number: +18335512304\nCall Duration: 310 seconds\nLocation: Albemarle, NC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 16:39:30.757651	2026-01-19 16:39:30.757651	3969364554	+18335512304	DM - Brand & SSL Search	310	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
238	\N	inquiry	ROSWELL      NM	\N	+15753170706	\N	\N	other	DM - Brand & SSL Search	2026-01-19 18:15:32.853	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3969783921\nTracking Number: +18335512304\nCall Duration: 74 seconds\nLocation: Roswell, NM	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 18:15:32.870288	2026-01-19 18:15:32.870288	3969783921	+18335512304	DM - Brand & SSL Search	74	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
239	\N	inquiry	ANNAPOLIS    MD	\N	+14432548580	\N	\N	other	DM - Brand & SSL Search	2026-01-19 18:21:49.314	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3969810432\nTracking Number: +18335512304\nCall Duration: 29 seconds\nLocation: Annapolis, MD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 18:21:49.326359	2026-01-19 18:21:49.326359	3969810432	+18335512304	DM - Brand & SSL Search	29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
240	\N	inquiry	DEBORAH BROOME	\N	+12514019344	\N	\N	google	DM - Google Ads	2026-01-19 19:47:15.995	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3970105506\nTracking Number: +18334251241\nCall Duration: 52 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 19:47:16.006749	2026-01-19 19:47:16.006749	3970105506	+18334251241	DM - Google Ads	52	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
241	\N	inquiry	PENSACOLA    FL	\N	+18502027497	\N	\N	other	DM - Local Listing	2026-01-19 20:45:46.481	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3970316334\nTracking Number: +18508459350\nCall Duration: 30 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 20:45:46.49365	2026-01-19 20:45:46.49365	3970316334	+18508459350	DM - Local Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
242	\N	inquiry	ANDREW CURLING	\N	+18503768866	\N	\N	other	DM - Brand & SSL Search	2026-01-19 21:36:47.189	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3970478256\nTracking Number: +18335512304\nCall Duration: 139 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 21:36:47.201442	2026-01-19 21:36:47.201442	3970478256	+18335512304	DM - Brand & SSL Search	139	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
243	\N	inquiry	PENSACOLA    FL	\N	+18504661061	\N	\N	website	DM - Multi-Organic Search	2026-01-20 00:43:01.851	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3970794234\nTracking Number: +18335512356\nCall Duration: 267 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 00:43:01.863005	2026-01-20 00:43:01.863005	3970794234	+18335512356	DM - Multi-Organic Search	267	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
244	\N	inquiry	MARY ZABALAOUI	\N	+12259534237	\N	\N	google	DM - Google Ads	2026-01-20 04:33:03.529	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3970901904\nTracking Number: +18334251241\nCall Duration: 617 seconds\nLocation: Baton Rouge, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 04:33:03.546891	2026-01-20 04:33:03.546891	3970901904	+18334251241	DM - Google Ads	617	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
245	\N	inquiry	FERNNDNA BCH FL	\N	+19044158265	\N	\N	facebook	855-GulfBreeze (iHeart Radio)	2026-01-20 13:57:03.159	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3971050152\nTracking Number: +18554853273\nCall Duration: 38 seconds\nLocation: Fernandina Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 13:57:03.171666	2026-01-20 13:57:03.171666	3971050152	+18554853273	855-GulfBreeze (iHeart Radio)	38	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
246	\N	inquiry	P GREATHOUSE	\N	+19414687400	\N	\N	other	DM - Brand & SSL Search	2026-01-20 15:27:42.2	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3971314104\nTracking Number: +18335512304\nCall Duration: 154 seconds\nLocation: Venice, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 15:27:42.212929	2026-01-20 15:27:42.212929	3971314104	+18335512304	DM - Brand & SSL Search	154	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
247	\N	inquiry	KAREN GOLDBERG	\N	+14077294105	\N	\N	website	DM - Multi-Organic Search	2026-01-20 15:55:46.207	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3971424864\nTracking Number: +18335512356\nCall Duration: 18 seconds\nLocation: Kissimmee, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 15:55:46.219869	2026-01-20 15:55:46.219869	3971424864	+18335512356	DM - Multi-Organic Search	18	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
248	\N	inquiry	CRAWFORDVL   FL	\N	+18509544214	\N	\N	website	DM - Multi-Organic Search	2026-01-20 15:57:52.129	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3971432805\nTracking Number: +18335512356\nCall Duration: 13 seconds\nLocation: Crawfordville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 15:57:52.140994	2026-01-20 15:57:52.140994	3971432805	+18335512356	DM - Multi-Organic Search	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
249	\N	inquiry	VIRGINIA JONES	\N	+19109162510	\N	\N	google	DM - Google Ads	2026-01-20 15:58:14.636	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3971427912\nTracking Number: +18334251241\nCall Duration: 83 seconds\nLocation: Fayetteville, NC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 15:58:14.647993	2026-01-20 15:58:14.647993	3971427912	+18334251241	DM - Google Ads	83	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
250	\N	inquiry	UNHEALTHCARE	\N	+18882992070	\N	\N	website	DM - Multi-Organic Search	2026-01-20 16:29:36.017	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3971561157\nTracking Number: +18335512356\nCall Duration: 58 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 16:29:36.029298	2026-01-20 16:29:36.029298	3971561157	+18335512356	DM - Multi-Organic Search	58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
251	\N	inquiry	GRAND JCT    CO	\N	+19707121763	\N	\N	other	DM - Brand & SSL Search	2026-01-20 17:16:10.872	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3971770896\nTracking Number: +18335512304\nCall Duration: 93 seconds\nLocation: Grand Junction, CO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 17:16:10.884057	2026-01-20 17:16:10.884057	3971770896	+18335512304	DM - Brand & SSL Search	93	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
252	\N	inquiry	TOLL FREE CALL	\N	+18772020055	\N	\N	other	DM - Brand & SSL Search	2026-01-20 18:23:29.592	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3972071799\nTracking Number: +18335512304\nCall Duration: 77 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 18:23:29.605384	2026-01-20 18:23:29.605384	3972071799	+18335512304	DM - Brand & SSL Search	77	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
253	\N	inquiry	TOLL FREE CALL	\N	+18663670661	\N	\N	other	DM - Local Listing	2026-01-20 18:39:28.408	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3972144936\nTracking Number: +18508459350\nCall Duration: 26 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 18:39:28.419748	2026-01-20 18:39:28.419748	3972144936	+18508459350	DM - Local Listing	26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
254	\N	inquiry	ANNISTON     AL	\N	+12564535332	\N	\N	other	DM - Ad Extension	2026-01-20 18:45:47.429	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3972173418\nTracking Number: +18334751492\nCall Duration: 22 seconds\nLocation: Anniston, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 18:45:47.440221	2026-01-20 18:45:47.440221	3972173418	+18334751492	DM - Ad Extension	22	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
255	\N	inquiry	ARROYO GRAND CA	\N	+18059048860	\N	\N	other	DM - Brand & SSL Search	2026-01-20 19:21:03.827	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3972322929\nTracking Number: +18335512304\nCall Duration: 130 seconds\nLocation: Arroyo Grande, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 19:21:03.838837	2026-01-20 19:21:03.838837	3972322929	+18335512304	DM - Brand & SSL Search	130	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
256	\N	inquiry	D FUNIAK SPG FL	\N	+18503078053	\N	\N	other	DM - Brand & SSL Search	2026-01-20 19:29:23.357	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3972369828\nTracking Number: +18335512304\nCall Duration: 10 seconds\nLocation: De Funiak Springs, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 19:29:23.367835	2026-01-20 19:29:23.367835	3972369828	+18335512304	DM - Brand & SSL Search	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
257	\N	inquiry	SUSAN SMITH	\N	+12297338027	\N	\N	website	DM - Multi-Organic Search	2026-01-20 19:35:37.19	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3972385980\nTracking Number: +18335512356\nCall Duration: 114 seconds\nLocation: Albany, GA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 19:35:37.202582	2026-01-20 19:35:37.202582	3972385980	+18335512356	DM - Multi-Organic Search	114	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
258	\N	inquiry	ARLENE RICH	\N	+17274188686	\N	\N	other	DM - Brand & SSL Search	2026-01-20 21:35:17.316	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3972854601\nTracking Number: +18335512304\nCall Duration: 53 seconds\nLocation: Clearwater, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 21:35:17.327897	2026-01-20 21:35:17.327897	3972854601	+18335512304	DM - Brand & SSL Search	53	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
259	\N	inquiry	WICHITA      KS	\N	+13169285579	\N	\N	other	DM - Brand & SSL Search	2026-01-21 01:08:54.126	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3973367541\nTracking Number: +18335512304\nCall Duration: 189 seconds\nLocation: Wichita, KS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 01:08:54.141416	2026-01-21 01:08:54.141416	3973367541	+18335512304	DM - Brand & SSL Search	189	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
260	\N	inquiry	JAMES ODAY	\N	+18059148032	\N	\N	other	DM - Brand & SSL Search	2026-01-21 02:36:08.961	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3973432380\nTracking Number: +18335512304\nCall Duration: 218 seconds\nLocation: Camarillo, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 02:36:08.973281	2026-01-21 02:36:08.973281	3973432380	+18335512304	DM - Brand & SSL Search	218	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
261	\N	inquiry	MARTHA SLYHOFF	\N	+12564961231	\N	\N	facebook	855-GulfBreeze (iHeart Radio)	2026-01-21 03:28:18.815	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3973454205\nTracking Number: +18554853273\nCall Duration: 207 seconds\nLocation: Alexandrcy, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 03:28:18.827006	2026-01-21 03:28:18.827006	3973454205	+18554853273	855-GulfBreeze (iHeart Radio)	207	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
262	\N	inquiry	DENHAM SPGS  LA	\N	+12255034410	\N	\N	other	DM - Ad Extension	2026-01-21 07:11:16.067	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3973492695\nTracking Number: +18334751492\nCall Duration: 74 seconds\nLocation: Denham Springs, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 07:11:16.07968	2026-01-21 07:11:16.07968	3973492695	+18334751492	DM - Ad Extension	74	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
263	\N	inquiry	J CHRISTINE	\N	+13342088867	\N	\N	website	DM - Multi-Organic Search	2026-01-21 14:38:25.203	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3973704984\nTracking Number: +18335512356\nCall Duration: 467 seconds\nLocation: Andalusia, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 14:38:25.215243	2026-01-21 14:38:25.215243	3973704984	+18335512356	DM - Multi-Organic Search	467	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
264	\N	inquiry	HERMOSA BCH  CA	\N	+14242065281	\N	\N	website	Previous Website	2026-01-21 15:29:05.162	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3973877343\nTracking Number: +18554006190\nCall Duration: 110 seconds\nLocation: Los Angeles, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 15:29:05.174605	2026-01-21 15:29:05.174605	3973877343	+18554006190	Previous Website	110	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
265	\N	inquiry	JASON PETTIT	\N	+12145637607	\N	\N	website	DM - Multi-Organic Search	2026-01-21 16:49:15.675	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974197107\nTracking Number: +18335512356\nCall Duration: 63 seconds\nLocation: Grand Prairie, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 16:49:15.686933	2026-01-21 16:49:15.686933	3974197107	+18335512356	DM - Multi-Organic Search	63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
266	\N	inquiry	JACKSON      MS	\N	+16017609901	\N	\N	other	DM - Brand & SSL Search	2026-01-21 17:10:50.075	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974301711\nTracking Number: +18335512304\nCall Duration: 74 seconds\nLocation: Jackson, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 17:10:50.087392	2026-01-21 17:10:50.087392	3974301711	+18335512304	DM - Brand & SSL Search	74	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
267	\N	inquiry	DAVID KNOTT	\N	+15024092707	\N	\N	other	DM - Brand & SSL Search	2026-01-21 17:38:03.252	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974431413\nTracking Number: +18335512304\nCall Duration: 47 seconds\nLocation: Louisville, KY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 17:38:03.263368	2026-01-21 17:38:03.263368	3974431413	+18335512304	DM - Brand & SSL Search	47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
268	\N	inquiry	OLIVE BRANCH MS	\N	+16628937196	\N	\N	other	DM - Ad Extension	2026-01-21 18:06:56.893	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974560362\nTracking Number: +18334751492\nCall Duration: 39 seconds\nLocation: Olive Branch, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 18:06:56.90686	2026-01-21 18:06:56.90686	3974560362	+18334751492	DM - Ad Extension	39	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
269	\N	inquiry	ALAN CARDENAS	\N	+19139094967	\N	\N	facebook	844-446-5478 Facebook	2026-01-21 18:51:55.575	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974744286\nTracking Number: +18444465478\nCall Duration: 81 seconds\nLocation: Kansas City, KS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 18:51:55.588001	2026-01-21 18:51:55.588001	3974744286	+18444465478	844-446-5478 Facebook	81	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
270	\N	inquiry	PENSACOLA    FL	\N	+18502027223	\N	\N	other	DM - Local Listing	2026-01-21 19:16:05.491	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974861304\nTracking Number: +18508459350\nCall Duration: 30 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 19:16:05.502798	2026-01-21 19:16:05.502798	3974861304	+18508459350	DM - Local Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
271	\N	inquiry	M HOUTCHENS	\N	+18505019677	\N	\N	website	DM - Multi-Organic Search	2026-01-21 19:18:45.279	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974851122\nTracking Number: +18335512356\nCall Duration: 327 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 19:18:45.290697	2026-01-21 19:18:45.290697	3974851122	+18335512356	DM - Multi-Organic Search	327	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
272	\N	inquiry	WALDORF      MD	\N	+13012665177	\N	\N	google	DM - Google Ads	2026-01-21 19:43:34.755	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3974996316\nTracking Number: +18334251241\nCall Duration: 13 seconds\nLocation: Waldorf, MD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 19:43:34.767251	2026-01-21 19:43:34.767251	3974996316	+18334251241	DM - Google Ads	13	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
273	\N	inquiry	AMY UHEREK	\N	+18504498860	\N	\N	other	DM - Brand & SSL Search	2026-01-21 19:49:32.417	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3975022134\nTracking Number: +18335512304\nCall Duration: 16 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 19:49:32.428747	2026-01-21 19:49:32.428747	3975022134	+18335512304	DM - Brand & SSL Search	16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
274	\N	inquiry	CRC HEALTHGROUP	\N	+18509391200	\N	\N	website	DM - Multi-Organic Search	2026-01-21 20:51:40.965	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3975291111\nTracking Number: +18335512356\nCall Duration: 29 seconds\nLocation: Holley Navarre, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 20:51:40.977594	2026-01-21 20:51:40.977594	3975291111	+18335512356	DM - Multi-Organic Search	29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
275	\N	inquiry	ANN WOOD	\N	+14102075050	\N	\N	website	DM - Multi-Organic Search	2026-01-21 21:19:58.938	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3975404094\nTracking Number: +18335512356\nCall Duration: 122 seconds\nLocation: Baltimore, MD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 21:19:58.950181	2026-01-21 21:19:58.950181	3975404094	+18335512356	DM - Multi-Organic Search	122	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
276	\N	inquiry	PENSACOLA    FL	\N	+18502818420	\N	\N	other	DM - Brand & SSL Search	2026-01-21 21:28:56.831	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3975443115\nTracking Number: +18335512304\nCall Duration: 62 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 21:28:56.842917	2026-01-21 21:28:56.842917	3975443115	+18335512304	DM - Brand & SSL Search	62	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
277	\N	inquiry	KIMBERLY BOULER	\N	+12055312815	\N	\N	website	DM - Multi-Organic Search	2026-01-21 21:31:57.813	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3975450015\nTracking Number: +18335512356\nCall Duration: 137 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 21:31:57.825289	2026-01-21 21:31:57.825289	3975450015	+18335512356	DM - Multi-Organic Search	137	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
278	\N	inquiry	D FUNIAK SPG FL	\N	+18509242826	\N	\N	website	DM - Multi-Organic Search	2026-01-22 00:22:42.396	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3975905865\nTracking Number: +18335512356\nCall Duration: 138 seconds\nLocation: De Funiak Springs, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 00:22:42.408015	2026-01-22 00:22:42.408015	3975905865	+18335512356	DM - Multi-Organic Search	138	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
279	\N	inquiry	KARLA MESSENGER	\N	+13347142142	\N	\N	other	DM - Brand & SSL Search	2026-01-22 14:33:05.242	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3976311987\nTracking Number: +18335512304\nCall Duration: 36 seconds\nLocation: Dothan, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 14:33:05.254815	2026-01-22 14:33:05.254815	3976311987	+18335512304	DM - Brand & SSL Search	36	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
280	\N	inquiry	WK Law Firm	\N	+12052123050	\N	\N	other	DM - Brand & SSL Search	2026-01-22 14:42:36.265	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3976336836\nTracking Number: +18335512304\nCall Duration: 49 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 14:42:36.27693	2026-01-22 14:42:36.27693	3976336836	+18335512304	DM - Brand & SSL Search	49	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
281	\N	inquiry	BRENDA COMER	\N	+12285470800	\N	\N	other	DM - Brand & SSL Search	2026-01-22 15:12:03.562	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3976430511\nTracking Number: +18335512304\nCall Duration: 8 seconds\nLocation: Gulfport, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 15:12:03.577953	2026-01-22 15:12:03.577953	3976430511	+18335512304	DM - Brand & SSL Search	8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
282	\N	inquiry	PENSACOLA    FL	\N	+18507239190	\N	\N	other	DM - Brand & SSL Search	2026-01-22 16:23:01.038	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3976687635\nTracking Number: +18335512304\nCall Duration: 41 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 16:23:01.051471	2026-01-22 16:23:01.051471	3976687635	+18335512304	DM - Brand & SSL Search	41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
283	\N	inquiry	SCOTT HOF	\N	+18509101385	\N	\N	website	DM - Multi-Organic Search	2026-01-22 17:09:21.961	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3976876686\nTracking Number: +18335512356\nCall Duration: 69 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 17:09:21.97522	2026-01-22 17:09:21.97522	3976876686	+18335512356	DM - Multi-Organic Search	69	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
284	\N	inquiry	LUCEDALE     MS	\N	+16015084590	\N	\N	other	DM - Ad Extension	2026-01-22 18:35:07.487	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3977249985\nTracking Number: +18334751492\nCall Duration: 57 seconds\nLocation: Lucedale, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 18:35:07.498653	2026-01-22 18:35:07.498653	3977249985	+18334751492	DM - Ad Extension	57	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
285	\N	inquiry	K RAYFIELD	\N	+18505298264	\N	\N	google	DM - Google Ads	2026-01-22 18:52:55.527	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3977317512\nTracking Number: +18334251241\nCall Duration: 174 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 18:52:55.539649	2026-01-22 18:52:55.539649	3977317512	+18334251241	DM - Google Ads	174	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
286	\N	inquiry	KEVIN HOYT	\N	+17155568081	\N	\N	other	DM - Brand & SSL Search	2026-01-22 19:26:31.204	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3977460816\nTracking Number: +18335512304\nCall Duration: 71 seconds\nLocation: Menomonie, WI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 19:26:31.217023	2026-01-22 19:26:31.217023	3977460816	+18335512304	DM - Brand & SSL Search	71	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
287	\N	inquiry	FT LAUDRDALE FL	\N	+19546266636	\N	\N	other	DM - Brand & SSL Search	2026-01-22 20:10:13.675	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3977631054\nTracking Number: +18335512304\nCall Duration: 84 seconds\nLocation: Fort Lauderdale, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 20:10:13.686569	2026-01-22 20:10:13.686569	3977631054	+18335512304	DM - Brand & SSL Search	84	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
288	\N	inquiry	FT WALTN BCH FL	\N	+18503761118	\N	\N	website	DM - Multi-Organic Search	2026-01-22 21:30:21.962	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3977927745\nTracking Number: +18335512356\nCall Duration: 213 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-22 21:30:21.980651	2026-01-22 21:30:21.980651	3977927745	+18335512356	DM - Multi-Organic Search	213	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
289	\N	inquiry	Incoming Call	\N	+13242011388	\N	\N	other	DM - Brand & SSL Search	2026-01-23 00:10:58.803	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3978399834\nTracking Number: +18335512304	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 00:10:58.81873	2026-01-23 00:10:58.81873	3978399834	+18335512304	DM - Brand & SSL Search	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
290	\N	inquiry	FAITH MODISETTE	\N	+13189879026	\N	\N	other	DM - Ad Extension	2026-01-23 04:25:24.819	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3978585774\nTracking Number: +18334751492\nCall Duration: 16 seconds\nLocation: Haughton, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 04:25:24.832625	2026-01-23 04:25:24.832625	3978585774	+18334751492	DM - Ad Extension	16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
291	\N	inquiry	ZEPHYRHILS   FL	\N	+16562261938	\N	\N	other	DM - Ad Extension	2026-01-23 14:57:29.895	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3978862632\nTracking Number: +18334751492\nCall Duration: 50 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 14:57:29.908282	2026-01-23 14:57:29.908282	3978862632	+18334751492	DM - Ad Extension	50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
292	\N	inquiry	MIAMI        FL	\N	+13054658205	\N	\N	other	DM - Brand & SSL Search	2026-01-23 15:16:15.883	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3978950667\nTracking Number: +18335512304\nCall Duration: 14 seconds\nLocation: Keys, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 15:16:15.905297	2026-01-23 15:16:15.905297	3978950667	+18335512304	DM - Brand & SSL Search	14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
293	\N	inquiry	TAMPA        FL	\N	+18134219623	\N	\N	other	DM - Brand & SSL Search	2026-01-23 15:59:17.77	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3979094940\nTracking Number: +18335512304\nCall Duration: 1 seconds\nLocation: Tampa Central, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 15:59:17.784058	2026-01-23 15:59:17.784058	3979094940	+18335512304	DM - Brand & SSL Search	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
294	\N	inquiry	JOHN HELMERS	\N	+12512002424	\N	\N	other	DM - Brand & SSL Search	2026-01-23 16:12:23.501	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3979142181\nTracking Number: +18335512304\nCall Duration: 165 seconds\nLocation: Foley, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 16:12:23.514725	2026-01-23 16:12:23.514725	3979142181	+18335512304	DM - Brand & SSL Search	165	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
295	\N	inquiry	BRONX        NY	\N	+13477145024	\N	\N	other	DM - Brand & SSL Search	2026-01-23 17:05:51.084	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3979377165\nTracking Number: +18335512304\nCall Duration: 13 seconds\nLocation: New York City Zone 3, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 17:05:51.097582	2026-01-23 17:05:51.097582	3979377165	+18335512304	DM - Brand & SSL Search	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
296	\N	inquiry	MARY AKINLOBA	\N	+13525198382	\N	\N	other	DM - Ad Extension	2026-01-23 20:08:48.314	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3980113077\nTracking Number: +18334751492\nCall Duration: 139 seconds\nLocation: Gainesville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 20:08:48.328866	2026-01-23 20:08:48.328866	3980113077	+18334751492	DM - Ad Extension	139	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
297	\N	inquiry	PAULA WINGARD	\N	+19039307154	\N	\N	other	DM - Brand & SSL Search	2026-01-23 20:44:57.521	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3980246493\nTracking Number: +18335512304\nCall Duration: 72 seconds\nLocation: Marshall, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 20:44:57.53351	2026-01-23 20:44:57.53351	3980246493	+18335512304	DM - Brand & SSL Search	72	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
298	\N	inquiry	J LENDERMON	\N	+18503908189	\N	\N	website	DM - Multi-Organic Search	2026-01-23 23:20:54.131	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3980677173\nTracking Number: +18335512356\nCall Duration: 155 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 23:20:54.143015	2026-01-23 23:20:54.143015	3980677173	+18335512356	DM - Multi-Organic Search	155	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
299	\N	inquiry	PERRINE      FL	\N	+17869544197	\N	\N	other	DM - Ad Extension	2026-01-24 03:50:19.763	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3980900148\nTracking Number: +18334751492\nCall Duration: 151 seconds\nLocation: Perrine, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-24 03:50:19.775636	2026-01-24 03:50:19.775636	3980900148	+18334751492	DM - Ad Extension	151	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
300	\N	inquiry	NEW ALBANY   MS	\N	+16623177571	\N	\N	google	DM - Google Ads	2026-01-24 11:56:28.796	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3980947470\nTracking Number: +18334251241\nCall Duration: 241 seconds\nLocation: New Albany, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-24 11:56:28.808222	2026-01-24 11:56:28.808222	3980947470	+18334251241	DM - Google Ads	241	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
301	\N	inquiry	RIDGELAND    SC	\N	+18432266270	\N	\N	google	DM - Google Ads	2026-01-24 15:08:45.868	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981052392\nTracking Number: +18334251241\nCall Duration: 30 seconds\nLocation: Ridgeland, SC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-24 15:08:45.880727	2026-01-24 15:08:45.880727	3981052392	+18334251241	DM - Google Ads	30	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
302	\N	inquiry	RIDGELAND    SC	\N	+18432260607	\N	\N	google	DM - Google Ads	2026-01-24 15:20:28.15	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981066759\nTracking Number: +18334251241\nCall Duration: 5 seconds\nLocation: Ridgeland, SC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-24 15:20:28.162505	2026-01-24 15:20:28.162505	3981066759	+18334251241	DM - Google Ads	5	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
303	\N	inquiry	PANAMA CITY  FL	\N	+18507758937	\N	\N	other	DM - Ad Extension	2026-01-24 16:53:44.574	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981191034\nTracking Number: +18334751492\nCall Duration: 40 seconds\nLocation: Panama City Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-24 16:53:44.587103	2026-01-24 16:53:44.587103	3981191034	+18334751492	DM - Ad Extension	40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
304	\N	inquiry	CONCORD      CA	\N	+19254992016	\N	\N	other	DM - Brand & SSL Search	2026-01-24 18:33:02.773	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981335499\nTracking Number: +18335512304\nCall Duration: 55 seconds\nLocation: Concord, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-24 18:33:02.785748	2026-01-24 18:33:02.785748	3981335499	+18335512304	DM - Brand & SSL Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
305	\N	inquiry	MICHAEL DEATON	\N	+18503044069	\N	\N	other	DM - Brand & SSL Search	2026-01-24 20:19:57.775	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981466329\nTracking Number: +18335512304\nCall Duration: 88 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-24 20:19:57.786994	2026-01-24 20:19:57.786994	3981466329	+18335512304	DM - Brand & SSL Search	88	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
306	\N	inquiry	ANGELA MORROW	\N	+19043330170	\N	\N	google	DM - Google Ads	2026-01-25 01:02:28.103	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981700305\nTracking Number: +18334251241\nCall Duration: 47 seconds\nLocation: Jacksonville, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 01:02:28.116612	2026-01-25 01:02:28.116612	3981700305	+18334251241	DM - Google Ads	47	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
307	\N	inquiry	T HOLLINGHEAD	\N	+13344886413	\N	\N	other	DM - Brand & SSL Search	2026-01-25 01:53:44.621	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981720747\nTracking Number: +18335512304\nCall Duration: 76 seconds\nLocation: Andalusia, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 01:53:44.633145	2026-01-25 01:53:44.633145	3981720747	+18335512304	DM - Brand & SSL Search	76	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
308	\N	inquiry	JONESVILLE   LA	\N	+13186579910	\N	\N	other	DM - Ad Extension	2026-01-25 07:37:27.491	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981786243\nTracking Number: +18334751492\nCall Duration: 87 seconds\nLocation: Jonesville, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 07:37:27.504169	2026-01-25 07:37:27.504169	3981786243	+18334751492	DM - Ad Extension	87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
309	\N	inquiry	CHRISTY SHIPPY	\N	+18507125092	\N	\N	google	DM - Google Ads	2026-01-25 16:03:34.692	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3981922905\nTracking Number: +18334251241\nCall Duration: 32 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 16:03:34.705531	2026-01-25 16:03:34.705531	3981922905	+18334251241	DM - Google Ads	32	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
310	\N	inquiry	C COOPER	\N	+12563374200	\N	\N	google	DM - Google Ads	2026-01-25 17:41:53.522	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982008708\nTracking Number: +18334251241\nCall Duration: 98 seconds\nLocation: Huntsville, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 17:41:53.533651	2026-01-25 17:41:53.533651	3982008708	+18334251241	DM - Google Ads	98	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
311	\N	inquiry	ROBERT WALKUP	\N	+18506862588	\N	\N	other	DM - Brand & SSL Search	2026-01-25 20:18:12.612	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982142625\nTracking Number: +18335512304\nCall Duration: 261 seconds\nLocation: Pace, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 20:18:12.624047	2026-01-25 20:18:12.624047	3982142625	+18335512304	DM - Brand & SSL Search	261	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
312	\N	inquiry	BREWTON      AL	\N	+12512365125	\N	\N	website	DM - Multi-Organic Search	2026-01-25 21:31:16.754	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982203537\nTracking Number: +18335512356\nCall Duration: 306 seconds\nLocation: Brewton, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 21:31:16.765757	2026-01-25 21:31:16.765757	3982203537	+18335512356	DM - Multi-Organic Search	306	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
313	\N	inquiry	BEAVERTON    OR	\N	+19712285556	\N	\N	other	NMHCS Card	2026-01-25 22:14:22.746	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982237701\nTracking Number: +18889026913\nCall Duration: 26 seconds\nLocation: Portland, OR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 22:14:22.757805	2026-01-25 22:14:22.757805	3982237701	+18889026913	NMHCS Card	26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
314	\N	inquiry	FTLAUDERDL   FL	\N	+17543248262	\N	\N	other	DM - Local Listing	2026-01-25 22:41:56.707	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982255725\nTracking Number: +18508459350\nCall Duration: 26 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 22:41:56.719827	2026-01-25 22:41:56.719827	3982255725	+18508459350	DM - Local Listing	26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
315	\N	inquiry	C MIDLAND	\N	+18502256538	\N	\N	google	DM - Google Ads	2026-01-25 23:00:16.965	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982265790\nTracking Number: +18334251241\nCall Duration: 239 seconds\nLocation: Ft Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 23:00:16.979135	2026-01-25 23:00:16.979135	3982265790	+18334251241	DM - Google Ads	239	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
316	\N	inquiry	LARRY CALLOWAY	\N	+13347186025	\N	\N	other	DM - Ad Extension	2026-01-26 09:47:27.769	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982444734\nTracking Number: +18334751492\nCall Duration: 30 seconds\nLocation: Dothan, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 09:47:27.781566	2026-01-26 09:47:27.781566	3982444734	+18334751492	DM - Ad Extension	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
317	\N	inquiry	PENSACOLA    FL	\N	+18502027503	\N	\N	other	DM - Local Listing	2026-01-26 14:30:55.907	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3982633322\nTracking Number: +18508459350\nCall Duration: 30 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 14:30:55.920191	2026-01-26 14:30:55.920191	3982633322	+18508459350	DM - Local Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
318	\N	inquiry	BOCA RATON   FL	\N	+15614539055	\N	\N	other	DM - Brand & SSL Search	2026-01-26 17:18:58.273	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3983268374\nTracking Number: +18335512304\nCall Duration: 34 seconds\nLocation: Boca Raton, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 17:18:58.285495	2026-01-26 17:18:58.285495	3983268374	+18335512304	DM - Brand & SSL Search	34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
319	\N	inquiry	AMY WILLIAMS	\N	+15028029760	\N	\N	other	DM - Brand & SSL Search	2026-01-26 17:33:06.201	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3983330216\nTracking Number: +18335512304\nCall Duration: 30 seconds\nLocation: Louisville, KY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 17:33:06.214669	2026-01-26 17:33:06.214669	3983330216	+18335512304	DM - Brand & SSL Search	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
320	\N	inquiry	DAYTONA BCH  FL	\N	+13863161012	\N	\N	other	DM - Brand & SSL Search	2026-01-26 18:03:11.886	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3983452187\nTracking Number: +18335512304\nCall Duration: 129 seconds\nLocation: Daytona Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 18:03:11.898984	2026-01-26 18:03:11.898984	3983452187	+18335512304	DM - Brand & SSL Search	129	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
321	\N	inquiry	PENSACOLA    FL	\N	+18502075353	\N	\N	other	DM - Brand & SSL Search	2026-01-26 18:52:55.246	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3983678585\nTracking Number: +18335512304\nCall Duration: 55 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 18:52:55.259247	2026-01-26 18:52:55.259247	3983678585	+18335512304	DM - Brand & SSL Search	55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
322	\N	inquiry	BIRMINGHAM   AL	\N	+12055164486	\N	\N	google	DM - Google Ads	2026-01-26 20:28:34.938	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3984072449\nTracking Number: +18334251241\nCall Duration: 47 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 20:28:34.95026	2026-01-26 20:28:34.95026	3984072449	+18334251241	DM - Google Ads	47	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
323	\N	inquiry	CLEVELAND    OH	\N	+14405703111	\N	\N	other	DM - Ad Extension	2026-01-26 21:07:27.565	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3984219764\nTracking Number: +18334751492\nCall Duration: 93 seconds\nLocation: Victory, OH	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 21:07:27.577847	2026-01-26 21:07:27.577847	3984219764	+18334751492	DM - Ad Extension	93	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
324	\N	inquiry	DOUGLAS LEE	\N	+15012760295	\N	\N	other	DM - Brand & SSL Search	2026-01-26 22:49:24.976	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3984559244\nTracking Number: +18335512304\nCall Duration: 50 seconds\nLocation: Hot Springs, AR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 22:49:24.993128	2026-01-26 22:49:24.993128	3984559244	+18335512304	DM - Brand & SSL Search	50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
325	\N	inquiry	LISA TISDALE	\N	+18502883879	\N	\N	other	DM - Brand & SSL Search	2026-01-27 08:22:48.998	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3984952752\nTracking Number: +18335512304\nCall Duration: 174 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 08:22:49.011382	2026-01-27 08:22:49.011382	3984952752	+18335512304	DM - Brand & SSL Search	174	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
326	\N	inquiry	BRENT KELLEY	\N	+19092485589	\N	\N	other	DM - Brand & SSL Search	2026-01-27 15:30:31.279	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3985373277\nTracking Number: +18335512304\nCall Duration: 53 seconds\nLocation: Chino, CA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 15:30:31.294636	2026-01-27 15:30:31.294636	3985373277	+18335512304	DM - Brand & SSL Search	53	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
327	\N	inquiry	AUSTIN       TX	\N	+15123689843	\N	\N	other	DM - Brand & SSL Search	2026-01-27 19:06:34.944	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3986334240\nTracking Number: +18335512304\nCall Duration: 51 seconds\nLocation: Austin, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 19:06:34.957343	2026-01-27 19:06:34.957343	3986334240	+18335512304	DM - Brand & SSL Search	51	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
328	\N	inquiry	BOCA RATON   FL	\N	+17286669966	\N	\N	other	DM - Brand & SSL Search	2026-01-27 19:13:58.046	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3986369970\nTracking Number: +18335512304\nCall Duration: 32 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 19:13:58.061867	2026-01-27 19:13:58.061867	3986369970	+18335512304	DM - Brand & SSL Search	32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
329	\N	inquiry	ALBANY       NY	\N	+15186468254	\N	\N	google	Google My Business Listing	2026-01-27 19:32:44.419	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3986440335\nTracking Number: +18558990319\nCall Duration: 150 seconds\nLocation: NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 19:32:44.431242	2026-01-27 19:32:44.431242	3986440335	+18558990319	Google My Business Listing	150	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
330	\N	inquiry	ALLISON WALKER	\N	+19414477977	\N	\N	other	DM - Brand & SSL Search	2026-01-27 20:19:36.075	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3986641680\nTracking Number: +18335512304\nCall Duration: 73 seconds\nLocation: Bradenton, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 20:19:36.100505	2026-01-27 20:19:36.100505	3986641680	+18335512304	DM - Brand & SSL Search	73	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
331	\N	inquiry	MOBILE       AL	\N	+12512727070	\N	\N	other	DM - Brand & SSL Search	2026-01-27 20:52:21.485	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3986785431\nTracking Number: +18335512304\nCall Duration: 61 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 20:52:21.498057	2026-01-27 20:52:21.498057	3986785431	+18335512304	DM - Brand & SSL Search	61	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
332	\N	inquiry	SHREVEPORT   LA	\N	+13184010440	\N	\N	other	DM - Ad Extension	2026-01-28 16:25:47.336	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3988232231\nTracking Number: +18334751492\nCall Duration: 51 seconds\nLocation: Shreveport, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 16:25:47.350204	2026-01-28 16:25:47.350204	3988232231	+18334751492	DM - Ad Extension	51	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
333	\N	inquiry	MIAMI        FL	\N	+13054627831	\N	\N	other	DM - Brand & SSL Search	2026-01-28 17:06:48.296	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3988421654\nTracking Number: +18335512304\nCall Duration: 30 seconds\nLocation: Miami, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 17:06:48.309344	2026-01-28 17:06:48.309344	3988421654	+18335512304	DM - Brand & SSL Search	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
334	\N	inquiry	LAKEVIEW CENTER	\N	+18504321222	\N	\N	website	DM - Multi-Organic Search	2026-01-28 18:47:41.307	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3988893131\nTracking Number: +18335512356\nCall Duration: 31 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 18:47:41.31954	2026-01-28 18:47:41.31954	3988893131	+18335512356	DM - Multi-Organic Search	31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
335	\N	inquiry	DESTIN       FL	\N	+18505027710	\N	\N	google	DM - Google Ads	2026-01-28 19:01:12.594	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3988945061\nTracking Number: +18334251241\nCall Duration: 67 seconds\nLocation: Destin, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 19:01:12.605525	2026-01-28 19:01:12.605525	3988945061	+18334251241	DM - Google Ads	67	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
336	\N	inquiry	ALLENTOWN    PA	\N	+14843505912	\N	\N	facebook	844-446-5478 Facebook	2026-01-28 19:09:44.295	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3988985819\nTracking Number: +18444465478\nCall Duration: 58 seconds\nLocation: Norristown, PA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 19:09:44.306483	2026-01-28 19:09:44.306483	3988985819	+18444465478	844-446-5478 Facebook	58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
337	\N	inquiry	DESTIN       FL	\N	+18505176320	\N	\N	other	DM - Brand & SSL Search	2026-01-28 19:56:53.448	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3989174018\nTracking Number: +18335512304\nCall Duration: 196 seconds\nLocation: Destin, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 19:56:53.460089	2026-01-28 19:56:53.460089	3989174018	+18335512304	DM - Brand & SSL Search	196	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
338	\N	inquiry	STATEN IS    NY	\N	+19292028280	\N	\N	other	DM - Brand & SSL Search	2026-01-28 21:16:31.872	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3989529884\nTracking Number: +18335512304\nCall Duration: 10 seconds\nLocation: New York City Zone 14, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 21:16:31.885806	2026-01-28 21:16:31.885806	3989529884	+18335512304	DM - Brand & SSL Search	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
339	\N	inquiry	F DAVIDSON	\N	+12513770500	\N	\N	other	DM - Brand & SSL Search	2026-01-28 21:26:37.578	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3989561495\nTracking Number: +18335512304\nCall Duration: 58 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 21:26:37.589644	2026-01-28 21:26:37.589644	3989561495	+18335512304	DM - Brand & SSL Search	58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
340	\N	inquiry	TAMELA BARTLETT	\N	+16014804645	\N	\N	other	DM - Brand & SSL Search	2026-01-28 22:08:45.354	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3989704283\nTracking Number: +18335512304\nCall Duration: 60 seconds\nLocation: Meridian, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 22:08:45.36702	2026-01-28 22:08:45.36702	3989704283	+18335512304	DM - Brand & SSL Search	60	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
341	\N	inquiry	Incoming Call	\N	+19172300631	\N	\N	website	DM - Multi-Organic Search	2026-01-28 23:33:17.575	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3989928974\nTracking Number: +18335512356\nCall Duration: 33 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-28 23:33:17.587368	2026-01-28 23:33:17.587368	3989928974	+18335512356	DM - Multi-Organic Search	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
342	\N	inquiry	PENSACOLA    FL	\N	+18502027220	\N	\N	other	DM - Local Listing	2026-01-29 13:08:18.103	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3990292754\nTracking Number: +18508459350\nCall Duration: 30 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 13:08:18.117114	2026-01-29 13:08:18.117114	3990292754	+18508459350	DM - Local Listing	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
343	\N	inquiry	LAKE CHARLES LA	\N	+13375158286	\N	\N	other	DM - Ad Extension	2026-01-29 14:52:20.989	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3990500042\nTracking Number: +18334751492\nCall Duration: 47 seconds\nLocation: Lake Charles, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 14:52:21.00446	2026-01-29 14:52:21.00446	3990500042	+18334751492	DM - Ad Extension	47	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
344	\N	inquiry	DAYTONA BCH  FL	\N	+13867779628	\N	\N	other	DM - Brand & SSL Search	2026-01-29 15:01:53.185	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3990529091\nTracking Number: +18335512304\nCall Duration: 31 seconds\nLocation: Daytona Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 15:01:53.197383	2026-01-29 15:01:53.197383	3990529091	+18335512304	DM - Brand & SSL Search	31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
345	\N	inquiry	PENSACOLA    FL	\N	+18503465010	\N	\N	website	DM - Multi-Organic Search	2026-01-29 15:40:11.158	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3990660440\nTracking Number: +18335512356\nCall Duration: 341 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 15:40:11.172044	2026-01-29 15:40:11.172044	3990660440	+18335512356	DM - Multi-Organic Search	341	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
346	\N	inquiry	COLUMBIA     MD	\N	+14433191722	\N	\N	other	DM - Brand & SSL Search	2026-01-29 16:49:54.092	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3991003091\nTracking Number: +18335512304\nCall Duration: 33 seconds\nLocation: Columbia, MD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 16:49:54.104842	2026-01-29 16:49:54.104842	3991003091	+18335512304	DM - Brand & SSL Search	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
347	\N	inquiry	APRIL MCWHORTER	\N	+12147341020	\N	\N	other	DM - Brand & SSL Search	2026-01-29 17:18:41.938	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3991143362\nTracking Number: +18335512304\nCall Duration: 71 seconds\nLocation: Grand Prairie, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 17:18:41.953604	2026-01-29 17:18:41.953604	3991143362	+18335512304	DM - Brand & SSL Search	71	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
348	\N	inquiry	JASPER       AL	\N	+12053883433	\N	\N	other	DM - Ad Extension	2026-01-29 17:32:03.545	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3991216223\nTracking Number: +18334751492\nCall Duration: 30 seconds\nLocation: Jasper, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 17:32:03.557101	2026-01-29 17:32:03.557101	3991216223	+18334751492	DM - Ad Extension	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
349	\N	inquiry	KAYSVILLE    UT	\N	+18016785270	\N	\N	other	DM - Brand & SSL Search	2026-01-29 18:51:28.983	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3991585913\nTracking Number: +18335512304\nCall Duration: 34 seconds\nLocation: Kaysville, UT	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 18:51:28.996774	2026-01-29 18:51:28.996774	3991585913	+18335512304	DM - Brand & SSL Search	34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
350	\N	inquiry	PENSACOLA    FL	\N	+18507418004	\N	\N	other	DM - Brand & SSL Search	2026-01-29 19:13:44.056	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3991681799\nTracking Number: +18335512304\nCall Duration: 41 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 19:13:44.069606	2026-01-29 19:13:44.069606	3991681799	+18335512304	DM - Brand & SSL Search	41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
351	\N	inquiry	NASHVILLE    TN	\N	+16157082902	\N	\N	google	DM - Google Ads	2026-01-29 19:52:06.349	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3991850333\nTracking Number: +18334251241\nCall Duration: 20 seconds\nLocation: Nashville, TN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 19:52:06.360305	2026-01-29 19:52:06.360305	3991850333	+18334251241	DM - Google Ads	20	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
352	\N	inquiry	BAPTIST HEALTH	\N	+14482278478	\N	\N	other	DM - Brand & SSL Search	2026-01-29 21:43:05.38	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3992280092\nTracking Number: +18335512304\nCall Duration: 64 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 21:43:05.393526	2026-01-29 21:43:05.393526	3992280092	+18335512304	DM - Brand & SSL Search	64	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
353	\N	inquiry	PENSACOLA    FL	\N	+18507481316	\N	\N	other	DM - Brand & SSL Search	2026-01-30 00:33:11.065	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3992701979\nTracking Number: +18335512304\nCall Duration: 46 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 00:33:11.077334	2026-01-30 00:33:11.077334	3992701979	+18335512304	DM - Brand & SSL Search	46	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
354	\N	inquiry	TUSCALOOSA   AL	\N	+12055792159	\N	\N	other	DM - Ad Extension	2026-01-30 04:37:49.162	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3992851181\nTracking Number: +18334751492\nCall Duration: 122 seconds\nLocation: Tuscaloosa, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 04:37:49.175314	2026-01-30 04:37:49.175314	3992851181	+18334751492	DM - Ad Extension	122	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
355	\N	inquiry	YONKERS      NY	\N	+19149666095	\N	\N	other	DM - Brand & SSL Search	2026-01-30 13:54:02.733	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3992992778\nTracking Number: +18335512304\nCall Duration: 10 seconds\nLocation: Westchester Zone 1, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 13:54:02.746796	2026-01-30 13:54:02.746796	3992992778	+18335512304	DM - Brand & SSL Search	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
356	\N	inquiry	REBECCA WILK	\N	+12144996202	\N	\N	website	DM - Multi-Organic Search	2026-01-30 15:07:40.443	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3993160970\nTracking Number: +18335512356\nCall Duration: 509 seconds\nLocation: Irving, TX	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 15:07:40.45479	2026-01-30 15:07:40.45479	3993160970	+18335512356	DM - Multi-Organic Search	509	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
357	\N	inquiry	ALBERTVILLE  AL	\N	+12563888350	\N	\N	google	DM - Google Ads	2026-01-30 15:18:23.422	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3993217946\nTracking Number: +18334251241\nCall Duration: 195 seconds\nLocation: Albertville, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 15:18:23.434196	2026-01-30 15:18:23.434196	3993217946	+18334251241	DM - Google Ads	195	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
358	\N	inquiry	TAMPA        FL	\N	+18136387582	\N	\N	website	DM - Multi-Organic Search	2026-01-30 18:54:30.277	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3994095869\nTracking Number: +18335512356\nCall Duration: 83 seconds\nLocation: Tampa Central, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 18:54:30.289034	2026-01-30 18:54:30.289034	3994095869	+18335512356	DM - Multi-Organic Search	83	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
359	\N	inquiry	PENSACOLA    FL	\N	+18502027340	\N	\N	other	DM - Local Listing	2026-01-30 20:03:50.243	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3994373009\nTracking Number: +18508459350\nCall Duration: 35 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 20:03:50.257502	2026-01-30 20:03:50.257502	3994373009	+18508459350	DM - Local Listing	35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
360	\N	inquiry	Musselman David	\N	+18504504105	\N	\N	other	DM - Brand & SSL Search	2026-01-31 01:23:32.17	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995090834\nTracking Number: +18335512304\nCall Duration: 102 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 01:23:32.183662	2026-01-31 01:23:32.183662	3995090834	+18335512304	DM - Brand & SSL Search	102	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
361	\N	inquiry	SAINT LOUIS  OK	\N	+14052894981	\N	\N	other	NMHCS Card	2026-01-31 04:36:28.436	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995160719\nTracking Number: +18889026913\nCall Duration: 39 seconds\nLocation: Maud, OK	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 04:36:28.448974	2026-01-31 04:36:28.448974	3995160719	+18889026913	NMHCS Card	39	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
362	\N	inquiry	DAVID FEREBEE	\N	+12516541007	\N	\N	other	DM - Brand & SSL Search	2026-01-31 12:31:32.538	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995202941\nTracking Number: +18335512304\nCall Duration: 217 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 12:31:32.550575	2026-01-31 12:31:32.550575	3995202941	+18335512304	DM - Brand & SSL Search	217	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
363	\N	inquiry	TAMPA        FL	\N	+18137433565	\N	\N	other	DM - Brand & SSL Search	2026-01-31 14:33:46.564	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995264123\nTracking Number: +18335512304\nCall Duration: 176 seconds\nLocation: Tampa, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 14:33:46.576509	2026-01-31 14:33:46.576509	3995264123	+18335512304	DM - Brand & SSL Search	176	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
364	\N	inquiry	MORGAN CITY  LA	\N	+19857144835	\N	\N	website	DM - Multi-Organic Search	2026-01-31 15:18:10.071	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995316872\nTracking Number: +18335512356\nCall Duration: 110 seconds\nLocation: Morgan City, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 15:18:10.084728	2026-01-31 15:18:10.084728	3995316872	+18335512356	DM - Multi-Organic Search	110	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
365	\N	inquiry	SYVNHLSHWD   AR	\N	+15015998788	\N	\N	other	DM - Brand & SSL Search	2026-01-31 20:32:48.673	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995790050\nTracking Number: +18335512304\nCall Duration: 60 seconds\nLocation: Sylvan Hills Sherwood, AR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 20:32:48.685228	2026-01-31 20:32:48.685228	3995790050	+18335512304	DM - Brand & SSL Search	60	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
366	\N	inquiry	BRUCE SHEFFIELD	\N	+18503982932	\N	\N	other	DM - Brand & SSL Search	2026-01-31 20:44:15.12	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995796509\nTracking Number: +18335512304\nCall Duration: 479 seconds\nLocation: Crestview, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 20:44:15.13154	2026-01-31 20:44:15.13154	3995796509	+18335512304	DM - Brand & SSL Search	479	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
367	\N	inquiry	Incoming Call	\N	+14482390410	\N	\N	other	DM - Brand & SSL Search	2026-01-31 20:56:34.996	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3995820068\nTracking Number: +18335512304\nCall Duration: 106 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 20:56:35.007791	2026-01-31 20:56:35.007791	3995820068	+18335512304	DM - Brand & SSL Search	106	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
368	\N	inquiry	MATTHEW WAGNER	\N	+18503980982	\N	\N	other	DM - Brand & SSL Search	2026-02-01 23:33:03.582	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3996685940\nTracking Number: +18335512304\nCall Duration: 30 seconds\nLocation: Crestview, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-01 23:33:03.59442	2026-02-01 23:33:03.59442	3996685940	+18335512304	DM - Brand & SSL Search	30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
369	\N	inquiry	GONZALES     LA	\N	+12254595837	\N	\N	other	DM - Ad Extension	2026-02-01 23:50:12.87	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3996694991\nTracking Number: +18334751492\nCall Duration: 177 seconds\nLocation: Gonzales, LA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-01 23:50:12.882553	2026-02-01 23:50:12.882553	3996694991	+18334751492	DM - Ad Extension	177	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
370	\N	inquiry	PELL CITY    AL	\N	+16592438153	\N	\N	other	DM - Brand & SSL Search	2026-02-02 13:29:12.666	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3996936926\nTracking Number: +18335512304\nCall Duration: 62 seconds\nLocation: Pell City, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 13:29:12.678322	2026-02-02 13:29:12.678322	3996936926	+18335512304	DM - Brand & SSL Search	62	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
371	\N	inquiry	KYLE JONES	\N	+18505868596	\N	\N	other	DM - Brand & SSL Search	2026-02-02 14:44:42.506	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3997106540\nTracking Number: +18335512304\nCall Duration: 385 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 14:44:42.518336	2026-02-02 14:44:42.518336	3997106540	+18335512304	DM - Brand & SSL Search	385	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
372	\N	inquiry	HATTIESBURG  MS	\N	+16014021940	\N	\N	other	DM - Brand & SSL Search	2026-02-02 15:50:47.961	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3997416446\nTracking Number: +18335512304\nCall Duration: 150 seconds\nLocation: Hattiesburg, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 15:50:47.973705	2026-02-02 15:50:47.973705	3997416446	+18335512304	DM - Brand & SSL Search	150	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
373	\N	inquiry	FT WALTN BCH FL	\N	+18503747167	\N	\N	other	DM - Brand & SSL Search	2026-02-02 16:01:58.633	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3997464848\nTracking Number: +18335512304\nCall Duration: 73 seconds\nLocation: Fort Walton Beach, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 16:01:58.643832	2026-02-02 16:01:58.643832	3997464848	+18335512304	DM - Brand & SSL Search	73	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
374	\N	inquiry	BIRMINGHAM   AL	\N	+12058024210	\N	\N	website	DM - Multi-Organic Search	2026-02-02 17:22:23.917	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3997839998\nTracking Number: +18335512356\nCall Duration: 39 seconds\nLocation: Birmingham, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 17:22:23.929747	2026-02-02 17:22:23.929747	3997839998	+18335512356	DM - Multi-Organic Search	39	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
375	\N	inquiry	BRENDAN COX	\N	+14125614290	\N	\N	website	DM - Multi-Organic Search	2026-02-02 17:46:25.617	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3997955996\nTracking Number: +18335512356\nCall Duration: 40 seconds\nLocation: Pittsburgh Zone 6, PA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 17:46:25.629981	2026-02-02 17:46:25.629981	3997955996	+18335512356	DM - Multi-Organic Search	40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
376	\N	inquiry	S RICHMND HL NY	\N	+17185752000	\N	\N	other	DM - Brand & SSL Search	2026-02-02 17:52:29.299	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3997984448\nTracking Number: +18335512304\nCall Duration: 59 seconds\nLocation: New York City Zone 10, NY	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 17:52:29.313312	2026-02-02 17:52:29.313312	3997984448	+18335512304	DM - Brand & SSL Search	59	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
377	\N	inquiry	PENSACOLA    FL	\N	+18503821102	\N	\N	other	DM - Brand & SSL Search	2026-02-02 18:33:26.048	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998174051\nTracking Number: +18335512304\nCall Duration: 39 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 18:33:26.062232	2026-02-02 18:33:26.062232	3998174051	+18335512304	DM - Brand & SSL Search	39	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
378	\N	inquiry	TOLL FREE CALL	\N	+18006696777	\N	\N	website	DM - Multi-Organic Search	2026-02-02 18:43:29.615	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998218148\nTracking Number: +18335512356\nCall Duration: 35 seconds	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 18:43:29.626451	2026-02-02 18:43:29.626451	3998218148	+18335512356	DM - Multi-Organic Search	35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
379	\N	inquiry	Williamson C	\N	+16157915440	\N	\N	other	Why Holistic Page CTA	2026-02-02 20:02:41.688	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998566799\nTracking Number: +18558005126\nCall Duration: 33 seconds\nLocation: Franklin, TN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 20:02:41.699845	2026-02-02 20:02:41.699845	3998566799	+18558005126	Why Holistic Page CTA	33	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
380	\N	inquiry	NASHVILLE    TN	\N	+16153206772	\N	\N	other	Why Holistic Page CTA	2026-02-02 20:13:50.543	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998618348\nTracking Number: +18558005126\nCall Duration: 32 seconds\nLocation: Nashville, TN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 20:13:50.554304	2026-02-02 20:13:50.554304	3998618348	+18558005126	Why Holistic Page CTA	32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
381	\N	inquiry	ORLANDO      FL	\N	+14074188295	\N	\N	other	DM - Brand & SSL Search	2026-02-02 20:18:05.705	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998641916\nTracking Number: +18335512304\nLocation: Orlando, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 20:18:05.717222	2026-02-02 20:18:05.717222	3998641916	+18335512304	DM - Brand & SSL Search	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
382	\N	inquiry	BELLE MEAD   NJ	\N	+19082817800	\N	\N	website	DM - Multi-Organic Search	2026-02-02 20:19:34.734	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998634806\nTracking Number: +18335512356\nCall Duration: 142 seconds\nLocation: Belle Mead, NJ	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 20:19:34.747178	2026-02-02 20:19:34.747178	3998634806	+18335512356	DM - Multi-Organic Search	142	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
383	\N	inquiry	PENSACOLA    FL	\N	+18504494862	\N	\N	other	DM - Brand & SSL Search	2026-02-02 20:45:41.907	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998753783\nTracking Number: +18335512304\nCall Duration: 34 seconds\nLocation: Pensacola, FL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 20:45:41.919447	2026-02-02 20:45:41.919447	3998753783	+18335512304	DM - Brand & SSL Search	34	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
384	\N	inquiry	MOBILE       AL	\N	+12515102510	\N	\N	website	DM - Multi-Organic Search	2026-02-02 21:01:09.312	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3998812007\nTracking Number: +18335512356\nCall Duration: 91 seconds\nLocation: Mobile, AL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 21:01:09.324145	2026-02-02 21:01:09.324145	3998812007	+18335512356	DM - Multi-Organic Search	91	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
385	\N	inquiry	Ainsworth E	\N	+16019428748	\N	\N	google	DM - Google Ads	2026-02-02 22:45:08.172	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3999222893\nTracking Number: +18334251241\nCall Duration: 31 seconds\nLocation: Jackson, MS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 22:45:08.184953	2026-02-02 22:45:08.184953	3999222893	+18334251241	DM - Google Ads	31	\N	\N	online	\N	google_ppc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
386	\N	inquiry	Master Craft	\N	+17023307907	\N	\N	website	DM - Multi-Organic Search	2026-02-02 23:54:16.869	Auto-created from CallTrackingMetrics webhook.\nCall ID: 3999410102\nTracking Number: +18335512356\nCall Duration: 130 seconds\nLocation: Las Vegas, NV	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 23:54:16.882861	2026-02-02 23:54:16.882861	3999410102	+18335512356	DM - Multi-Organic Search	130	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N
\.


--
-- Data for Name: inquiry_phone_map; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inquiry_phone_map (id, company_id, inquiry_id, phone_e164, created_at) FROM stdin;
18	1	20	+15185916920	2025-12-19 16:51:51.215968
19	1	21	+18508966460	2025-12-19 17:18:50.905946
20	1	22	+18503235894	2025-12-19 17:18:51.008728
21	1	23	+19704563268	2025-12-19 17:42:15.72739
22	1	24	+18506194209	2025-12-19 18:00:39.466104
23	1	25	+16172905060	2025-12-19 21:00:20.47689
24	1	26	+14156926481	2025-12-19 21:03:35.221421
25	1	27	+15868991344	2025-12-19 21:51:47.235683
26	1	28	+16162853208	2025-12-20 03:11:07.831879
27	1	29	+12109952873	2025-12-20 03:24:43.313871
28	1	30	+18569009692	2025-12-20 07:23:17.474072
29	1	31	+19012084915	2025-12-20 10:49:56.417561
30	1	32	+17472553458	2025-12-20 12:41:16.426062
31	1	33	+19044057787	2025-12-20 14:01:45.137981
32	1	34	+18505825588	2025-12-20 14:13:49.006805
33	1	35	+13344015844	2025-12-20 14:18:42.940193
34	1	36	+17408518007	2025-12-20 14:56:31.579256
35	1	37	+18505037912	2025-12-20 16:44:20.044619
36	1	38	+13058074252	2025-12-20 17:18:24.102851
37	1	39	+13183590857	2025-12-20 17:45:20.376185
38	1	40	+12397768552	2025-12-20 18:43:12.968351
39	1	41	+14783029145	2025-12-20 19:43:18.18211
40	1	42	+17143510350	2025-12-20 20:06:17.604324
41	1	43	+16018435000	2025-12-20 21:50:24.484361
42	1	44	+19047554020	2025-12-21 06:05:57.248914
43	1	45	+13343041167	2025-12-21 15:43:13.343031
44	1	46	+15042326440	2025-12-21 15:51:41.919665
45	1	47	+18508651250	2025-12-21 17:20:42.680426
46	1	48	+18509342000	2025-12-21 17:28:42.450125
47	1	49	+12564401713	2025-12-22 05:14:22.608829
48	1	50	+16208750065	2025-12-22 13:34:00.713906
49	1	51	+12254832298	2025-12-22 14:44:30.131491
50	1	52	+12056399081	2025-12-22 14:47:58.095508
51	1	53	+12282179342	2025-12-22 17:03:57.555058
52	1	54	+12056124698	2025-12-22 17:56:07.252339
53	1	55	+18502329068	2025-12-22 19:09:31.765934
54	1	56	+14153160763	2025-12-22 19:39:10.555434
55	1	57	+18053006625	2025-12-22 19:53:44.41514
56	1	58	+12513248012	2025-12-22 20:04:08.256375
57	1	59	+17047734291	2025-12-23 00:18:35.020029
58	1	60	+13194647590	2025-12-23 00:49:19.918686
59	1	61	+19726895264	2025-12-23 00:59:30.322244
60	1	62	+19048066265	2025-12-23 01:45:25.541118
61	1	63	+15044428373	2025-12-23 02:33:32.593389
62	1	64	+12253630015	2025-12-23 07:54:57.299733
63	1	65	+18507241997	2025-12-23 13:33:54.839019
64	1	66	+13184010284	2025-12-23 16:00:55.64725
65	1	67	+12542719155	2025-12-23 16:19:51.83988
66	1	68	+18507686750	2025-12-23 17:49:45.320551
67	1	69	+18507361528	2025-12-23 19:28:30.845447
68	1	70	+19046352315	2025-12-23 19:32:22.046446
69	1	71	+19132382910	2025-12-23 21:17:37.642272
70	1	72	+13155570122	2025-12-24 01:13:32.897081
71	1	73	+12563283112	2025-12-24 02:50:53.505572
72	1	74	+12562672527	2025-12-24 17:43:44.826618
73	1	75	+12512940334	2025-12-24 18:18:01.318924
74	1	76	+19852856569	2025-12-25 00:04:23.635807
75	1	77	+16028039265	2025-12-25 04:17:23.517907
76	1	78	+17867202002	2025-12-25 05:23:55.636728
77	1	79	+14482405661	2025-12-25 15:23:55.71371
78	1	80	+18506969400	2025-12-25 17:10:55.174751
79	1	81	+17344504882	2025-12-25 18:27:59.443604
80	1	82	+15185966200	2025-12-25 22:39:00.461726
81	1	83	+19314558557	2025-12-25 23:30:55.672101
82	1	84	+16783270526	2025-12-26 14:28:53.540262
83	1	85	+18507365889	2025-12-26 16:30:13.240589
84	1	86	+14082096581	2025-12-26 18:08:08.885369
85	1	87	+12059028386	2025-12-26 18:30:22.61669
86	1	88	+17862187590	2025-12-26 18:59:41.476961
87	1	89	+18507379078	2025-12-26 19:04:31.063041
88	1	90	+14402895689	2025-12-26 20:39:27.608862
89	1	91	+18503758691	2025-12-26 22:32:39.811012
90	1	92	+18508046000	2025-12-26 23:31:43.260399
91	1	93	+19044283080	2025-12-27 15:24:43.188351
92	1	94	+19548214656	2025-12-27 19:45:41.603452
93	1	95	+12402736892	2025-12-27 20:31:57.182194
94	1	96	+12057846311	2025-12-27 22:02:03.281268
95	1	97	+18508304829	2025-12-27 22:11:54.95248
96	1	98	+12566054782	2025-12-27 23:54:58.783796
97	1	99	+15185566218	2025-12-28 05:24:16.056913
98	1	100	+13527716741	2025-12-28 11:44:12.654399
99	1	101	+16059209725	2025-12-28 12:15:04.623191
100	1	102	+18502800247	2025-12-28 13:25:02.591096
101	1	103	+12283341163	2025-12-28 13:32:36.892239
102	1	104	+18504901756	2025-12-28 16:46:49.544536
103	1	105	+12295618598	2025-12-28 18:32:25.065835
104	1	106	+18502263657	2025-12-28 20:29:27.23509
105	1	107	+14844677784	2025-12-28 20:58:16.121932
106	1	108	+18507039998	2025-12-28 21:32:24.868965
107	1	109	+19853584557	2025-12-29 04:02:57.809021
108	1	110	+13343229315	2025-12-29 05:31:03.687053
109	1	111	+15733902680	2025-12-29 15:50:01.499706
110	1	112	+13522215533	2025-12-29 17:23:09.090866
111	1	113	+12513495600	2025-12-29 17:31:16.57251
112	1	114	+12564045658	2025-12-29 18:32:22.494666
113	1	115	+13349339173	2025-12-29 19:49:49.961022
114	1	116	+17867613406	2025-12-29 19:51:41.261125
115	1	117	+12023165728	2025-12-29 20:56:50.616851
116	1	118	+15185304821	2025-12-30 00:36:41.218119
117	1	119	+13346403936	2025-12-30 14:18:10.449697
118	1	120	+18507267005	2025-12-30 17:04:33.273268
119	1	121	+18506864302	2025-12-30 17:17:13.16086
120	1	122	+14018089180	2025-12-30 17:46:00.992496
121	1	123	+14482042199	2025-12-30 18:09:40.450791
122	1	124	+15024084432	2025-12-30 19:14:09.023808
123	1	125	+13375137936	2025-12-30 19:26:15.454717
124	1	126	+16504763261	2025-12-30 19:40:01.35706
125	1	127	+13214802942	2025-12-30 20:14:03.668959
126	1	128	+19045993292	2025-12-30 20:48:42.103845
127	1	129	+18165990067	2025-12-30 20:53:06.418521
128	1	130	+13344004058	2025-12-30 20:57:10.414722
129	1	131	+12564257395	2025-12-31 01:38:12.705597
130	1	132	+13348068006	2025-12-31 16:29:31.160682
131	1	133	+14482422642	2025-12-31 16:58:47.227142
132	1	134	+18504269573	2025-12-31 19:13:07.541899
133	1	135	+18502916698	2025-12-31 19:13:57.972384
134	1	136	+16054093760	2025-12-31 21:48:11.336748
135	1	137	+15104625109	2025-12-31 23:43:41.838601
136	1	138	+18503754373	2026-01-01 09:08:27.636712
137	1	139	+18503789595	2026-01-01 13:59:14.695741
138	1	140	+16016009139	2026-01-01 21:28:49.626164
139	1	141	+19047262717	2026-01-01 21:39:05.044383
140	1	142	+12253244889	2026-01-01 23:31:27.953086
141	1	143	+15303278247	2026-01-02 05:40:29.523568
142	1	144	+18503480772	2026-01-02 11:33:45.736196
143	1	145	+12564962769	2026-01-02 15:44:18.7433
144	1	146	+12058551654	2026-01-02 16:31:06.092949
145	1	147	+12519797618	2026-01-02 16:50:09.736532
146	1	148	+18504544687	2026-01-02 16:58:07.256776
147	1	149	+18507758418	2026-01-02 17:55:06.521777
148	1	150	+18504473093	2026-01-02 18:09:32.561762
149	1	151	+18508429169	2026-01-02 18:20:31.52766
150	1	152	+13342105270	2026-01-02 19:06:42.412052
151	1	153	+19143390352	2026-01-02 19:16:34.63616
152	1	154	+19294822353	2026-01-02 19:21:18.158087
153	1	155	+13476467710	2026-01-02 19:25:39.048899
154	1	156	+13477458943	2026-01-02 19:29:02.565807
155	1	157	+13476304621	2026-01-02 19:37:36.423627
156	1	158	+19143830532	2026-01-02 19:41:53.32345
157	1	159	+18506939095	2026-01-02 20:16:06.776426
158	1	160	+12055342907	2026-01-02 20:27:49.073066
159	1	161	+18506125509	2026-01-02 20:47:04.376861
160	1	162	+12519797621	2026-01-02 23:43:12.705064
161	1	163	+12059050460	2026-01-03 00:18:07.896325
162	1	164	+13183931924	2026-01-03 05:35:01.643194
163	1	165	+12052397703	2026-01-03 08:24:59.686447
164	1	166	+12564185559	2026-01-03 13:32:53.90016
165	1	167	+12029998395	2026-01-03 16:08:28.880635
166	1	168	+16016106786	2026-01-03 16:32:05.287013
167	1	169	+18503707253	2026-01-03 18:46:43.430583
168	1	170	+16127785627	2026-01-03 22:34:36.292636
169	1	171	+12136714707	2026-01-03 22:47:34.202385
170	1	172	+13606865031	2026-01-04 02:09:30.589456
171	1	173	+12513536703	2026-01-04 02:09:37.464821
172	1	174	+12282157027	2026-01-04 07:32:07.195509
173	1	175	+18037576358	2026-01-04 09:41:49.48517
174	1	176	+19047551324	2026-01-04 13:26:39.605813
175	1	177	+18502618509	2026-01-04 15:05:58.338867
176	1	178	+18502073119	2026-01-04 15:40:07.026665
177	1	179	+12512096454	2026-01-04 17:19:04.643936
178	1	180	+17542653442	2026-01-04 23:57:16.094921
179	1	181	+14793962608	2026-01-05 01:09:30.839547
180	1	182	+18506197406	2026-01-05 01:20:40.952202
181	1	183	+12052185543	2026-01-05 13:37:52.118081
182	1	184	+18662063224	2026-01-05 13:53:15.987559
183	1	185	+18166688801	2026-01-05 15:40:03.243996
184	1	186	+18504652751	2026-01-14 19:26:34.553292
185	1	187	+17857175026	2026-01-14 19:39:55.240259
186	1	188	+13345961247	2026-01-14 19:54:57.343465
187	1	189	+19012192444	2026-01-14 20:49:05.658169
188	1	190	+19724397783	2026-01-14 21:31:42.912356
189	1	191	+14018962541	2026-01-14 22:31:06.750218
190	1	192	+12259994706	2026-01-14 23:25:20.771493
191	1	193	+15752436760	2026-01-15 04:23:11.102304
192	1	194	+18882799485	2026-01-15 15:51:32.031117
193	1	195	+16174484872	2026-01-15 16:17:43.399123
194	1	196	+18502211032	2026-01-15 16:41:58.85228
195	1	197	+18506869369	2026-01-15 16:42:34.889657
196	1	198	+14065422849	2026-01-15 17:40:38.02708
197	1	199	+13379625740	2026-01-15 18:27:05.285704
198	1	200	+12563936021	2026-01-15 18:43:02.742196
199	1	201	+18506969503	2026-01-15 19:13:23.951265
200	1	202	+18506499444	2026-01-15 19:17:55.072285
201	1	203	+13342560204	2026-01-15 20:16:04.845747
202	1	204	+18509101900	2026-01-15 21:01:23.878665
203	1	205	+14023468754	2026-01-15 22:50:44.905012
204	1	206	+17739829338	2026-01-15 23:33:25.913622
205	1	207	+16017239514	2026-01-16 02:01:53.746816
206	1	208	+16624166906	2026-01-16 02:07:28.662217
207	1	209	+13347337142	2026-01-16 14:48:06.123278
208	1	210	+14697542960	2026-01-16 15:17:16.615962
209	1	211	+13479290861	2026-01-16 15:24:52.031863
210	1	212	+12056013668	2026-01-16 15:52:31.808438
211	1	213	+19048646464	2026-01-16 16:39:54.535361
212	1	214	+13186140483	2026-01-16 17:33:06.539509
213	1	215	+18502027429	2026-01-16 19:20:14.738384
214	1	216	+12513889126	2026-01-16 20:49:52.80145
215	1	217	+12512641996	2026-01-17 01:08:53.784744
216	1	218	+13373729594	2026-01-17 15:07:19.689795
217	1	219	+12488958978	2026-01-17 16:46:25.564142
218	1	220	+12564791244	2026-01-17 17:30:20.378217
219	1	221	+16623082880	2026-01-17 17:34:57.270587
220	1	222	+12295314186	2026-01-17 17:43:20.126199
221	1	223	+19043255204	2026-01-17 19:40:24.159208
222	1	224	+12513245519	2026-01-17 21:11:41.628449
223	1	225	+18504950821	2026-01-18 16:07:15.038697
224	1	226	+19124192847	2026-01-18 17:17:33.178258
225	1	227	+15162424545	2026-01-18 17:58:56.043982
226	1	228	+12053530676	2026-01-18 18:21:27.40657
227	1	229	+15183262094	2026-01-18 19:25:35.633766
228	1	230	+16013238883	2026-01-18 19:37:07.120772
229	1	231	+18503416417	2026-01-19 00:27:38.572695
230	1	232	+13195018886	2026-01-19 02:50:26.134856
231	1	233	+18506775106	2026-01-19 14:40:14.327039
232	1	234	+18502880355	2026-01-19 15:03:25.062334
233	1	235	+17162518671	2026-01-19 15:44:01.271275
234	1	236	+12564992530	2026-01-19 16:11:36.890593
235	1	237	+17042441921	2026-01-19 16:39:30.795289
236	1	238	+15753170706	2026-01-19 18:15:32.908572
237	1	239	+14432548580	2026-01-19 18:21:49.36388
238	1	240	+12514019344	2026-01-19 19:47:16.042932
239	1	241	+18502027497	2026-01-19 20:45:46.530664
240	1	242	+18503768866	2026-01-19 21:36:47.239371
241	1	243	+18504661061	2026-01-20 00:43:01.900778
242	1	244	+12259534237	2026-01-20 04:33:03.585119
243	1	245	+19044158265	2026-01-20 13:57:03.208301
244	1	246	+19414687400	2026-01-20 15:27:42.247734
245	1	247	+14077294105	2026-01-20 15:55:46.256984
246	1	248	+18509544214	2026-01-20 15:57:52.177135
247	1	249	+19109162510	2026-01-20 15:58:14.670276
248	1	250	+18882992070	2026-01-20 16:29:36.067743
249	1	251	+19707121763	2026-01-20 17:16:10.922649
250	1	252	+18772020055	2026-01-20 18:23:29.642587
251	1	253	+18663670661	2026-01-20 18:39:28.455628
252	1	254	+12564535332	2026-01-20 18:45:47.47604
253	1	255	+18059048860	2026-01-20 19:21:03.877439
254	1	256	+18503078053	2026-01-20 19:29:23.405602
255	1	257	+12297338027	2026-01-20 19:35:37.241678
256	1	258	+17274188686	2026-01-20 21:35:17.366015
257	1	259	+13169285579	2026-01-21 01:08:54.182325
258	1	260	+18059148032	2026-01-21 02:36:09.007849
259	1	261	+12564961231	2026-01-21 03:28:18.862521
260	1	262	+12255034410	2026-01-21 07:11:16.115797
261	1	263	+13342088867	2026-01-21 14:38:25.249706
262	1	264	+14242065281	2026-01-21 15:29:05.21075
263	1	265	+12145637607	2026-01-21 16:49:15.724607
264	1	266	+16017609901	2026-01-21 17:10:50.12339
265	1	267	+15024092707	2026-01-21 17:38:03.302662
266	1	268	+16628937196	2026-01-21 18:06:56.964444
267	1	269	+19139094967	2026-01-21 18:51:55.623808
268	1	270	+18502027223	2026-01-21 19:16:05.537465
269	1	271	+18505019677	2026-01-21 19:18:45.336993
270	1	272	+13012665177	2026-01-21 19:43:34.83137
271	1	273	+18504498860	2026-01-21 19:49:32.46444
272	1	274	+18509391200	2026-01-21 20:51:41.004527
273	1	275	+14102075050	2026-01-21 21:19:58.988007
274	1	276	+18502818420	2026-01-21 21:28:56.878992
275	1	277	+12055312815	2026-01-21 21:31:57.864022
276	1	278	+18509242826	2026-01-22 00:22:42.444929
277	1	279	+13347142142	2026-01-22 14:33:05.301557
278	1	280	+12052123050	2026-01-22 14:42:36.313009
279	1	281	+12285470800	2026-01-22 15:12:03.619439
280	1	282	+18507239190	2026-01-22 16:23:01.088842
281	1	283	+18509101385	2026-01-22 17:09:22.012167
282	1	284	+16015084590	2026-01-22 18:35:07.538869
283	1	285	+18505298264	2026-01-22 18:52:55.581058
284	1	286	+17155568081	2026-01-22 19:26:31.254909
285	1	287	+19546266636	2026-01-22 20:10:13.73339
286	1	288	+18503761118	2026-01-22 21:30:22.019789
287	1	289	+13242011388	2026-01-23 00:10:58.855211
288	1	290	+13189879026	2026-01-23 04:25:24.869664
289	1	291	+16562261938	2026-01-23 14:57:29.945438
290	1	292	+13054658205	2026-01-23 15:16:15.948409
291	1	293	+18134219623	2026-01-23 15:59:17.820246
292	1	294	+12512002424	2026-01-23 16:12:23.550086
293	1	295	+13477145024	2026-01-23 17:05:51.13386
294	1	296	+13525198382	2026-01-23 20:08:48.364845
295	1	297	+19039307154	2026-01-23 20:44:57.569107
296	1	298	+18503908189	2026-01-23 23:20:54.18312
297	1	299	+17869544197	2026-01-24 03:50:19.809291
298	1	300	+16623177571	2026-01-24 11:56:28.843686
299	1	301	+18432266270	2026-01-24 15:08:45.915836
300	1	302	+18432260607	2026-01-24 15:20:28.201585
301	1	303	+18507758937	2026-01-24 16:53:44.623155
302	1	304	+19254992016	2026-01-24 18:33:02.833279
303	1	305	+18503044069	2026-01-24 20:19:57.823284
304	1	306	+19043330170	2026-01-25 01:02:28.153773
305	1	307	+13344886413	2026-01-25 01:53:44.671871
306	1	308	+13186579910	2026-01-25 07:37:27.539462
307	1	309	+18507125092	2026-01-25 16:03:34.742026
308	1	310	+12563374200	2026-01-25 17:41:53.57248
309	1	311	+18506862588	2026-01-25 20:18:12.661783
310	1	312	+12512365125	2026-01-25 21:31:16.805251
311	1	313	+19712285556	2026-01-25 22:14:22.80227
312	1	314	+17543248262	2026-01-25 22:41:56.758229
313	1	315	+18502256538	2026-01-25 23:00:17.017123
314	1	316	+13347186025	2026-01-26 09:47:27.81837
315	1	317	+18502027503	2026-01-26 14:30:55.956707
316	1	318	+15614539055	2026-01-26 17:18:58.323301
317	1	319	+15028029760	2026-01-26 17:33:06.252415
318	1	320	+13863161012	2026-01-26 18:03:11.936305
319	1	321	+18502075353	2026-01-26 18:52:55.296821
320	1	322	+12055164486	2026-01-26 20:28:34.988192
321	1	323	+14405703111	2026-01-26 21:07:27.615822
322	1	324	+15012760295	2026-01-26 22:49:25.036454
323	1	325	+18502883879	2026-01-27 08:22:49.050709
324	1	326	+19092485589	2026-01-27 15:30:31.391055
325	1	327	+15123689843	2026-01-27 19:06:34.99454
326	1	328	+17286669966	2026-01-27 19:13:58.107788
327	1	329	+15186468254	2026-01-27 19:32:44.478874
328	1	330	+19414477977	2026-01-27 20:19:36.140796
329	1	331	+12512727070	2026-01-27 20:52:21.536265
330	1	332	+13184010440	2026-01-28 16:25:47.38692
331	1	333	+13054627831	2026-01-28 17:06:48.353698
332	1	334	+18504321222	2026-01-28 18:47:41.360553
333	1	335	+18505027710	2026-01-28 19:01:12.643626
334	1	336	+14843505912	2026-01-28 19:09:44.343327
335	1	337	+18505176320	2026-01-28 19:56:53.501158
336	1	338	+19292028280	2026-01-28 21:16:31.925159
337	1	339	+12513770500	2026-01-28 21:26:37.626371
338	1	340	+16014804645	2026-01-28 22:08:45.406897
339	1	341	+19172300631	2026-01-28 23:33:17.62523
340	1	342	+18502027220	2026-01-29 13:08:18.154683
341	1	343	+13375158286	2026-01-29 14:52:21.045677
342	1	344	+13867779628	2026-01-29 15:01:53.233708
343	1	345	+18503465010	2026-01-29 15:40:11.208793
344	1	346	+14433191722	2026-01-29 16:49:54.142511
345	1	347	+12147341020	2026-01-29 17:18:41.981142
346	1	348	+12053883433	2026-01-29 17:32:03.594598
347	1	349	+18016785270	2026-01-29 18:51:29.037731
348	1	350	+18507418004	2026-01-29 19:13:44.113418
349	1	351	+16157082902	2026-01-29 19:52:06.396754
350	1	352	+14482278478	2026-01-29 21:43:05.429992
351	1	353	+18507481316	2026-01-30 00:33:11.125698
352	1	354	+12055792159	2026-01-30 04:37:49.213547
353	1	355	+19149666095	2026-01-30 13:54:02.78485
354	1	356	+12144996202	2026-01-30 15:07:40.510455
355	1	357	+12563888350	2026-01-30 15:18:23.472556
356	1	358	+18136387582	2026-01-30 18:54:30.336063
357	1	359	+18502027340	2026-01-30 20:03:50.297286
358	1	360	+18504504105	2026-01-31 01:23:32.220101
359	1	361	+14052894981	2026-01-31 04:36:28.485472
360	1	362	+12516541007	2026-01-31 12:31:32.588332
361	1	363	+18137433565	2026-01-31 14:33:46.613345
362	1	364	+19857144835	2026-01-31 15:18:10.133211
363	1	365	+15015998788	2026-01-31 20:32:48.7221
364	1	366	+18503982932	2026-01-31 20:44:15.167724
365	1	367	+14482390410	2026-01-31 20:56:35.045732
366	1	368	+18503980982	2026-02-01 23:33:03.634933
367	1	369	+12254595837	2026-02-01 23:50:12.927475
368	1	370	+16592438153	2026-02-02 13:29:12.718952
369	1	371	+18505868596	2026-02-02 14:44:42.558175
370	1	372	+16014021940	2026-02-02 15:50:48.012967
371	1	373	+18503747167	2026-02-02 16:01:58.680622
372	1	374	+12058024210	2026-02-02 17:22:23.992402
373	1	375	+14125614290	2026-02-02 17:46:25.667702
374	1	376	+17185752000	2026-02-02 17:52:29.352517
375	1	377	+18503821102	2026-02-02 18:33:26.109146
376	1	378	+18006696777	2026-02-02 18:43:29.66532
377	1	379	+16157915440	2026-02-02 20:02:41.736586
378	1	380	+16153206772	2026-02-02 20:13:50.589378
379	1	381	+14074188295	2026-02-02 20:18:05.755944
380	1	382	+19082817800	2026-02-02 20:19:34.784994
381	1	383	+18504494862	2026-02-02 20:45:41.955992
382	1	384	+12515102510	2026-02-02 21:01:09.361331
383	1	385	+16019428748	2026-02-02 22:45:08.223011
384	1	386	+17023307907	2026-02-02 23:54:16.920794
\.


--
-- Data for Name: inquiry_stage_status; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inquiry_stage_status (id, company_id, inquiry_id, stage_name, status, stage_data, completed_at, completed_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.login_attempts (id, email, user_id, success, failure_reason, ip_address, user_agent, two_factor_method, two_factor_success, created_at) FROM stdin;
1	austinb@gulfbreezerecovery.com	\N	no	User not found	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 19:11:59.146942
2	austinb@gulfbreezerecovery.com	\N	no	User not found	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 19:12:06.830642
3	austinb@gulfbreezerecovery.com	\N	no	User not found	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 19:12:25.929934
4	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1 Ddg/18.6	\N	\N	2025-12-15 21:15:56.462601
5	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:40:37.124255
6	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:40:43.997237
7	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:40:51.177154
8	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:41:11.009443
9	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:41:12.518256
10	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:41:46.833559
11	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:48:40.221765
12	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:50:18.387693
13	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:50:19.426251
14	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:50:23.529053
15	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:54:08.521788
16	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 21:54:09.385662
17	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-15 21:56:58.554255
18	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-15 22:19:09.472975
19	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 00:13:46.232746
20	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 00:13:57.656028
21	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-16 00:28:20.233505
22	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:49:59.525591
23	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 01:50:45.137316
24	austinb@gulfbreezerecovery.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:51:12.63992
25	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:51:38.162352
26	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:51:39.35235
27	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:51:40.570279
28	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 01:52:14.359746
29	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	2025-12-16 01:52:49.316311
30	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:53:26.416968
31	austinb@gulfbreezerecovery.com	\N	no	User not found	34.138.180.204	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36	\N	\N	2025-12-16 01:53:49.27003
32	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:48.327653
33	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:48.529472
34	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:48.71905
35	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:48.912167
36	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:49.078136
37	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:49.27216
38	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:49.469756
39	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:49.669154
40	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:49.867864
41	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:50.053978
42	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:50.22497
43	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:50.464815
44	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:50.650511
45	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:50.835696
46	test@test.com	\N	no	User not found	34.138.180.204	curl/8.14.1	\N	\N	2025-12-16 01:54:51.000369
47	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 01:59:15.908142
48	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:00:22.337461
49	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:00:30.6321
50	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:01:29.820234
51	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:01:31.816895
52	austinb@gulfbreezerecovery.com	\N	no	User not found	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:01:45.802151
53	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:25:23.297875
54	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:30:48.202064
55	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:33:14.270481
56	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 02:33:57.847531
57	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-16 12:50:32.105137
58	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.70.178	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-16 16:46:07.739011
59	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-16 18:24:03.696964
60	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.66.61	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-17 13:24:17.141475
61	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-19 15:41:16.486185
62	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-19 15:41:28.03304
63	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-19 15:41:48.861961
64	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-19 16:35:19.670375
65	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-19 16:42:28.912532
66	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.70.83	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-19 19:27:19.336427
67	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-20 02:20:23.652606
68	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-20 15:40:39.570797
69	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.64.255	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-20 16:25:46.292833
70	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.64.5	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-20 17:41:37.273818
71	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.65.111	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-20 18:14:59.004481
72	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-20 18:40:43.319086
73	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.65.95	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-20 19:19:48.950504
74	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-21 22:31:30.988237
75	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-21 23:06:48.274844
76	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-21 23:06:54.23678
77	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-22 00:09:07.18025
78	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-12-22 00:09:14.68999
79	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	\N	2025-12-22 19:59:21.1067
80	austinb@gulfbreezerecovery.comv	\N	no	User not found	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	2025-12-22 20:43:06.474462
81	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	2025-12-22 20:43:16.770138
82	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	2025-12-22 20:43:26.457008
83	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.66.115	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-23 16:37:16.943203
84	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.68.25	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-23 17:08:08.950934
85	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.68.181	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-23 17:45:27.800929
86	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.67.15	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-23 22:48:32.373214
87	ivonnem@gulfbreezerecovery.com	b0eec3a3-6090-4239-ac31-337606e41eb3	yes	\N	172.59.67.15	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-23 22:50:07.09163
88	austinb@gulfbreezerecovery.com	51375099	no	Invalid password	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	\N	2025-12-26 17:47:56.99476
89	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	\N	2025-12-26 17:48:04.41238
90	ivonnem@gulfbreezerecovery.com	b0eec3a3-6090-4239-ac31-337606e41eb3	yes	\N	141.224.132.10	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	\N	2025-12-27 15:52:26.387351
91	austinb@gulfbreezerecovery.com	51375099	yes	\N	46.110.208.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-27 17:31:17.447475
92	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.71.193	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2025-12-27 22:13:46.269043
93	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	2026-01-14 18:55:33.051403
94	austinb@gulfbreezerecovery.com	51375099	yes	\N	98.192.133.129	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	\N	\N	2026-01-16 16:03:35.108111
95	austinb@gulfbreezerecovery.com	51375099	yes	\N	172.59.64.95	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	\N	\N	2026-01-26 14:48:22.619402
\.


--
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notification_settings (id, stage_name, email_addresses, enabled, created_at, updated_at, company_id) FROM stdin;
1	lost	austinb@gulfbreezerecovery.com	yes	2025-12-19 16:43:07.219242	2025-12-19 16:43:07.219242	1
2	non_viable	austinb@gulfbreezerecovery.com	yes	2025-12-19 16:43:14.1972	2025-12-19 16:43:14.1972	1
3	admitted	austinb@gulfbreezerecovery.com	yes	2025-12-19 16:43:18.017827	2025-12-19 16:43:18.017827	1
4	scheduled	austinb@gulfbreezerecovery.com	yes	2025-12-19 16:43:21.556415	2025-12-19 16:43:21.556415	1
5	vob_pending	austinb@gulfbreezerecovery.com	yes	2025-12-19 16:43:25.49386	2025-12-19 16:43:25.49386	1
\.


--
-- Data for Name: nursing_assessment_forms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.nursing_assessment_forms (id, inquiry_id, form_data, is_complete, completed_at, completed_by, created_at, updated_at, company_id) FROM stdin;
\.


--
-- Data for Name: password_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_history (id, user_id, password_hash, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_reset_tokens (id, user_id, email, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: pre_cert_forms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pre_cert_forms (id, inquiry_id, form_data, is_complete, completed_at, completed_by, created_at, updated_at, company_id) FROM stdin;
1	19	{"allergies": "Tylenol ", "legalIssues": "Was in an accident and was T boned. Cops were there and followed her to hospital. She was intoxicated so they said a warrant will come out. It hasn’t yet. ", "medications": "Cingular for asthma ", "familyHistory": "Grandparents heavy drinkers ", "additionalNotes": "", "withdrawalNotes": "", "substanceHistory": [{"route": "Oral", "amount": "6 drinks and two shots ", "method": "", "lastUsed": "12/12/2025", "firstUsed": "12/1/2004", "frequency": "Daily", "substance": "Alcohol "}, {"route": "Nasal", "amount": "1 gram", "method": "", "lastUsed": "11/20/2025", "firstUsed": "12/1/2004", "frequency": "Daily", "substance": "Cocaine"}], "suicidalIdeation": "none", "treatmentHistory": "Transferring from River View in Tampa. Needs higher level of clinical care and smaller census. Panic attacks from facility size. ", "homicidalIdeation": "none", "medicalConditions": "Asthma  ", "psychosocialNotes": "Unemployed. Left job as accountant in construction to get help two weeks ago. ", "severityOfIllness": "severe", "withdrawalSymptoms": ["Tremors", "Anxiety", "Sweating", "Nausea/Vomiting"], "mentalHealthHistory": "Went to ER for panic attack month ago "}	no	\N	\N	2025-12-20 16:00:19.301289	2025-12-20 16:04:24.017	1
\.


--
-- Data for Name: pre_screening_forms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pre_screening_forms (id, inquiry_id, form_data, is_complete, completed_at, completed_by, created_at, updated_at, company_id) FROM stdin;
1	19	{"barriers": "None. She is now unemployed so no barrier. ", "lastUseDate": "2025-12-12", "legalDetails": "Was in a car accident intoxicated. She was T- Boned and taken to the hospital. At the hospital she was told by police a warrant would be put out for her arrest. Nothing has happened yet. ", "referralOther": "", "hasLegalIssues": "yes", "referralSource": ["Self", "Online Search"], "screeningNotes": "", "motivationLevel": "high", "primarySubstance": "Alcohol ", "hasPendingCharges": "yes", "isProbationParole": "no", "previousTreatment": "Just AA meetings but couldn’t stay sober ", "currentMedications": "", "levelOfCareInterest": ["Residential"], "recommendationNotes": "", "substanceUseHistory": "6 drinks and multiple shots daily.", "hasRegisteredOffenses": "no", "mentalHealthDiagnoses": "None ", "programRecommendation": "residential", "psychiatricHospitalizations": "Went to ER for panic attack one month ago. "}	no	\N	\N	2025-12-20 17:43:32.15905	2025-12-20 17:48:38.809	1
\.


--
-- Data for Name: referral_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.referral_accounts (id, name, type, address, phone, website, notes, assigned_bd_rep_id, created_by, created_at, updated_at, company_id) FROM stdin;
1	Tallahassee Memorial Hospital	hospital	Tallahassee FL	850.431.1155	https://www.tmh.org/		51375099	51375099	2025-12-16 12:54:08.061907	2025-12-16 12:54:08.061907	1
2	Ascension Sacred Heart Pensacola 	hospital		(850) 416-7000			b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 15:54:58.855221	2025-12-27 15:54:58.855221	1
3	Anchor Clinic 	private_practice	890 S Palafox St, Pensacola, FL 32502	(850) 433-1656		 behavioral medicine clinic 	b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 15:57:22.46607	2025-12-27 15:57:22.46607	1
4	CDAC Behavioral Healthcare	community	3804 N 9th Ave, Pensacola, FL 32503				b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 15:58:06.189117	2025-12-27 15:58:06.189117	1
5	Baptist Behavioral Health Unit	hospital	305 Corday St, Pensacola, FL 32503				b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:05:30.395027	2025-12-27 16:05:30.395027	1
6	Lakeview Center - Adult Outpatient Psychiatry	hospital	1221 W. Lakeview Ave. Pensacola, FL 32501				b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:09:44.594785	2025-12-27 16:09:44.594785	1
7	Lakeview DUI Program 	community	1900 North Palafox St. Pensacola, FL				b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:10:51.670926	2025-12-27 16:11:02.884	1
8	Apex Psychiatric Services	private_practice	308 S Jefferson St, Pensacola, FL 32502	(850) 807-0138			b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:12:24.613205	2025-12-27 16:12:24.613205	1
9	STABLE Mental Health	private_practice	101 E Brainerd St Ste. B, Pensacola, FL 32501	(850) 332-3205			b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:13:50.077221	2025-12-27 16:13:50.077221	1
10	Psychological Associates	private_practice	1120 N Palafox St, Pensacola, FL 32501	(850) 332-3205			b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:17:02.237104	2025-12-27 16:17:02.237104	1
11	Banyan Gulf Breeze	residential_facility	1830 Hickory Shores Rd, Gulf Breeze, FL 32563	(850) 605-3295			b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:19:04.063785	2025-12-27 16:19:04.063785	1
12	Naval Hospital Pensacola – Mental Health & SARP	hospital	6000 W Highway 98 Pensacola, FL 32512	(850) 505-6000			b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:20:54.80802	2025-12-27 16:20:54.80802	1
13	Innovative Direction – Counseling & Psychiatry	private_practice					b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:21:28.115112	2025-12-27 16:21:28.115112	1
14	Gulf Coast Therapy Group	private_practice	905 N Navy Blvd, Pensacola, FL 32507				b0eec3a3-6090-4239-ac31-337606e41eb3	b0eec3a3-6090-4239-ac31-337606e41eb3	2025-12-27 16:25:46.592131	2025-12-27 16:25:46.592131	1
\.


--
-- Data for Name: referral_contacts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.referral_contacts (id, account_id, name, "position", phone, email, notes, created_at, company_id) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
DSEBz82ZUqG_Jr5aq2bCNpKkJrHGe15t	{"cookie": {"path": "/", "secure": true, "expires": "2026-01-26T15:04:38.259Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 900000}, "userId": "51375099", "authenticated": true}	2026-01-26 15:04:39
\.


--
-- Data for Name: stage_edit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stage_edit_logs (id, company_id, inquiry_id, stage_name, user_id, action, changed_fields, edited_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at, company_id, role, is_active, password_hash, password_changed_at, password_expires_at, must_change_password, totp_secret, totp_enabled, sms_phone_number, sms_2fa_enabled, two_factor_setup_complete, failed_login_attempts, locked_at, locked_reason, locked_by, last_login_at, last_activity_at) FROM stdin;
b0eec3a3-6090-4239-ac31-337606e41eb3	ivonnem@gulfbreezerecovery.com	Ivonne	M.	\N	2025-12-23 22:49:36.090733	2025-12-27 15:52:26.348	1	admissions	yes	$argon2id$v=19$m=65536,t=3,p=4$qgFwDxOgoJn2fmptqOldsA$O5KSEolCY3Fozxjx0IQPaepXDkvgBdpd2NHki/9ZpI8	2025-12-23 22:49:36.077	2026-03-23 22:49:36.077	yes	\N	no	\N	no	no	0	\N	\N	\N	2025-12-27 15:52:26.348	2025-12-27 16:25:47.299
51375099	austinb@gulfbreezerecovery.com	Austin	Berry	\N	2025-12-16 02:32:13.53509	2026-01-26 14:48:22.58	1	admin	yes	$argon2id$v=19$m=65536,t=3,p=4$ao464GNUNfMfPJ0hu126vQ$ikUz5YQtvrc+13Dx4ZkbbW0cNDVMU7jNkbujTAiiGWc	\N	\N	no	\N	no	\N	no	no	0	\N	\N	\N	2026-01-26 14:48:22.58	2026-01-26 14:49:33.265
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 3, true);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 91, true);


--
-- Name: billing_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.billing_accounts_id_seq', 1, true);


--
-- Name: billing_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.billing_events_id_seq', 1, false);


--
-- Name: billing_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.billing_invoices_id_seq', 1, false);


--
-- Name: call_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.call_logs_id_seq', 519, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.companies_id_seq', 1, true);


--
-- Name: contact_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contact_submissions_id_seq', 1, false);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 386, true);


--
-- Name: inquiry_phone_map_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inquiry_phone_map_id_seq', 384, true);


--
-- Name: inquiry_stage_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inquiry_stage_status_id_seq', 1, false);


--
-- Name: login_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.login_attempts_id_seq', 95, true);


--
-- Name: notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notification_settings_id_seq', 5, true);


--
-- Name: nursing_assessment_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.nursing_assessment_forms_id_seq', 1, false);


--
-- Name: password_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.password_history_id_seq', 1, false);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: pre_cert_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pre_cert_forms_id_seq', 42, true);


--
-- Name: pre_screening_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pre_screening_forms_id_seq', 32, true);


--
-- Name: referral_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.referral_accounts_id_seq', 14, true);


--
-- Name: referral_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.referral_contacts_id_seq', 1, false);


--
-- Name: stage_edit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stage_edit_logs_id_seq', 1, false);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_accounts billing_accounts_company_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_accounts
    ADD CONSTRAINT billing_accounts_company_id_unique UNIQUE (company_id);


--
-- Name: billing_accounts billing_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_accounts
    ADD CONSTRAINT billing_accounts_pkey PRIMARY KEY (id);


--
-- Name: billing_events billing_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_events
    ADD CONSTRAINT billing_events_pkey PRIMARY KEY (id);


--
-- Name: billing_invoices billing_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_pkey PRIMARY KEY (id);


--
-- Name: call_logs call_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT call_logs_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contact_submissions contact_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: inquiry_phone_map inquiry_phone_map_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_phone_map
    ADD CONSTRAINT inquiry_phone_map_pkey PRIMARY KEY (id);


--
-- Name: inquiry_stage_status inquiry_stage_status_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_stage_status
    ADD CONSTRAINT inquiry_stage_status_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: nursing_assessment_forms nursing_assessment_forms_inquiry_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nursing_assessment_forms
    ADD CONSTRAINT nursing_assessment_forms_inquiry_id_unique UNIQUE (inquiry_id);


--
-- Name: nursing_assessment_forms nursing_assessment_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nursing_assessment_forms
    ADD CONSTRAINT nursing_assessment_forms_pkey PRIMARY KEY (id);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: pre_cert_forms pre_cert_forms_inquiry_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_cert_forms
    ADD CONSTRAINT pre_cert_forms_inquiry_id_unique UNIQUE (inquiry_id);


--
-- Name: pre_cert_forms pre_cert_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_cert_forms
    ADD CONSTRAINT pre_cert_forms_pkey PRIMARY KEY (id);


--
-- Name: pre_screening_forms pre_screening_forms_inquiry_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_screening_forms
    ADD CONSTRAINT pre_screening_forms_inquiry_id_unique UNIQUE (inquiry_id);


--
-- Name: pre_screening_forms pre_screening_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_screening_forms
    ADD CONSTRAINT pre_screening_forms_pkey PRIMARY KEY (id);


--
-- Name: referral_accounts referral_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_accounts
    ADD CONSTRAINT referral_accounts_pkey PRIMARY KEY (id);


--
-- Name: referral_contacts referral_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_contacts
    ADD CONSTRAINT referral_contacts_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: stage_edit_logs stage_edit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stage_edit_logs
    ADD CONSTRAINT stage_edit_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: IDX_audit_company; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_audit_company" ON public.audit_logs USING btree (company_id);


--
-- Name: IDX_audit_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_audit_created" ON public.audit_logs USING btree (created_at);


--
-- Name: IDX_audit_resource; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_audit_resource" ON public.audit_logs USING btree (resource_type, resource_id);


--
-- Name: IDX_audit_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_audit_user" ON public.audit_logs USING btree (user_id);


--
-- Name: IDX_billing_company; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_billing_company" ON public.billing_accounts USING btree (company_id);


--
-- Name: IDX_billing_event_company; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_billing_event_company" ON public.billing_events USING btree (company_id);


--
-- Name: IDX_billing_event_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_billing_event_created" ON public.billing_events USING btree (created_at);


--
-- Name: IDX_billing_event_transaction; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_billing_event_transaction" ON public.billing_events USING btree (authnet_transaction_id);


--
-- Name: IDX_billing_event_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_billing_event_type" ON public.billing_events USING btree (event_type);


--
-- Name: IDX_billing_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_billing_status" ON public.billing_accounts USING btree (status);


--
-- Name: IDX_call_logs_ctm; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_call_logs_ctm" ON public.call_logs USING btree (ctm_call_id);


--
-- Name: IDX_call_logs_inquiry; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_call_logs_inquiry" ON public.call_logs USING btree (inquiry_id);


--
-- Name: IDX_call_logs_phone; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_call_logs_phone" ON public.call_logs USING btree (phone_e164);


--
-- Name: IDX_contact_submission_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_contact_submission_created" ON public.contact_submissions USING btree (created_at);


--
-- Name: IDX_contact_submission_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_contact_submission_status" ON public.contact_submissions USING btree (status);


--
-- Name: IDX_invoice_billing_account; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_invoice_billing_account" ON public.billing_invoices USING btree (billing_account_id);


--
-- Name: IDX_invoice_company; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_invoice_company" ON public.billing_invoices USING btree (company_id);


--
-- Name: IDX_invoice_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_invoice_created" ON public.billing_invoices USING btree (created_at);


--
-- Name: IDX_invoice_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_invoice_status" ON public.billing_invoices USING btree (status);


--
-- Name: IDX_login_attempts_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_login_attempts_created" ON public.login_attempts USING btree (created_at);


--
-- Name: IDX_login_attempts_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_login_attempts_email" ON public.login_attempts USING btree (email);


--
-- Name: IDX_password_history_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_password_history_user" ON public.password_history USING btree (user_id);


--
-- Name: IDX_password_reset_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_password_reset_email" ON public.password_reset_tokens USING btree (email);


--
-- Name: IDX_password_reset_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_password_reset_token" ON public.password_reset_tokens USING btree (token);


--
-- Name: IDX_phone_map_inquiry; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_phone_map_inquiry" ON public.inquiry_phone_map USING btree (inquiry_id);


--
-- Name: IDX_phone_map_phone; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_phone_map_phone" ON public.inquiry_phone_map USING btree (phone_e164);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: IDX_stage_edit_inquiry; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_stage_edit_inquiry" ON public.stage_edit_logs USING btree (inquiry_id);


--
-- Name: IDX_stage_edit_time; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_stage_edit_time" ON public.stage_edit_logs USING btree (edited_at);


--
-- Name: IDX_stage_edit_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_stage_edit_user" ON public.stage_edit_logs USING btree (user_id);


--
-- Name: IDX_stage_status_inquiry; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_stage_status_inquiry" ON public.inquiry_stage_status USING btree (inquiry_id);


--
-- Name: IDX_stage_status_stage; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_stage_status_stage" ON public.inquiry_stage_status USING btree (stage_name);


--
-- Name: activity_logs activity_logs_account_id_referral_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_account_id_referral_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.referral_accounts(id);


--
-- Name: activity_logs activity_logs_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: activity_logs activity_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: billing_accounts billing_accounts_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_accounts
    ADD CONSTRAINT billing_accounts_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: billing_events billing_events_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_events
    ADD CONSTRAINT billing_events_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: billing_invoices billing_invoices_billing_account_id_billing_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_billing_account_id_billing_accounts_id_fk FOREIGN KEY (billing_account_id) REFERENCES public.billing_accounts(id);


--
-- Name: billing_invoices billing_invoices_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: call_logs call_logs_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT call_logs_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: call_logs call_logs_inquiry_id_inquiries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_logs
    ADD CONSTRAINT call_logs_inquiry_id_inquiries_id_fk FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: contact_submissions contact_submissions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inquiries inquiries_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inquiries inquiries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inquiry_phone_map inquiry_phone_map_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_phone_map
    ADD CONSTRAINT inquiry_phone_map_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inquiry_phone_map inquiry_phone_map_inquiry_id_inquiries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_phone_map
    ADD CONSTRAINT inquiry_phone_map_inquiry_id_inquiries_id_fk FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: inquiry_stage_status inquiry_stage_status_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_stage_status
    ADD CONSTRAINT inquiry_stage_status_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inquiry_stage_status inquiry_stage_status_completed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_stage_status
    ADD CONSTRAINT inquiry_stage_status_completed_by_users_id_fk FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: inquiry_stage_status inquiry_stage_status_inquiry_id_inquiries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inquiry_stage_status
    ADD CONSTRAINT inquiry_stage_status_inquiry_id_inquiries_id_fk FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: notification_settings notification_settings_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: nursing_assessment_forms nursing_assessment_forms_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nursing_assessment_forms
    ADD CONSTRAINT nursing_assessment_forms_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: nursing_assessment_forms nursing_assessment_forms_completed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nursing_assessment_forms
    ADD CONSTRAINT nursing_assessment_forms_completed_by_users_id_fk FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: nursing_assessment_forms nursing_assessment_forms_inquiry_id_inquiries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nursing_assessment_forms
    ADD CONSTRAINT nursing_assessment_forms_inquiry_id_inquiries_id_fk FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: password_history password_history_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pre_cert_forms pre_cert_forms_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_cert_forms
    ADD CONSTRAINT pre_cert_forms_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pre_cert_forms pre_cert_forms_completed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_cert_forms
    ADD CONSTRAINT pre_cert_forms_completed_by_users_id_fk FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: pre_cert_forms pre_cert_forms_inquiry_id_inquiries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_cert_forms
    ADD CONSTRAINT pre_cert_forms_inquiry_id_inquiries_id_fk FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: pre_screening_forms pre_screening_forms_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_screening_forms
    ADD CONSTRAINT pre_screening_forms_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pre_screening_forms pre_screening_forms_completed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_screening_forms
    ADD CONSTRAINT pre_screening_forms_completed_by_users_id_fk FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: pre_screening_forms pre_screening_forms_inquiry_id_inquiries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pre_screening_forms
    ADD CONSTRAINT pre_screening_forms_inquiry_id_inquiries_id_fk FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: referral_accounts referral_accounts_assigned_bd_rep_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_accounts
    ADD CONSTRAINT referral_accounts_assigned_bd_rep_id_users_id_fk FOREIGN KEY (assigned_bd_rep_id) REFERENCES public.users(id);


--
-- Name: referral_accounts referral_accounts_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_accounts
    ADD CONSTRAINT referral_accounts_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: referral_accounts referral_accounts_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_accounts
    ADD CONSTRAINT referral_accounts_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: referral_contacts referral_contacts_account_id_referral_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_contacts
    ADD CONSTRAINT referral_contacts_account_id_referral_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.referral_accounts(id);


--
-- Name: referral_contacts referral_contacts_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referral_contacts
    ADD CONSTRAINT referral_contacts_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: stage_edit_logs stage_edit_logs_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stage_edit_logs
    ADD CONSTRAINT stage_edit_logs_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: stage_edit_logs stage_edit_logs_inquiry_id_inquiries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stage_edit_logs
    ADD CONSTRAINT stage_edit_logs_inquiry_id_inquiries_id_fk FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: stage_edit_logs stage_edit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stage_edit_logs
    ADD CONSTRAINT stage_edit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict mQhYbwcviusqqP3To1BhrdItE8hqBT8qZYxH6D6mN47wkXhpet6ub7r9UpwiL91

