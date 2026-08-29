const fs = require('fs');
const path = require('path');

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

// 1. Get all actual image filenames currently sitting in public/Photos
const physicalFiles = fs.readdirSync(photosDir).filter(file => 
  file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
);

let entriesToRemove = 0;
let newEntries = 0;

// 2. Remove deleted entries from the array
const originalCount = existingPhotos.length;
existingPhotos = existingPhotos.filter(photo => {
  const fileName = path.basename(photo.image);
  return physicalFiles.includes(fileName);
});
entriesToRemove = originalCount - existingPhotos.length;

// 3. Handle adding any NEW files
let highestId = existingPhotos.reduce((max, photo) => Math.max(max, photo.id), 0);
const existingImagePaths = existingPhotos.map(p => p.image);

physicalFiles.forEach(file => {
  const imagePath = `/Photos/${file}`;
  
  // If it's not already in the array, it's new!
  if (!existingImagePaths.includes(imagePath)) {
    highestId++;
    newEntries++;
    
    let isMainImage = true;
    let groupName = "";
    let tags = ["Auto-Imported"];
    
    // The upgraded regex that allows different1, different2, etc.
    const nameMatch = file.match(/^(?:\[(.*?)\]_)?(.*)_(hero|different\d*|true|false)\.(jpg|jpeg|png)$/i);
    
    if (nameMatch) {
      if (nameMatch[1]) {
        tags = nameMatch[1].split('_');
      }
      groupName = nameMatch[2].replace(/_/g, ' ');
      const suffix = nameMatch[3].toLowerCase();
      isMainImage = (suffix === 'hero' || suffix === 'true');
    } else {
      isMainImage = file.toLowerCase().includes('hero') || file.toLowerCase().includes('main');
    }
    
    // Unshift adds new photos to the top (beginning) of the array
    existingPhotos.unshift({
      id: highestId,
      image: imagePath,
      story: "",
      tags: tags,
      group: groupName,
      isMain: isMainImage
    });
  }
});

// 4. Save the updated array back to JSON
if (newEntries > 0 || entriesToRemove > 0) {
  fs.writeFileSync(dataFile, JSON.stringify(existingPhotos, null, 2));
  console.log(`Sync complete! Added ${newEntries} new photos, removed ${entriesToRemove} deleted photos.`);
} else {
  console.log('Sync complete. Everything is already up to date!');
}
