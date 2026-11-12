// Choose the latest source revision before applying incremental or date filters.
// Otherwise a late-arriving historical snapshot can overwrite newer canonical data.
export const NEWER_RAW_JOIN = `newer.cveId = raw.cveId AND (
  newer.sourceModifiedAt > raw.sourceModifiedAt OR
  (raw.sourceModifiedAt IS NULL AND newer.sourceModifiedAt IS NOT NULL)
)`;
