
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function debug() {
  const session = await prisma.session.findFirst();
  if (!session) {
    fs.writeFileSync('scratch/debug_result.json', JSON.stringify({ error: 'No session' }));
    return;
  }

  const shop = session.shop;
  const token = session.accessToken;

  // 1. Fetch Themes
  const themesRes = await fetch(`https://${shop}/admin/api/2024-04/themes.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const themes = await themesRes.json();
  
  fs.writeFileSync('scratch/debug_result.json', JSON.stringify({ themes }, null, 2));
}

debug().catch(e => fs.writeFileSync('scratch/debug_result.json', JSON.stringify({error: e.message})));
