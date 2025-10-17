const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Starting build process...');

const clientDir = path.join(__dirname, 'client');
const distDir = path.join(clientDir, 'dist');

try {
  // Check if client directory exists
  if (!fs.existsSync(clientDir)) {
    console.error('❌ Client directory not found!');
    process.exit(1);
  }

  console.log('📦 Installing client dependencies...');
  execSync('npm install', { 
    cwd: clientDir, 
    stdio: 'inherit',
    shell: true 
  });

  console.log('⚛️  Building React app...');
  execSync('npm run build', { 
    cwd: clientDir, 
    stdio: 'inherit',
    shell: true 
  });

  // Verify dist folder was created
  if (fs.existsSync(distDir)) {
    console.log('✅ Build successful!');
    console.log(`📁 Static files created in: ${distDir}`);
    
    // List files in dist
    const files = fs.readdirSync(distDir);
    console.log('📄 Files:', files.join(', '));
  } else {
    console.error('❌ Build failed - dist folder not created!');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Build error:', error.message);
  process.exit(1);
}
