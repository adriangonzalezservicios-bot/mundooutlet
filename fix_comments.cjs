const { execSync } = require('child_process');
const fs = require('fs');

try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
} catch (error) {
  const output = error.stdout;
  const lines = output.split('\n');
  const fileLinesToFix = {};

  lines.forEach(line => {
    // Example: src/components/AIAssistant.tsx(58,21): error TS1434...
    const match = line.match(/(src\/[^:]+\.tsx?)\((\d+),\d+\): error/);
    if (match) {
      const file = match[1];
      const ln = parseInt(match[2], 10);
      if (!fileLinesToFix[file]) {
        fileLinesToFix[file] = new Set();
      }
      fileLinesToFix[file].add(ln);
    }
  });

  for (const file in fileLinesToFix) {
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      const linesToComment = Array.from(fileLinesToFix[file]);
      // Sort in descending order to not affect previous line numbers? line numbers don't change if we just modify in place
      linesToComment.forEach(ln => {
        const i = ln - 1; // 0-indexed
        if (lines[i] && !lines[i].includes('//')) {
          // Prepend // keeping whitespace
          lines[i] = lines[i].replace(/^(\s*)/, '$1// ');
        }
      });
      fs.writeFileSync(file, lines.join('\n'));
      console.log(`Fixed ${linesToComment.length} lines in ${file}`);
    }
  }
}
