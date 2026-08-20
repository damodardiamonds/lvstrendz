const fs = require('fs');
const path = require('path');

// Helper to parse CSV properly handling quoted fields and newlines inside quotes
function parseCSV(text) {
  const result = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        result.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

// Strip HTML tags for clean Meta descriptions
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Escape field for CSV
function csvEscape(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Main execution
function run() {
  const csvFilePath = path.join(__dirname, '..', 'wc-product-export-9-7-2026-1783583635076.csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found at:', csvFilePath);
    return;
  }

  const rawText = fs.readFileSync(csvFilePath, 'utf8');
  const rows = parseCSV(rawText);
  
  if (rows.length < 2) {
    console.error('Invalid CSV content');
    return;
  }

  const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').trim());
  
  // Index mappings
  const getIdx = (name) => headers.indexOf(name);
  
  const idIdx = getIdx('ID');
  const typeIdx = getIdx('Type');
  const skuIdx = getIdx('SKU');
  const nameIdx = getIdx('Name');
  const publishedIdx = getIdx('Published');
  const shortDescIdx = getIdx('Short description');
  const descIdx = getIdx('Description');
  const inStockIdx = getIdx('In stock?');
  const salePriceIdx = getIdx('Sale price');
  const regPriceIdx = getIdx('Regular price');
  const categoriesIdx = getIdx('Categories');
  const imagesIdx = getIdx('Images');
  const parentIdx = getIdx('Parent');
  
  console.log(`Total rows parsed: ${rows.length - 1}`);

  // Meta Catalog Headers
  const catalogHeaders = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'sale_price',
    'link',
    'image_link',
    'additional_image_link',
    'brand',
    'google_product_category',
    'fb_product_category',
    'item_group_id',
    'gender',
    'age_group',
    'custom_label_0',
    'custom_label_1'
  ];

  const catalogRows = [catalogHeaders.map(csvEscape).join(',')];

  let activeProductsCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 5) continue;

    const id = r[idIdx] || `PROD-${i}`;
    const type = r[typeIdx] || 'simple';
    const sku = r[skuIdx] || id;
    const name = r[nameIdx] || '';
    const published = r[publishedIdx] === '1';
    
    if (!published && r[publishedIdx] !== undefined && r[publishedIdx] !== '') {
      continue; // Skip unpublished items
    }

    const shortDesc = stripHtml(r[shortDescIdx]);
    const fullDesc = stripHtml(r[descIdx]);
    const description = (shortDesc.length > 20 ? shortDesc : fullDesc).slice(0, 4900) || `${name} - High quality ethnic wear from LVS Trendz.`;

    const inStock = r[inStockIdx] !== '0';
    const availability = inStock ? 'in stock' : 'out of stock';
    
    let salePriceVal = r[salePriceIdx] ? parseFloat(r[salePriceIdx]) : null;
    let regPriceVal = r[regPriceIdx] ? parseFloat(r[regPriceIdx]) : null;

    if (!regPriceVal && salePriceVal) {
      regPriceVal = salePriceVal;
      salePriceVal = null;
    }
    if (!regPriceVal) {
      regPriceVal = 2999; // Fallback standard price if not set
    }

    const price = `${regPriceVal.toFixed(2)} INR`;
    const sale_price = salePriceVal ? `${salePriceVal.toFixed(2)} INR` : '';

    // Landing page link
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const link = `https://lvstrendz.com/product/${slug}`;

    // Images
    const rawImages = (r[imagesIdx] || '').split(',').map(s => s.trim()).filter(Boolean);
    const image_link = rawImages[0] || 'https://lvstrendz.com/placeholder.jpg';
    const additional_image_link = rawImages.slice(1, 10).join(',');

    const categories = r[categoriesIdx] || 'Festive Wear, Ethnic Wear';
    const parent = r[parentIdx] || '';

    // Item Group ID for variations
    const item_group_id = parent ? parent : (type === 'variable' ? sku : '');

    const catalogRow = [
      sku || id,
      name,
      description,
      availability,
      'new',
      price,
      sale_price,
      link,
      image_link,
      additional_image_link,
      'LVS Trendz',
      'Apparel & Accessories > Clothing > Ethnic Clothing',
      'Apparel & Accessories > Clothing > Ethnic Clothing',
      item_group_id,
      'female',
      'adult',
      categories.split(',')[0] || 'Ethnic Wear',
      'Rakshabandhan Sale 2026'
    ];

    catalogRows.push(catalogRow.map(csvEscape).join(','));
    activeProductsCount++;
  }

  const catalogCsvContent = catalogRows.join('\n');
  const catalogOutputPath = path.join(__dirname, '..', 'meta_product_catalog_feed.csv');
  fs.writeFileSync(catalogOutputPath, catalogCsvContent, 'utf8');
  console.log(`Generated Meta Product Catalog CSV at ${catalogOutputPath} (${activeProductsCount} products)`);

  // Now Generate Meta Ads Campaign Planner & Copy CSV
  const campaignHeaders = [
    'Campaign Name',
    'Campaign Objective',
    'Buying Type',
    'Special Ad Category',
    'Daily Budget (INR)',
    'Ad Set Name',
    'Audience / Location',
    'Age Range',
    'Gender',
    'Detailed Targeting (Interests)',
    'Placements',
    'Optimization Goal',
    'Ad Name',
    'Ad Format',
    'Primary Text (Ad Copy)',
    'Headline',
    'Description',
    'Call To Action',
    'Landing Page URL',
    'Recommended Creative Asset'
  ];

  const campaignRows = [campaignHeaders.map(csvEscape).join(',')];

  const campaignData = [
    {
      campaignName: '[LVS Trendz] Festive Rakshabandhan Sale - Sales Conversions',
      objective: 'OUTCOME_SALES',
      buyingType: 'AUCTION',
      specialAdCategory: 'NONE',
      dailyBudget: '1500',
      adSetName: 'AdSet 01 - Broad Targeting (Women 21-45 - India)',
      audience: 'India (Pan-India Major Cities & Tier 1/2)',
      age: '21-45',
      gender: 'Women',
      targeting: 'Broad Targeting (Advantage+ Audience Expansion)',
      placements: 'Advantage+ Placements (IG Feed, IG Reels, FB Feed, Stories)',
      optimization: 'CONVERSIONS (Purchase)',
      adName: 'Ad 01 - Rakhi Special Designer Lehenga - Carousel',
      format: 'Carousel Ad',
      primaryText: '✨ Celebrate Rakshabandhan in Royal Elegance! ✨ Upgrade your festive wardrobe with LVS Trendz exclusive Festive Collection. Get up to 60% OFF on Designer Pure Silk Lehenga Cholis, Anarkali Gowns, & Rich Cotton Silk Sarees. 🎁 SPECIAL RAKHI OFFER: ✅ Flat Instant Discounts ✅ Free Express Delivery across India ✅ Cash On Delivery (COD) & Easy Exchange. Limited stock available for Rakshabandhan. Shop your favorite festive look today!',
      headline: 'Rakshabandhan Sale: Up to 60% OFF ✨',
      description: 'Free Express Shipping | COD Available | Luxury Ethnic Wear',
      cta: 'SHOP_NOW',
      url: 'https://lvstrendz.com/rakshabandhan-offer',
      creative: 'Carousel of Top Sellers: Designer Lehenga Choli, Anarkali Gown, Silk Saree'
    },
    {
      campaignName: '[LVS Trendz] Festive Rakshabandhan Sale - Sales Conversions',
      objective: 'OUTCOME_SALES',
      buyingType: 'AUCTION',
      specialAdCategory: 'NONE',
      dailyBudget: '1500',
      adSetName: 'AdSet 02 - Interest Targeting (Ethnic Wear & Bridal Shopping)',
      audience: 'India (Metros & Major Cities)',
      age: '22-50',
      gender: 'Women',
      targeting: 'Interests: Ethnic Wear, Sarees, Lehenga Choli, Wedding Dress, Indian Fashion, Online Shopping, Boutique',
      placements: 'Instagram Feed, Instagram Reels, Facebook Feed',
      optimization: 'CONVERSIONS (Purchase)',
      adName: 'Ad 02 - Anarkali Gown & Saree Showcase - Single Video/Image',
      format: 'Single Image / Video',
      primaryText: '🎀 The Perfect Festive Outfit For Rakhi 🎀 Turn heads this festive season with our handcrafted Anarkali Gown Sets and Heavy Jacquard Silk Sarees. Designed with micro cotton inner lining and intricate embroidery dori & sequence work for maximum comfort and style. 🔥 Offer Ends Soon! Use code RAKHI10 for extra savings.',
      headline: 'Buy Designer Festive Wear Online 🎁',
      description: 'Premium Fabric & Boutique Stitching | Express Shipping',
      cta: 'SHOP_NOW',
      url: 'https://lvstrendz.com/rakshabandhan-offer',
      creative: 'High-resolution Product Model Shoot Video or Hero Banner Image'
    },
    {
      campaignName: '[LVS Trendz] Festive Rakshabandhan Sale - Sales Conversions',
      objective: 'OUTCOME_SALES',
      buyingType: 'AUCTION',
      specialAdCategory: 'NONE',
      dailyBudget: '1000',
      adSetName: 'AdSet 03 - Retargeting (Website Visitors & Add To Cart 30 Days)',
      audience: 'Custom Audience: Website Visitors (30 Days), Engaged IG/FB Followers, Add To Cart Non-Purchasers',
      age: '18-65+',
      gender: 'All (Focus Women & Men gifting for sisters)',
      targeting: 'Retargeting Pixel Custom Audience',
      placements: 'Advantage+ Placements',
      optimization: 'CONVERSIONS (Purchase)',
      adName: 'Ad 03 - Dynamic Catalog Ad (DPA) - Retargeting Reminders',
      format: 'Dynamic Product Catalog (DPA)',
      primaryText: '🛍️ Still Thinking About It? Your Festive Outfit is Waiting! Don\'t miss out on your favorite LVS Trendz festive outfit before stock runs out. Complete your Rakshabandhan order now and enjoy Free Express Shipping + Cash on Delivery! 👇 Tap Shop Now to claim your discount.',
      headline: 'Complete Your Rakhi Order Today! 🚚',
      description: 'Flat Discounts + Fast Doorstep Delivery',
      cta: 'SHOP_NOW',
      url: 'https://lvstrendz.com/shop',
      creative: 'Dynamic Product Catalog (Auto-populates items viewed by user)'
    },
    {
      campaignName: '[LVS Trendz] Festive Gift Card Campaign - Instant Gifting',
      objective: 'OUTCOME_SALES',
      buyingType: 'AUCTION',
      specialAdCategory: 'NONE',
      dailyBudget: '800',
      adSetName: 'AdSet 01 - Brothers Gifting & Last Minute Rakhi Shoppers',
      audience: 'India (All Cities)',
      age: '18-40',
      gender: 'Men & Women',
      targeting: 'Interests: Gift Cards, Gifting, Brother Sister Relationship, Raksha Bandhan, E-commerce Gifting',
      placements: 'Instagram Stories, IG Reels, FB Feed',
      optimization: 'CONVERSIONS (Purchase)',
      adName: 'Ad 01 - E-Gift Voucher - Instant Digital Delivery',
      format: 'Single Image / Reel Video',
      primaryText: '🎁 Can\'t decide on size or color for your sister? Gift her choice! Send an instant LVS Trendz Digital Gift Card directly to your sister via Email or WhatsApp. She can choose her favorite Lehenga, Saree or Anarkali gown anytime! ⚡ Instant Email/SMS Delivery | Valid for 12 Months.',
      headline: 'Give The Gift of Fashion This Rakhi 💝',
      description: 'Instant E-Gift Cards from ₹1,000 to ₹10,000',
      cta: 'SHOP_NOW',
      url: 'https://lvstrendz.com/rakshabandhan-offer?tab=gift-card',
      creative: 'Animated Gift Card Visual / Video Clip'
    }
  ];

  campaignData.forEach(item => {
    const row = [
      item.campaignName,
      item.objective,
      item.buyingType,
      item.specialAdCategory,
      item.dailyBudget,
      item.adSetName,
      item.audience,
      item.age,
      item.gender,
      item.targeting,
      item.placements,
      item.optimization,
      item.adName,
      item.format,
      item.primaryText,
      item.headline,
      item.description,
      item.cta,
      item.url,
      item.creative
    ];
    campaignRows.push(row.map(csvEscape).join(','));
  });

  const campaignCsvContent = campaignRows.join('\n');
  const campaignOutputPath = path.join(__dirname, '..', 'meta_ads_campaign_structure.csv');
  fs.writeFileSync(campaignOutputPath, campaignCsvContent, 'utf8');
  console.log(`Generated Meta Ads Campaign Structure CSV at ${campaignOutputPath}`);
}

run();
