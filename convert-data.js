const fs = require('fs');
const path = require('path');
const os = require('os');

try {
  // Olası tüm dosya adlarını ve uzantılarını kontrol ediyoruz
  const possiblePaths = [
    path.join(os.homedir(), 'Desktop', 'sut-kahvaltilik-c-4.json.txt'),
    path.join(os.homedir(), 'Desktop', 'sut-kahvaltilik.json.txt'),
    path.join(os.homedir(), 'Desktop', 'sut-kahvaltilik-c-4.json'),
    path.join(os.homedir(), 'Desktop', 'sut-kahvaltilik.json'),
    path.join(os.homedir(), 'Desktop', 'sut-kahvaltilik-c-4.htm')
  ];

  let desktopPath = possiblePaths.find(p => fs.existsSync(p));

  if (!desktopPath) {
    throw new Error("Masaüstünde ilgili dosya bulunamadı! Lütfen dosyanın masaüstünde olduğundan emin ol.");
  }

  console.log(`📂 Bulunan dosya işleniyor: ${desktopPath}`);
  const xmlContent = fs.readFileSync(desktopPath, 'utf8');

  // <storeProductInfos> bloklarını ayıkla
  const rawBlocks = xmlContent.split('<storeProductInfos>');
  const formatted = [];

  for (const block of rawBlocks) {
    const nameMatch = block.match(/<name>(.*?)<\/name>/);
    const skuMatch = block.match(/<sku>(.*?)<\/sku>/) || block.match(/<id>(.*?)<\/id>/);

    if (!nameMatch || !skuMatch) continue;

    const name = nameMatch[1].trim();
    const sku = skuMatch[1].trim();

    let brand = "Genel";
    const brandBlock = block.match(/<brand>([\s\S]*?)<\/brand>/);
    if (brandBlock) {
      const brandNameMatch = brandBlock[1].match(/<name>(.*?)<\/name>/);
      if (brandNameMatch) brand = brandNameMatch[1].trim();
    }

    let imageUrl = "";
    const imgMatch = block.match(/<PRODUCT_DETAIL>(.*?)<\/PRODUCT_DETAIL>/) ||
                     block.match(/<PRODUCT_HD>(.*?)<\/PRODUCT_HD>/) ||
                     block.match(/<PRODUCT_LIST>(.*?)<\/PRODUCT_LIST>/);
    if (imgMatch) {
      imageUrl = imgMatch[1].trim();
    }

    // Migros fiyatları kuruş cinsinden geliyor (39890 = 398,90 TL).
    let referencePrice = null;
    const priceMatch = block.match(/<shownPrice>(\d+)<\/shownPrice>/) ||
                        block.match(/<regularPrice>(\d+)<\/regularPrice>/);
    if (priceMatch) {
      referencePrice = Number.parseInt(priceMatch[1], 10) / 100;
    }

    formatted.push({
      source: "migros_export",
      sku_code: sku,
      product_name: name,
      brand: brand,
      category_name: "Süt & Kahvaltılık",
      image_url: imageUrl,
      reference_price: referencePrice
    });
  }

  if (formatted.length === 0) {
    throw new Error("XML/TXT içinden ürün verisi çıkarılamadı!");
  }

  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  fs.writeFileSync('data/products.json', JSON.stringify(formatted, null, 2));
  console.log(`🎉 ADAMSIN KANKA! ${formatted.length} adet ürün .txt dosyasından ayrıştırıldı ve data/products.json oluşturuldu!`);

} catch (err) {
  console.error('❌ Hata:', err.message);
}