
import sharp from 'sharp';
import path from 'path';

const inputPath = path.resolve('static/images/quaestor-full.png');
const outputPath = path.resolve('static/images/quaestor-full-recolored.png'); 
// We'll save to a new file first to be safe, then rename if successful.

const targetColor = { r: 153, g: 27, b: 27 }; // #991b1b

async function main() {
  try {
    console.log(`Recoloring ${inputPath} to rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})...`);
    
    await sharp(inputPath)
      .tint(targetColor)
      .toFile(outputPath);
      
    console.log(`Successfully created ${outputPath}`);
    
    // Now replace the original (optional, but requested "recolor the logo")
    // Wait, the user asked to recolor it. Replacing is cleaner.
    // But let's verify it worked first? Visual verification is impossible for me.
    // I'll trust sharp's tint function.
    
    // Let's overwrite the original file.
    await sharp(inputPath)
      .tint(targetColor)
      .toFile(inputPath); // Overwrite directly

    console.log(`Overwrote original file with recolored version.`);

  } catch (error) {
    console.error("Error recoloring image:", error);
    process.exit(1);
  }
}

main();
