import fs from 'fs';

const grepFiles = [
  'src/pages/Stock.tsx',
  'src/pages/Taller.tsx'
];

grepFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/grid-cols-2 lg:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  content = content.replace(/grid grid-cols-1 xl:grid-cols-3 gap-4 md:p-8/g, 'grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8');
  fs.writeFileSync(file, content);
});

console.log("Replaced grids for mobile.");
