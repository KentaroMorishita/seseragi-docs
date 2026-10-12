export function checkReleaseIdentity(catalog, release) {
  if (release.dirty !== false || release.channel !== "release" || release.releaseTag !== `v${catalog.languageVersion}`) {
    throw new Error("Examples require a canonical, clean released CLI.");
  }
  if (release.version !== catalog.languageVersion || !/^[a-f0-9]{12,40}$/.test(release.commit ?? "") || !catalog.languageCommit.startsWith(release.commit)) {
    throw new Error(`CLI identity must match the catalog (${catalog.languageVersion}, ${catalog.languageCommit}); installed ${release.version}, ${release.commit}.`);
  }
}

export function checkReleaseRecord(catalog, record, examplesDigest) {
  if (record?.schema !== 1 || record.languageVersion !== catalog.languageVersion || record.languageCommit !== catalog.languageCommit || record.examplesDigest !== examplesDigest || !/^[a-f0-9]{64}$/.test(record.cliHelpDigest ?? "") || !record.reviewedAt) {
    throw new Error("Release verification is missing or stale. Review release-specific claims, then run bun run verify:release -- --reviewed. See README.md: 対応版の更新.");
  }
}
