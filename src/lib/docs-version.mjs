export const versionComponent = "<LanguageVersion />";

// Search indexes the MDX source rather than the rendered React component.
export function resolveDocsVersion(source, version) {
  return source.replaceAll(versionComponent, version);
}

// Authored prose uses the component. Generated API pages have their own
// snapshot/freshness check; package versions inside code are example data.
export function checkVersionSource(source) {
  const errors = [];
  let fence;
  for (const [index, line] of source.split("\n").entries()) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (line.includes("<LanguageVersion")) errors.push(`line ${index + 1}: version component inside a code fence`);
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      continue;
    }
    if (marker) fence = marker[1];
    // A four-part IPv4 address is not a release number.
    if (/(?<![\d.])v?\d+\.\d+\.\d+(?:-[\w.-]+)?(?![\d.])/.test(line)) {
      errors.push(`line ${index + 1}: hardcoded version in prose or a fence title; use ${versionComponent}`);
    }
    for (const token of line.matchAll(/<\/?LanguageVersion\b[^>]*>/g)) {
      if (token[0] !== versionComponent) errors.push(`line ${index + 1}: use exactly ${versionComponent}`);
    }
    const inCode = [...line.matchAll(/(`+)(.*?)\1/g)].some((match) => match[2].includes("<LanguageVersion"));
    if (line.includes(versionComponent) && (marker || /^\s*#{1,6}\s/.test(line) || inCode)) {
      errors.push(`line ${index + 1}: version component belongs in prose, outside headings and code`);
    }
  }
  return errors;
}
