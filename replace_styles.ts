import fs from 'fs';

const grepFiles = [
  'src/pages/Ventas.tsx',
  'src/pages/Stock.tsx',
  'src/pages/Contabilidad.tsx',
  'src/pages/Taller.tsx',
  'src/pages/Directorio.tsx',
  'src/pages/Dashboard.tsx'
];

grepFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/px-8 py-6/g, 'px-4 md:px-8 py-4 md:py-6');
  content = content.replace(/px-6 py-4/g, 'px-4 md:px-6 py-3 md:py-4');
  content = content.replace(/p-8/g, 'p-4 md:p-8');
  content = content.replace(/p-6/g, 'p-4 md:p-6');
  fs.writeFileSync(file, content);
});

console.log("Replaced table padding for mobile.");
