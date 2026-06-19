const fs = require('fs');
const html = fs.readFileSync('v2/index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/g);
const code = m[1].replace(/^<script>/,'').replace(/<\/script>$/,'');
fs.writeFileSync('/tmp/v2-check.js', code);
