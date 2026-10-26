const { chromium } = require('/Users/davidma/.workbuddy/binaries/node/workspace/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/davidma/WorkBuddy/2026-06-17-20-28-55/gratitude-app/promo';
const OUT = path.join(ROOT, 'out');

const MAP = {
  'A-land': 'A-光落-横版',
  'B-land': 'B-证据-横版',
  'C-land': 'C-积累-横版',
  'A-port': 'A-光落-竖版',
  'B-port': 'B-证据-竖版',
  'C-port': 'C-积累-竖版',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 1 });

  await page.goto('http://127.0.0.1:8901/promo/covers.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.load('400 100px "Satisfy"'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);

  const imgsOk = await page.evaluate(() =>
    Array.from(document.images).map(i => ({ src: i.currentSrc.split('/').pop(), ok: i.complete && i.naturalWidth > 0 }))
  );
  console.log('IMAGES', JSON.stringify(imgsOk));

  const fontsOk = await page.evaluate(() => document.fonts.check('400 68px Satisfy'));
  console.log('SATISFY_LOADED', fontsOk);

  for (const [id, name] of Object.entries(MAP)) {
    await page.locator('#' + id).screenshot({ path: path.join(OUT, name + '.png') });
    console.log('SHOT', name);
  }

  // 对比图
  const contact = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#1b1b1b;font-family:'PingFang SC',system-ui,sans-serif;padding:26px;width:1560px}
  .row{display:flex;gap:14px;margin-bottom:14px}
  .row img{display:block;object-fit:cover}
  .land img{width:496px;height:279px}
  .port img{width:169px;height:300px}
  .lb{font-size:11px;color:#8a8a8a;letter-spacing:.2em;margin-bottom:8px}
  .portrow{display:flex;gap:14px;align-items:flex-start}
  </style></head><body>
  <div class="lb">A · 光落 &nbsp;/&nbsp; B · 证据 &nbsp;/&nbsp; C · 积累 &nbsp;——&nbsp; 横版 1920×1080</div>
  <div class="row land">
    <img src="out/A-光落-横版.png"><img src="out/B-证据-横版.png"><img src="out/C-积累-横版.png">
  </div>
  <div class="lb" style="margin-top:18px">竖版 1080×1920</div>
  <div class="row port">
    <img src="out/A-光落-竖版.png"><img src="out/B-证据-竖版.png"><img src="out/C-积累-竖版.png">
  </div>
  </body></html>`;
  fs.writeFileSync(path.join(ROOT, '_contact.html'), contact);

  const p2 = await browser.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 1 });
  await p2.goto('file://' + path.join(ROOT, '_contact.html'), { waitUntil: 'networkidle' });
  await p2.waitForTimeout(400);
  await p2.screenshot({ path: path.join(OUT, '_对比.png'), fullPage: true });
  console.log('SHOT contact');

  await browser.close();
})();
