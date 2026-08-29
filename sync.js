const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const photosDir = path.join(__dirname, 'public', 'Photos');
const dataFile = path.join(__dirname, 'app', 'photosData.json');

// Read existing JSON data
let existingPhotos = [];
try {
  const fileContent = fs.readFileSync(dataFile, 'utf-8');
  existingPhotos = JSON.parse(fileContent);
} catch (error) {
  console.log("Could not read existing JSON or it was empty. Starting fresh.");
}

// 1. Get all actual image filenames currently in public/Photos
const physicalFiles = fs.readdirSync(photosDir).filter(file =>
  file.match(/\.(jpg|jpeg|png)$/i)
);

let entriesToRemove = 0;
let newEntries = 0;

// 2. Remove deleted entries
const originalCount = existingPhotos.length;
existingPhotos = existingPhotos.filter(photo => {
  const fileName = path.basename(photo.image);
  return physicalFiles.includes(fileName);
});
entriesToRemove = originalCount - existingPhotos.length;

// 3. Handle adding NEW files
let highestId = existingPhotos.reduce((max, photo) => Math.max(max, photo.id), 0);
const existingImagePaths = existingPhotos.map(p => p.image);

async function processNewFiles() {
  for (const file of physicalFiles) {
    const imagePath = `/Photos/${file}`;
    if (!existingImagePaths.includes(imagePath)) {
      highestId++;
      newEntries++;

      let isMainImage = true;
      let groupName = "";
      let tags = ["Auto-Imported"];

      const nameMatch = file.match(/^(?:\[(.*?)\]_)?(.*)_(hero|different\d*|true|false)\.(jpg|jpeg|png)$/i);
      if (nameMatch) {
        if (nameMatch[1]) tags = nameMatch[1].split('_');
        groupName = nameMatch[2].replace(/_/g, ' ');
        const suffix = nameMatch[3].toLowerCase();
        isMainImage = (suffix === 'hero' || suffix === 'true');
      } else {
        isMainImage = file.toLowerCase().includes('hero') || file.toLowerCase().includes('main');
      }

      // Auto-detect aspect ratio using sharp
      let aspect = 1.0;
      try {
        const meta = await sharp(path.join(photosDir, file)).metadata();
        if (meta.width && meta.height) {
          aspect = parseFloat((meta.width / meta.height).toFixed(3));
        }
      } catch (e) {
        console.warn(`Could not read metadata for ${file}, defaulting aspect to 1.0`);
      }

      existingPhotos.unshift({
        id: highestId,
        image: imagePath,
        story: "",
        tags,
        group: groupName,
        isMain: isMainImage,
        aspect
      });
    }
  }

  // 4. Save updated JSON
  if (newEntries > 0 || entriesToRemove > 0) {
    fs.writeFileSync(dataFile, JSON.stringify(existingPhotos, null, 2));
    console.log(`Sync complete! Added ${newEntries} new photos, removed ${entriesToRemove} deleted photos.`);
  } else {
    console.log('Sync complete. Everything is already up to date!');
  }
}

processNewFiles();
