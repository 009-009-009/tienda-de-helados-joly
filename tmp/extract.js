const fs = require('fs');
const code = fs.readFileSync('/tmp/vercel-bundle.js', 'utf8');

const marker = 'f=[{id:';
const startIdx = code.indexOf(marker);
if (startIdx !== -1) {
  let depth = 0;
  let endIdx = -1;
  const arrayStart = code.indexOf('[', startIdx);
  for (let i = arrayStart; i < code.length; i++) {
    if (code[i] === '[') depth++;
    else if (code[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  const productsCode = code.substring(arrayStart, endIdx + 1);
  fs.writeFileSync('/tmp/extracted-products.json', productsCode);
  console.log('Extracted products length:', productsCode.length);
} else {
  console.log('Marker not found');
}
