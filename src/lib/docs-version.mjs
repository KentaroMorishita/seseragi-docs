// Release metadata belongs to the common article header, never the body.
// Package versions inside code fences remain executable example data.
export function checkVersionSource(source) {
  const errors = [];
  let fence;
  for (const [index, line] of source.split("\n").entries()) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (/<\/?LanguageVersion\b/.test(line)) {
      errors.push(`line ${index + 1}: release components are not allowed in article content; use the common header`);
    }
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      continue;
    }
    if (marker) fence = marker[1];
    // A four-part IPv4 address is not a release number.
    if (/(?<![\d.])v?\d+\.\d+\.\d+(?:-[\w.-]+)?(?![\d.])/.test(line)) {
      errors.push(`line ${index + 1}: release numbers are not allowed in article prose or fence titles; use the common header`);
    }
  }
  return errors;
}
