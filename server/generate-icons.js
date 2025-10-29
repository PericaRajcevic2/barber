// Simple SVG-based icon generator for PWA
// Run this to generate placeholder icons: node generate-icons.js

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'client', 'public', 'icons');

// Create icons directory
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon
function generateSVGIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#1e40af" rx="${size * 0.2}"/>
  
  <!-- Scissors Icon (Barber Symbol) -->
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <!-- Left Blade -->
    <circle cx="${-size * 0.15}" cy="${-size * 0.15}" r="${size * 0.12}" fill="white" opacity="0.9"/>
    <circle cx="${-size * 0.15}" cy="${-size * 0.15}" r="${size * 0.06}" fill="#1e40af"/>
    
    <!-- Right Blade -->
    <circle cx="${size * 0.15}" cy="${size * 0.15}" r="${size * 0.12}" fill="white" opacity="0.9"/>
    <circle cx="${size * 0.15}" cy="${size * 0.15}" r="${size * 0.06}" fill="#1e40af"/>
    
    <!-- Center Screw -->
    <circle cx="0" cy="0" r="${size * 0.05}" fill="white"/>
    
    <!-- Lines connecting handles to blades -->
    <line x1="${-size * 0.08}" y1="${-size * 0.08}" x2="0" y2="0" stroke="white" stroke-width="${size * 0.02}" stroke-linecap="round"/>
    <line x1="${size * 0.08}" y1="${size * 0.08}" x2="0" y2="0" stroke="white" stroke-width="${size * 0.02}" stroke-linecap="round"/>
  </g>
  
  <!-- Text -->
  <text x="${size * 0.5}" y="${size * 0.85}" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" fill="white" text-anchor="middle">BARBER</text>
</svg>`;
}

// Generate PNG from SVG (simplified - just save SVG)
sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.png.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ Generated ${size}x${size} icon (SVG format - rename to .png if needed)`);
});

console.log('\n📝 Note: These are SVG files. For production, convert to PNG using:');
console.log('   - Online tools: cloudconvert.com, convertio.co');
console.log('   - Or install sharp/jimp: npm install sharp');
console.log('\nFor now, you can rename .png.svg to .svg and they will work in most browsers.');
