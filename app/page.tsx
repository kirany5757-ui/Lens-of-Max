const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, 'public', 'Photos');
const dataFile = path.join(__dirname, 'app', 'photosData.ts');

let fileContent = fs.readFileSync(dataFile, 'utf-8');

// Get current highest ID
let highestId = 0;
const idRegex = /id:\s*(\d+)/g;
let match;
while ((match = idRegex.exec(fileContent)) !== null) {
  const currentId = parseInt(match[1]);
  if (currentId > highestId) highestId = currentId;
}

const files = fs.readdirSync(photosDir);
let newEntries = [];

files.forEach(file => {
  if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')) {
    const imagePath = `/Photos/${file}`;
    
    if (!fileContent.includes(imagePath)) {
      highestId++;
      
      let isMainImage = true;
      let groupName = "";
      let tagsString = '["Auto-Imported"]';
      
      const nameMatch = file.match(/^(?:\[(.*?)\]_)?(.*)_(hero|different|true|false)\.(jpg|jpeg|png)$/i);
      
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
  }
});

if (newEntries.length > 0) {
  // Find where the array starts (the first '[')
  const startPos = fileContent.indexOf('[');
  const before = fileContent.slice(0, startPos + 1);
  const after = fileContent.slice(startPos + 1);
  
  // Combine: existing start + new entries + comma (if array wasn't empty) + old content
  const separator = after.trim().startsWith(']') ? '' : ',\n';
  const injectedCode = `${before}\n${newEntries.join(',\n')}${separator}${after}`;
  
  fs.writeFileSync(dataFile, injectedCode);
  console.log(`Success! Added ${newEntries.length} photos to the TOP of your portfolio.`);
} else {
  console.log('No new photos found. Your grid is fully up to date!');
}