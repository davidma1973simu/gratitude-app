const acorn = require('acorn');
const fs = require('fs');

function checkFile(label, path) {
  const html = fs.readFileSync(path, 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/g);
  const code = m[1].replace(/^<script>/,'').replace(/<\/script>$/,'');
  try {
    acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script' });
    console.log(label + ': ✅ SYNTAX OK (' + code.length + ' bytes)');
  } catch(e) {
    console.log(label + ': ❌ ' + e.message);
  }
}

checkFile('V1', 'index.html');
checkFile('V2', 'v2/index.html');
