# CVE pipeline operation

## Configuration and API changes

See `.env.example`. `CVE_JOBS_ENABLED=false` disables automatic startup and cron
jobs; it does not disable the separately authenticated administrative endpoint.
The flag defaults to enabled when absent, preserving existing behavior.
Cron expressions use the process timezone; no timezone change is included here.

`POST /cve/normalization` now requires `x-admin-api-key` matching `ADMIN_API_KEY`.
Missing/incorrect credentials return 401. An unconfigured key disables the
endpoint with 503. Swagger at `/api` describes this header. Set the secret
through your deployment environment; never put a real key in source control.
Serve the API over HTTPS in deployment.

Requests accept an optional CVE ID, integer year, ISO date strings, and a real
JSON boolean for `incremental`. Invalid/null values and unknown fields return 400. A CVE ID cannot be combined with year/date filters; year and date filters
are applied together. The start date cannot be later than the end date.
Filters select latest source revisions; they do not restore historical canonical
snapshots. A currently running pipeline job returns 409 to administrative calls.

## Correctness and versioning

Normalizer version `0.2.0` reprocesses existing rows. Removed CVSS summaries and
optional source/status metadata are explicitly cleared to null. Payload IDs must
match the raw record, and source dates must be valid; dates are no longer
invented from the current time. Late-arriving older revisions cannot overwrite
the latest canonical snapshot. The original raw records remain append-only.

## Collection and retry

Every incremental collection window has a fixed start/end, shared across all
pages and retries. Gaps longer than 120 days are split into adjacent windows.
The previous successful checkpoint is overlapped by the stored `safety_window`
(default one hour). Requests have a 30-second timeout and at most three attempts.
Transient network failures, HTTP 408/429 and 5xx are retried; 4xx authentication
failures are not. Spacing is 6.5 seconds without an NVD key and 650 ms with one.
Retry-After seconds and HTTP dates are respected for in-process waits up to one
minute; longer requests fail the job for a later scheduled attempt rather than
retrying early. Upstream request errors are sanitized to avoid logging API keys.

`threat_source_fetch_state.last_cursor` stores the unfinished window as JSON.
The successful watermark advances only after the whole window completes,
including valid empty windows. An unexpectedly empty intermediate page is an
error. After failure, the next run replays that fixed window from page zero;
raw uniqueness prevents duplicates. A full initial import is also replayed from
page zero after failure. This deliberately trades repeated requests for safer
recovery when upstream page contents change. Initial full imports do not use an
upstream snapshot; later incremental overlapping windows reconcile changes.
Do not manually edit or clear the checkpoint without investigating the failure.

## Coordination and recovery

Full/incremental fetch, startup normalization, cron normalization and manual
normalization share a PostgreSQL session advisory lock per schema. A dedicated
connection holds the lock through the entire job, including network requests;
all application instances must use the same DB/schema. Use direct PostgreSQL
connections or session pooling, not transaction-mode pooling. The connection
pool needs capacity for the lock connection plus query/transaction connections.
Scheduled jobs skip a busy pipeline; manual requests receive 409. Completion or
failure releases the lock, and PostgreSQL releases it when the session ends.
A stale running status after a process crash does not block future attempts.

Collection failures are recorded in `threat_source_fetch_state`; normalization
failures are recorded in `normalization_state`. Inspect their status, error and
last-success/checkpoint fields. Previously committed normalization batches stay
saved when a later batch fails. Correct the normalizer or upstream data and
rerun incrementally; failed-record quarantine is a separate follow-up task.

Production DB migrations (`synchronize: true` is still the existing setting),
monitoring/alerts, job queues, and actual full-dataset load testing remain
separate deployment tasks. This change does not deploy or modify an operating DB.
