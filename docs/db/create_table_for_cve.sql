CREATE TABLE public.cve_raw_sources (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	cve_id varchar(20) NOT NULL,
	"source" varchar(50) NOT NULL,
	raw_payload jsonb NOT NULL,
	source_published_at timestamptz NULL,
	source_modified_at timestamptz NULL,
	fetched_at timestamptz NOT NULL DEFAULT now(),
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT "UQ_93978338b504f250fe0d5957621" UNIQUE (cve_id, source, source_modified_at),
	CONSTRAINT cve_raw_sources_pkey PRIMARY KEY (id)
);

CREATE TABLE public.cve_canonical (
	cve_id varchar(20) NOT NULL,
	published_at timestamptz NOT NULL,
	last_modified_at timestamptz NOT NULL,
	severity varchar(10) NULL,
	cvss_version varchar(5) NULL,
	cvss_score numeric(3, 1) NULL,
	cvss_vector text NULL,
	vuln_status varchar(30) NULL,
	source_identifier text NULL,
	normalized_at timestamptz NOT NULL DEFAULT now(),
	normalizer_version varchar(20) NULL,
	CONSTRAINT cve_canonical_pkey PRIMARY KEY (cve_id)
);

CREATE TABLE public.cve_cvss (
	id bigserial NOT NULL,
	cve_id varchar(20) NOT NULL,
	"version" varchar(5) NOT NULL,
	base_score numeric(3, 1) NOT NULL,
	severity varchar(10) NULL,
	vector text NULL,
	"source" text NULL,
	is_primary bool NOT NULL DEFAULT false,
	CONSTRAINT cve_cvss_cve_id_version_source_key UNIQUE (cve_id, version, source),
	CONSTRAINT cve_cvss_pkey PRIMARY KEY (id),
	CONSTRAINT cve_cvss_cve_id_fkey FOREIGN KEY (cve_id) REFERENCES public.cve_canonical(cve_id) ON DELETE CASCADE
);

CREATE TABLE public.cve_description (
	id bigserial NOT NULL,
	cve_id varchar(20) NOT NULL,
	lang varchar(10) NOT NULL,
	"content" text NOT NULL,
	"source" text NULL,
	is_primary bool NOT NULL DEFAULT false,
	CONSTRAINT cve_description_cve_id_lang_key UNIQUE (cve_id, lang),
	CONSTRAINT cve_description_pkey PRIMARY KEY (id),
	CONSTRAINT cve_description_cve_id_fkey FOREIGN KEY (cve_id) REFERENCES public.cve_canonical(cve_id) ON DELETE CASCADE
);

CREATE TABLE public.cve_reference (
	id bigserial NOT NULL,
	cve_id varchar(20) NOT NULL,
	url text NOT NULL,
	"source" text NULL,
	CONSTRAINT cve_reference_cve_id_url_key UNIQUE (cve_id, url),
	CONSTRAINT cve_reference_pkey PRIMARY KEY (id),
	CONSTRAINT cve_reference_cve_id_fkey FOREIGN KEY (cve_id) REFERENCES public.cve_canonical(cve_id) ON DELETE CASCADE
);

CREATE TABLE public.cve_weakness (
	id bigserial NOT NULL,
	cve_id varchar(20) NOT NULL,
	cwe_id varchar(20) NOT NULL,
	"source" text NULL,
	CONSTRAINT cve_weakness_cve_id_cwe_id_key UNIQUE (cve_id, cwe_id),
	CONSTRAINT cve_weakness_pkey PRIMARY KEY (id),
	CONSTRAINT cve_weakness_cve_id_fkey FOREIGN KEY (cve_id) REFERENCES public.cve_canonical(cve_id) ON DELETE CASCADE
);
