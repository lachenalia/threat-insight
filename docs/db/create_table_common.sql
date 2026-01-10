CREATE TABLE public.threat_source_fetch_state (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	"source" varchar(50) NOT NULL,
	resource_type varchar(50) NOT NULL,
	fetch_strategy varchar(50) NOT NULL,
	last_processed_source_at timestamptz NULL,
	last_attempted_fetch_at timestamptz NULL,
	last_cursor text NULL,
	safety_window text NULL,
	status varchar(20) NOT NULL DEFAULT 'idle'::character varying,
	error_message text NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT threat_source_fetch_state_pkey PRIMARY KEY (id)
);

CREATE TABLE public.normalization_state (
	id bigserial NOT NULL,
	"domain" varchar(50) NOT NULL,
	"source" varchar(100) NOT NULL,
	last_processed_raw_id varchar NULL,
	last_processed_modified_at timestamptz NULL,
	last_run_at timestamptz NULL,
	last_success_at timestamptz NULL,
	normalizer_version varchar(20) NOT NULL,
	"mode" varchar(20) NOT NULL DEFAULT 'incremental'::character varying,
	status varchar(20) NOT NULL DEFAULT 'idle'::character varying,
	error_message text NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT "PK_9adeddcfd786fd2ba12cdbf237b" PRIMARY KEY (id),
	CONSTRAINT "UQ_b60117a3e248d5266001c179ff5" UNIQUE (domain, source)
);
