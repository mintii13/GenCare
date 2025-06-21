const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Emoji mapping
const emojiReplacements = {
  '📅': '<Icon name="📅" />',
  '✅': '<Icon name="✅" />',
  '⏳': '<Icon name="⏳" />',
  '🔍': '<Icon name="🔍" />',
  '📊': '<Icon name="📊" />',
  '←': '<Icon name="←" />',
  '→': '<Icon name="→" />',
  '📋': '<Icon name="📋" />',
  '📝': '<Icon name="📝" />',
  '📄': '<Icon name="📄" />',
  '✕': '<Icon name="✕" />',
  '🔄': '<Icon name="🔄" />',
  '💾': '<Icon name="💾" />',
  '👤': '<Icon name="👤" />',
  '⚙️': '<Icon name="⚙️" />',
  '🏠': '<Icon name="🏠" />',
  '📞': '<Icon name="📞" />',
  '📧': '<Icon name="📧" />',
  '🔒': '<Icon name="🔒" />',
  '🔓': '<Icon name="🔓" />',
  '🚫': '<Icon name="🚫" />',
  '⚠️': '<Icon name="⚠️" />',
  '🚀': '<Icon name="🚀" />',
  '⏰': '<Icon name="⏰" />',
  'ℹ️': '<Icon name="ℹ️" />',
  '🧹': '<Icon name="🧹" />',
  '❌': '<Icon name="❌" />',
  '🚨': '<Icon name="🚨" />'
};

// Function to add Icon import if not exists
function addIconImport(content) {
  const importStatement = "import Icon from '../../../components/icons/IconMapping';";
  const iconImportRegex = /import.*Icon.*from.*IconMapping/;
  
  if (!iconImportRegex.test(content)) {
    // Find the last import statement
    const importLines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ') && !importLines[i].includes('//')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      importLines.splice(lastImportIndex + 1, 0, importStatement);
      return importLines.join('\n');
    }
  }
  
  return content;
}

// Function to replace emojis in file content
function replaceEmojisInContent(content) {
  let updatedContent = content;
  let hasChanges = false;
  
  // Replace standalone emojis in JSX
  for (const [emoji, replacement] of Object.entries(emojiReplacements)) {
    const regex = new RegExp(`(?<!\\w)${emoji}(?!\\w)`, 'g');
    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(regex, replacement);
      hasChanges = true;
    }
  }
  
  // Add Icon import if changes were made
  if (hasChanges) {
    updatedContent = addIconImport(updatedContent);
  }
  
  return { content: updatedContent, hasChanges };
}

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: updatedContent, hasChanges } = replaceEmojisInContent(content);
    
    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  Skipped: ${filePath} (no emojis found)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 Starting emoji replacement...');
  
  // Find all .tsx files in src directory
  const pattern = path.join(__dirname, '../**/*.tsx');
  const files = glob.sync(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/components/icons/**' // Skip our icon mapping file
    ]
  });
  
  console.log(`📁 Found ${files.length} .tsx files`);
  
  let updatedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      updatedCount++;
    }
  });
  
  console.log(`\n🎉 Completed! Updated ${updatedCount} files out of ${files.length} total files.`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { replaceEmojisInContent, addIconImport };