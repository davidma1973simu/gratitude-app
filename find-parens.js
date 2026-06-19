const acorn = require('acorn');
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/g);
const code = m[1].replace(/^<script>/,'').replace(/<\/script>$/,'');
const lines = code.split('\n');
for (let end = lines.length; end > 0; end--) {
  const partial = lines.slice(0, end).join('\n');
  try {
    acorn.parse(partial, { ecmaVersion: 2022, sourceType: 'script' });
    console.log('Parses OK up to line ' + end);
    break;
  } catch(e) {
    if (end === lines.length || end % 50 === 0) {
      console.log('Fails at line ' + end + ': ' + e.message.substring(0,80));
    }
  }
}
