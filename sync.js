const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, 'public', 'Photos');
const dataFile = path.join(__dirname, 'app', 'photosData.ts');

let fileContent = fs.readFileSync(dataFile, 'utf-8');

// 1. Get all actual image filenames currently sitting in public/Photos
const physicalFiles = fs.readdirSync(photosDir).filter(file => 
  file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
);

let updatedContent = fileContent;

// 2. Remove deleted entries from the file content
const entryRegex = /\{\s*id:\s*\d+,\s*image:\s*"([^"]+)",[\s\S]*?\}/g;
let match;
let entriesToRemove = [];

while ((match = entryRegex.exec(fileContent)) !== null) {
  const fullBlock = match[0];
  const imagePath = match[1]; 
  const fileName = path.basename(imagePath);
  
  if (!physicalFiles.includes(fileName)) {
    entriesToRemove.push(fullBlock);
  }
}

entriesToRemove.forEach(block => {
  updatedContent = updatedContent.replace(block, '');
});
updatedContent = updatedContent.replace(/,\s*,/g, ',');

// 3. Handle adding any NEW files (inserting at the top)
let highestId = 0;
const idRegex = /id:\s*(\d+)/g;
let idMatch;
while ((idMatch = idRegex.exec(updatedContent)) !== null) {
  const currentId = parseInt(idMatch[1]);
  if (currentId > highestId) highestId = currentId;
}

let newEntries = [];

physicalFiles.forEach(file => {
  const imagePath = `/Photos/${file}`;
  
  // If it's not already in the code file, it's new!
  if (!updatedContent.includes(imagePath)) {
    highestId++;
    
    let isMainImage = true;
    let groupName = "";
    let tagsString = '["Auto-Imported"]';
    
    // The upgraded regex that allows different1, different2, etc.
    const nameMatch = file.match(/^(?:\[(.*?)\]_)?(.*)_(hero|different\d*|true|false)\.(jpg|jpeg|png)$/i);
    
    if (nameMatch) {
      if (nameMatch[1]) {
        const rawTags = nameMatch[1].split('_');
        const formattedTags = rawTags.map(tag => `"${tag}"`).join(', ');
        tagsString = `[${formattedTags}]`;
      }
      groupName = nameMatch[2].replace(/_/g, ' ');
      const suffix = nameMatch[3].toLowerCase();
      isMainImage = (suffix === 'hero' || suffix === 'true');
    } else {
      isMainImage = file.toLowerCase().includes('hero') || file.toLowerCase().includes('main');
    }
    
    const newEntry = `  { id: ${highestId}, image: "${imagePath}", story: "", tags: ${tagsString}, group: "${groupName}", isMain: ${isMainImage} }`;
    newEntries.push(newEntry);
  }
});

// 4. Inject new entries at the top and save
if (newEntries.length > 0 || entriesToRemove.length > 0) {
  if (newEntries.length > 0) {
    const startPos = updatedContent.indexOf('[');
    const before = updatedContent.slice(0, startPos + 1);
    const after = updatedContent.slice(startPos + 1);
    
    const separator = after.trim().startsWith(']') ? '' : ',\n';
    updatedContent = `${before}\n${newEntries.join(',\n')}${separator}${after}`;
  }
  
  fs.writeFileSync(dataFile, updatedContent);
  console.log(`Sync complete! Added ${newEntries.length} new photos, removed ${entriesToRemove.length} deleted photos.`);
} else {
  console.log('Sync complete. Everything is already up to date!');
}