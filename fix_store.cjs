const fs = require('fs');
let content = fs.readFileSync('src/store/useStore.ts', 'utf8');
const lines = content.split('\n');

const fixLine = (i, replacement) => {
  if (lines[i] !== undefined) lines[i] = replacement;
}

fixLine(37, '  cost: number; // Costo base (lote)'); // index 37 is line 38
fixLine(41, '  series: string[];');
fixLine(43, '  batchId?: string;');
fixLine(44, '  description?: string;');
fixLine(45, '  location?: string; // Pasillo/Estante');
fixLine(46, '}');

fixLine(114, '  price: number; // The price it was actually sold at');
fixLine(116, '}');

fixLine(189, '  // Existing Actions');
for (let i = 190; i <= 211; i++) {
  lines[i] = lines[i].replace(/^\s*\/\/\s*/, '  ');
}
fixLine(214, '}');

fixLine(430, '    // Calculate margins for internal tracking');
fixLine(431, '    let totalSaleCost = 0;');

fixLine(440, '        // Calculate costs for this product');
fixLine(441, '        let acquisitionCost = product.cost;');

fixLine(481, '    // Sync to Firebase');

fixLine(678, '        // Si hay series nuevas, agregarlas (esto funciona mejor si las provee NuevaCompra)');

fixLine(775, '    if (isFirebaseConfigured) {'); // Wait is it line 775?

fs.writeFileSync('src/store/useStore.ts', lines.join('\n'));
