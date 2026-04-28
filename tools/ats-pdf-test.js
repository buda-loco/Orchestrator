#!/usr/bin/env node
// ATS round-trip test: generates PDFs in both ATS modes via Puppeteer,
// then run pdftotext over them to verify dates, labels, and reading order
// extract cleanly.
//
// Requires:
//   - Vite dev server running at http://127.0.0.1:5173/
//   - At least one application saved (use the wizard + Execute Alignment first)
//   - Puppeteer + Chrome installed
//
// Usage:
//   cd tools && npm i puppeteer
//   node ats-pdf-test.js
//   pdftotext -layout /tmp/cv-ats-off.pdf -

const path = require('path');
const fs = require('fs');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch {
  try {
    puppeteer = require(path.resolve(__dirname, '../backend/node_modules/puppeteer'));
  } catch {
    console.error('puppeteer not found. Run: cd tools && npm i puppeteer');
    process.exit(1);
  }
}

// macOS default; override with CHROME_PATH env var.
const chromePath = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const url = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:5173/';

(async () => {
  const launchOptions = { headless: 'new' };
  if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find(b => b.textContent?.trim().startsWith('Tracker'))?.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Reload Workspace')?.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const out = {};
  for (const mode of ['off', 'on']) {
    const isOn = await page.evaluate(() =>
      document.querySelector('[role="switch"]')?.getAttribute('aria-checked') === 'true'
    );
    if ((mode === 'on' && !isOn) || (mode === 'off' && isOn)) {
      await page.evaluate(() => document.querySelector('[role="switch"]')?.click());
      await new Promise(r => setTimeout(r, 300));
    }

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      width: '210mm',
      height: '297mm',
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    const file = `/tmp/cv-ats-${mode}.pdf`;
    fs.writeFileSync(file, pdf);
    out[mode] = { path: file, bytes: pdf.length };
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
  console.log('\nNext: pdftotext -layout /tmp/cv-ats-off.pdf -');
})().catch(e => { console.error(e); process.exit(1); });
