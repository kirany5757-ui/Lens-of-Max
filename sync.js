const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, 'public', 'Photos');
const dataFile = path.join(__dirname, 'app', 'photosData.ts');

let fileContent = fs.readFileSync(dataFile, 'utf-8');

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
      
      // THE ULTIMATE REGEX: Reads [Tags]_Group_Name_Hero.jpg
      // The (?:\[(.*?)\]_)? part makes the [Tags]_ optional!
      const nameMatch = file.match(/^(?:\[(.*?)\]_)?(.*)_(hero|different|true|false)\.(jpg|jpeg|png)$/i);
      
      if (nameMatch) {
        // 1. Extract Tags (if they exist inside brackets)
        if (nameMatch[1]) {
          // Splits "Plane_Sky" into an array and wraps them in quotes
          const rawTags = nameMatch[1].split('_');
          const formattedTags = rawTags.map(tag => `"${tag}"`).join(', ');
          tagsString = `[${formattedTags}]`;
        }
        
        // 2. Extract Group Name
        groupName = nameMatch[2].replace(/_/g, ' ');
        
        // 3. Extract Main Boolean
        const suffix = nameMatch[3].toLowerCase();
        isMainImage = (suffix === 'hero' || suffix === 'true');
        
      } else {
        // Fallback if the name doesn't match the strict format perfectly
        isMainImage = file.toLowerCase().includes('hero') || file.toLowerCase().includes('main');
      }
      
      const newEntry = `  { id: ${highestId}, image: "${imagePath}", story: "", tags: ${tagsString}, group: "${groupName}", isMain: ${isMainImage} }`;
      newEntries.push(newEntry);
      
      console.log(`Linked photo: ${file}`);
      console.log(`  -> Group: "${groupName}" | Tags: ${tagsString} | Hero: ${isMainImage}`);
    }
  }
});

if (newEntries.length > 0) {
  const insertPos = fileContent.lastIndexOf('];');
  let before = fileContent.slice(0, insertPos).trim();
  if (!before.endsWith(',')) {
    before += ',';
  }
  const injectedCode = `${before}\n${newEntries.join(',\n')}\n];\n`;
  fs.writeFileSync(dataFile, injectedCode);
  console.log(`\nSuccess! Added ${newEntries.length} hyper-organized photos to your portfolio.`);
} else {
  console.log('\nNo new photos found. Your grid is fully up to date!');
}