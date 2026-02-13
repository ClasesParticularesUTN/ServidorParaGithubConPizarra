const fs = require('fs');
const vm = require('vm');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

const scriptRegex = /<script( [^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let i = 0;
let hadError = false;
while ((match = scriptRegex.exec(html)) !== null) {
  i++;
  const attrs = match[1] || '';
  const content = match[2];
  try {
    // Try to compile the script to check syntax
    new vm.Script(content, {filename: `index.html::<script #${i}>`});
    console.log(`Script #${i} OK (attrs:${attrs.trim()}) lines:${content.split('\n').length}`);
  } catch (e) {
    hadError = true;
    console.error(`ERROR in script #${i} (${e.message})`);
    console.error(e.stack);
    // Show some context lines around the reported line if available
    const m = /<script #[0-9]+>:(\d+):(\d+)/.exec(e.stack) || /<anonymous>:(\d+):(\d+)/.exec(e.stack);
    if (m) {
      const line = parseInt(m[1], 10);
      const lines = content.split('\n');
      const start = Math.max(0, line - 5);
      const end = Math.min(lines.length, line + 5);
      console.error('Context:');
      for (let ln = start; ln < end; ln++) {
        console.error((ln + 1) + ': ' + lines[ln]);
      }
    } else {
      // print first 200 chars
      console.error(content.slice(0, 1000));
    }
  }
}
if (!i) console.error('No scripts found');
process.exit(hadError ? 2 : 0);
