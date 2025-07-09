const fs = require('fs');
const path = require('path');

// Simple GLB optimization script
function optimizeGLB(inputPath, outputPath) {
  console.log(`Processing ${inputPath}...`);
  
  // For now, let's just copy and rename to test deployment
  // We'll use online tools for actual compression
  const inputBuffer = fs.readFileSync(inputPath);
  
  // Basic validation
  const magic = inputBuffer.toString('ascii', 0, 4);
  if (magic !== 'glTF') {
    throw new Error(`Invalid GLB file: ${inputPath}`);
  }
  
  console.log(`✅ Valid GLB file: ${inputPath} (${inputBuffer.length} bytes)`);
  
  // For now, just copy the file (we'll compress online)
  fs.writeFileSync(outputPath, inputBuffer);
  console.log(`📁 Copied to: ${outputPath}`);
}

// Process all GLB files
const modelDir = './public/model';
const files = fs.readdirSync(modelDir).filter(f => f.endsWith('.glb') && !f.includes('compressed'));

files.forEach(file => {
  const inputPath = path.join(modelDir, file);
  const outputPath = path.join(modelDir, file.replace('.glb', '-temp.glb'));
  
  try {
    optimizeGLB(inputPath, outputPath);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});
