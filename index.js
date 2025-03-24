const express = require('express');
const bodyParser = require('body-parser');
const runAudit = require('./audit');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/audit', async (req, res) => {
  const url = req.body.url;
  const result = await runAudit(url);

  if (result.error) {
    return res.send(`<p>Errore: ${result.error}</p>`);
  }

  const html = await ejs.renderFile(path.join(__dirname, 'views', 'report.ejs'), { result });

  const pdfFilename = `report_${Date.now()}.pdf`;
  const pdfPath = path.join(__dirname, pdfFilename);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: pdfPath, format: 'A4' });
  await browser.close();

  res.download(pdfPath, pdfFilename, (err) => {
    if (err) {
      res.send('Errore nel download del PDF');
    }
    fs.unlink(pdfPath, () => {});
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});