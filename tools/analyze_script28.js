const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const scriptRegex = /<script( [^>]*)?>([\s\S]*?)<\/script>/gi;
let match; let i=0; let target=null;
while((match = scriptRegex.exec(html))!==null){ i++; if(i===28){ target=match[2]; break; }}
if(!target){ console.error('script #28 not found'); process.exit(2); }
fs.writeFileSync(path.join(__dirname,'script28.js'), target, 'utf8');
console.log('Wrote script28.js with', target.split('\n').length, 'lines');

function countChar(s){return s.split('').reduce((acc,ch)=>{acc[ch]=(acc[ch]||0)+1;return acc;},{})}
const counts = countChar(target);
console.log('counts:', {braceOpen:counts['{']||0, braceClose:counts['}']||0, parOpen:counts['(']||0, parClose:counts[')']||0, brackOpen:counts['[']||0, brackClose:counts[']']||0, backtick:counts['`']||0});

// Find last 200 chars
console.log('Last 200 chars:\n', target.slice(-200));

// Find the line around which parser failed: we saw earlier 2961
const lineNum = 2961;
const lines = target.split('\n');
const start = Math.max(0,lineNum-5);
const end = Math.min(lines.length, lineNum+5);
console.log('Context around line', lineNum, ':');
for(let ln=start; ln<end; ln++){
  console.log((ln+1)+': '+lines[ln]);
}

process.exit(0);
