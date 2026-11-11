# CVE pipeline verification

Install dependencies and run the unit tests and build:

```sh
npm ci
npm test -- --runInBand
npm run build
```

The PostgreSQL integration suite requires an explicitly supplied
`TEST_DATABASE_URL`. It never uses the application's `DATABASE_URL`.
Use a disposable local database, for example:

```sh
docker run -d --name threat-insight-test-db \
  -e POSTGRES_PASSWORD=local-test-only \
  -e POSTGRES_DB=threat_insight_test \
  -p 127.0.0.1:55432:5432 postgres:16-alpine
# Wait until pg_isready reports that PostgreSQL accepts connections.
docker exec threat-insight-test-db pg_isready -U postgres -d threat_insight_test
TEST_DATABASE_URL=postgresql://postgres:local-test-only@127.0.0.1:55432/threat_insight_test npm run test:integration
docker rm -f threat-insight-test-db
```

Each run creates a uniquely named schema and removes only that schema on
completion. The database user needs permission to create schemas and the UUID
extension used by TypeORM. An interrupted test can leave its `test_*` schema
behind; remove the disposable container when finished.

The suite uses real PostgreSQL queries, entities, normalization and scheduler
logic. Only the NVD service boundary is mocked, so tests do not download the
entire public CVE dataset or depend on NVD availability or rate limits.
It verifies full and incremental ingestion, duplicate prevention, all normalized
relations, startup recovery of changed data, version-based reprocessing,
1,001-record incremental batches, parsing failure state, and transactional
rollback on database errors.

A parsing error now fails the current batch and marks the run as failed.
Previously committed batches remain saved; fix the offending raw data or
normalizer and rerun incremental normalization to resume pending work.

The original `test:e2e` suite imports the full application and can trigger
startup collection. It is separate from this isolated integration suite and
should only run with a disposable application database and intentional NVD access.
