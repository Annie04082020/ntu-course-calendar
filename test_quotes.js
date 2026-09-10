const fs = require('fs');
const min = fs.readFileSync('bookmarklet.min.js', 'utf8');
console.log('Contains double quotes?', min.includes('"'));
const idx = min.indexOf('"');
console.log('First double quote index:', idx);
console.log('Snippet around first quote:', min.substring(idx - 20, idx + 40));
