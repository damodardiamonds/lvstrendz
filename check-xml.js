const fs = require('fs');
const xml2js = require('xml2js');

const xmlFile = './wordpress-media-export.xml';
const xmlData = fs.readFileSync(xmlFile, 'utf-8');

const parser = new xml2js.Parser({
  explicitArray: false,
  tagNameProcessors: [xml2js.processors.stripPrefix]
});

parser.parseStringPromise(xmlData).then(result => {
  const channel = result.rss.channel;
  let items = channel.item || [];
  if (!Array.isArray(items)) items = [items];

  console.log('Total items found: ' + items.length);
  console.log('');
  console.log('--- First item structure ---');
  console.log(JSON.stringify(items, null, 2));
});
