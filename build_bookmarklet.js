const fs = require('fs');

const src = fs.readFileSync('bookmarklet.js', 'utf8');

// For raw console execution
fs.writeFileSync('bookmarklet_raw.js', src, 'utf8');

// Minify for bookmarklet href
const lines = src.split('\n');
const strippedLines = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
  strippedLines.push(line);
}
let minified = strippedLines.join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}();,:=+><!&|?])\s*/g, '$1')
  .trim();

// Ensure fully safe URL-encoded href
const bookmarkletHref = 'javascript:' + encodeURIComponent(minified);

fs.writeFileSync('bookmarklet.min.js', 'javascript:' + minified, 'utf8');
fs.writeFileSync('bookmarklet_href.txt', bookmarkletHref, 'utf8');

console.log('Bookmarklet built successfully!');
console.log('Minified size:', minified.length, 'bytes');
console.log('Safe Href size:', bookmarkletHref.length, 'bytes');
