const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

// ✅ Replace with YOUR Cloudinary credentials
cloudinary.config({
  cloud_name: 'n5umtsub',
  api_key: '787255454119471',
  api_secret: 'aC3s32ZJT0JUtqSBnh7bLq174ZY'
});

// ✅ Your XML file - make sure this matches your actual filename
const xmlFile = './wordpress-media-export.xml';

async function migrate() {
  // Check if file exists
  if (!fs.existsSync(xmlFile)) {
    console.log('❌ XML file not found! Check the filename.');
    console.log('Looking for: ' + path.resolve(xmlFile));
    console.log('');
    console.log('Files in current directory:');
    const files = fs.readdirSync('.').filter(f => f.endsWith('.xml'));
    files.forEach(f => console.log('  → ' + f));
    return;
  }

  const xmlData = fs.readFileSync(xmlFile, 'utf-8');

  const parser = new xml2js.Parser({
    explicitArray: false,
    tagNameProcessors: [xml2js.processors.stripPrefix]
  });

  const result = await parser.parseStringPromise(xmlData);

  const channel = result.rss.channel;
  let items = channel.item || [];
  if (!Array.isArray(items)) items = [items];

  console.log('📦 Found ' + items.length + ' total items in XML');
  console.log('');

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Check if it's a media attachment
    if (item.post_type !== 'attachment') {
      skipped++;
      continue;
    }

    // Get the URL
    const url = item.attachment_url;
    if (!url) {
      skipped++;
      console.log('⏭️ Skipped (no URL): ' + (item.title || 'unknown'));
      continue;
    }

    const title = item.title || 'media-' + i;

    // Determine file type and folder
    const ext = path.extname(url).toLowerCase();
    let resourceType = 'image';
    let folder = 'lvstrendz/products';

    if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
      resourceType = 'video';
      folder = 'lvstrendz/videos';
    } else if (ext === '.svg') {
      folder = 'lvstrendz/logos';
    }

    // Clean title for public_id
    const cleanTitle = title
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

    // Fix URL: ensure https
    const secureUrl = url.replace('http://', 'https://');

    try {
      const uploadResult = await cloudinary.uploader.upload(secureUrl, {
        folder: folder,
        public_id: cleanTitle,
        resource_type: resourceType,
        overwrite: false
      });

      success++;
      console.log('✅ [' + success + '] ' + cleanTitle + ' → ' + uploadResult.secure_url);
    } catch (error) {
      failed++;
      console.error('❌ [Failed] ' + title + ' (' + secureUrl + ') → ' + error.message);
    }

    // 500ms delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  console.log('🎉 Migration Complete!');
  console.log('✅ Uploaded: ' + success);
  console.log('❌ Failed: ' + failed);
  console.log('⏭️ Skipped (not media): ' + skipped);
}

migrate();
