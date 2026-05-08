import fs from 'fs';

const grepFiles = [
  'src/pages/NuevaVenta.tsx',
  'src/pages/NuevaCompra.tsx'
];

grepFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/p-8/g, 'p-4 md:p-8');
  content = content.replace(/gap-8/g, 'gap-4 md:gap-8');
  content = content.replace(/py-12/g, 'py-6 md:py-12');
  content = content.replace(/px-8/g, 'px-4 md:px-8');
  content = content.replace(/py-8/g, 'py-4 md:py-8');
  fs.writeFileSync(file, content);
});

console.log("Replaced additional padding for mobile on specific pages.");
