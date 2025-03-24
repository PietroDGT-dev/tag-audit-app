const puppeteer = require('puppeteer');

async function runAudit(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  const results = {
    url,
    GTM: false,
    GA4: false,
    GoogleAds: false,
    MetaPixel: false,
    CMP: {
      Cookiebot: false,
      Iubenda: false,
      Onetrust: false
    }
  };

  await page.setRequestInterception(true);

  page.on('request', request => {
    const reqUrl = request.url();
    if (reqUrl.includes('googletagmanager.com/gtm.js')) results.GTM = true;
    if (reqUrl.includes('gtag/js') || reqUrl.includes('analytics.js')) results.GA4 = true;
    if (reqUrl.includes('googleads.g.doubleclick.net')) results.GoogleAds = true;
    if (reqUrl.includes('facebook.com/tr')) results.MetaPixel = true;
    if (reqUrl.includes('consent.cookiebot.com')) results.CMP.Cookiebot = true;
    if (reqUrl.includes('iubenda.com')) results.CMP.Iubenda = true;
    if (reqUrl.includes('cookielaw.org')) results.CMP.Onetrust = true;
    request.continue();
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    await browser.close();
    return { error: `Errore nel caricamento della pagina: ${e.message}` };
  }

  await browser.close();
  return results;
}

module.exports = runAudit;