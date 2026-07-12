const fs = require('fs');
const path = require('path');

const xmlPath = 'C:\\Projects\\lvstrendz\\lvstrendzcom.WordPress.2026-07-12.xml';
const outputBaseDir = 'C:\\Projects\\lvstrendz\\src\\app\\(shop)';

const targetPages = {
  'about-us': { slug: 'about-us', title: 'About Us' },
  'our-story': { slug: 'our-story', title: 'Our Story' },
  'our-mission': { slug: 'our-mission', title: 'Our Mission' },
  'contact-us': { slug: 'contact-us', title: 'Contact Us' },
  'faqs': { slug: 'faqs', title: 'FAQs' },
  'privacy-policy': { slug: 'privacy-policy', title: 'Privacy Policy' },
  'refund_exchange': { slug: 'refund_exchange', title: 'Refund and Exchange Policy' },
  'terms-conditions': { slug: 'terms-conditions', title: 'Terms & Conditions' },
  'help-center': { slug: 'help-center', title: 'Help Center' }
};

function cleanWordPressContent(html) {
  if (!html) return '';
  return html
    // Remove elementor json and comment blocks
    .replace(/<!-- [\s\S]*? -->/g, '')
    // Remove slider or page builder shortcodes
    .replace(/\[\/?(vc_|rt_|elementor|yith|woocommerce)[\s\S]*?\]/g, '')
    // Replace tabs or weird spacing
    .replace(/\t/g, ' ')
    // Replace multiple spaces and newlines
    .replace(/ {2,}/g, ' ')
    // Trim empty paragraphs
    .replace(/<p>&nbsp;<\/p>/g, '')
    .trim();
}

function generateReactPage(title, content) {
  const cleanContent = cleanWordPressContent(content);
  return `// Auto-generated from WordPress XML export
import React from 'react';

export const metadata = {
  title: '${title.replace(/'/g, "\\'")} - LV\\'s Trendz',
  description: 'Learn more about ${title.replace(/'/g, "\\'")} at LV\\'s Trendz.',
};

export default function Page() {
  return (
    <div className="bg-white min-h-screen py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-wide border-b border-gray-200 pb-6 mb-10">
          ${title}
        </h1>
        
        <div 
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed space-y-6 wordpress-imported-content"
          dangerouslySetInnerHTML={{
            __html: \`${cleanContent.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`
          }}
        />
      </div>
    </div>
  );
}
`;
}

async function main() {
  console.log('Reading WordPress XML file...');
  const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
  
  let pos = xmlContent.indexOf('<item>');
  let createdCount = 0;
  
  while (pos !== -1) {
    const endPos = xmlContent.indexOf('</item>', pos);
    if (endPos !== -1) {
      const item = xmlContent.substring(pos, endPos + 7);
      
      const postTypeMatch = item.match(/<wp:post_type>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:post_type>/);
      const postType = postTypeMatch ? postTypeMatch[1] : '';
      
      if (postType === 'page') {
        const slugMatch = item.match(/<wp:post_name>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:post_name>/);
        const slug = slugMatch ? slugMatch[1] : '';
        
        const pageConfig = targetPages[slug];
        if (pageConfig) {
          const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
          const title = titleMatch ? titleMatch[1] : pageConfig.title;
          
          const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/);
          const rawContent = contentMatch ? contentMatch[1] : '';
          
          const pageDir = path.join(outputBaseDir, slug);
          if (!fs.existsSync(pageDir)) {
            fs.mkdirSync(pageDir, { recursive: true });
          }
          
          const reactCode = generateReactPage(title, rawContent);
          fs.writeFileSync(path.join(pageDir, 'page.tsx'), reactCode);
          console.log(`Generated page component: ${slug} at ${pageDir}/page.tsx`);
          createdCount++;
        }
      }
      pos = xmlContent.indexOf('<item>', endPos);
    } else {
      break;
    }
  }
  
  console.log(`\nSuccessfully created ${createdCount} custom pages.`);
}

main().catch(console.error);
