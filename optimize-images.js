const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const photosDir = path.join(__dirname, 'public', 'Photos');
const MAX_SIZE_MB = 3; 

async function optimizeImages() {
  const files = fs.readdirSync(photosDir).filter(file => 
    file.match(/\.(jpg|jpeg|png)$/i)
  );

  let optimizedCount = 0;

  for (const file of files) {
    const filePath = path.join(photosDir, file);
    const stats = fs.statSync(filePath);
    const sizeInMB = stats.size / (1024 * 1024);

    if (sizeInMB > MAX_SIZE_MB) {
      console.log(`Optimizing: ${file} (Original size: ${sizeInMB.toFixed(2)} MB)`);
      
      try {
        // Read into buffer so we can overwrite the same file
        const imageBuffer = fs.readFileSync(filePath);
        
        const optimizedBuffer = await sharp(imageBuffer)
          .resize({ width: 2500, height: 2500, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
          
        fs.writeFileSync(filePath, optimizedBuffer);
        
        const newStats = fs.statSync(filePath);
        const newSizeInMB = newStats.size / (1024 * 1024);
        console.log(` -> New size: ${newSizeInMB.toFixed(2)} MB`);
        optimizedCount++;
      } catch (err) {
        console.error(`Failed to optimize ${file}:`, err);
      }
    }
  }

  console.log(`\nDone! Successfully optimized ${optimizedCount} massive images.`);
}

optimizeImages();
