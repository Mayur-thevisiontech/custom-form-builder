
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugThemes() {
  const session = await prisma.session.findFirst({
    where: { shop: 'app-applications.myshopify.com' }
  });

  if (!session) {
    console.log('No session found for store');
    return;
  }

  const accessToken = session.accessToken;
  const shop = session.shop;

  console.log('Using Access Token:', accessToken.substring(0, 10) + '...');

  // Fetch Themes
  const themesRes = await fetch(`https://${shop}/admin/api/2024-04/themes.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });
  const themesData = await themesRes.json();
  console.log('Themes found:', JSON.stringify(themesData, null, 2));

  if (themesData.themes) {
    for (const theme of themesData.themes) {
        console.log(`Checking Theme ${theme.id} (${theme.name})...`);
        
        // Check settings_data.json
        const settingsRes = await fetch(`https://${shop}/admin/api/2024-04/themes/${theme.id}/assets.json?asset[key]=config/settings_data.json`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        const settingsData = await settingsRes.json();
        if (settingsData.asset) {
            const settings = JSON.parse(settingsData.asset.value);
            const blocks = settings?.current?.blocks || {};
            const matches = Object.entries(blocks).filter(([k, v]) => v.type && v.type.includes('64b50aa7971e5f157ad668b4f902b93b'));
            console.log(`  Embed Matches in ${theme.name}:`, matches.length);
            if (matches.length > 0) console.log('  Match details:', JSON.stringify(matches, null, 2));
        } else {
            console.log(`  Could not read settings for ${theme.name}:`, settingsData.errors || 'Not found');
        }
    }
  }
}

debugThemes().catch(console.error);
