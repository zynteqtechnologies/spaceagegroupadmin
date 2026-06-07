const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, '../app/(protected)'),
    path.join(__dirname, '../components')
];

const colorMap = {
  'bg-\\[#FAF8F3\\]': 'bg-[#f9fbfd]', // Main Canvas Background
  'border-\\[#B8A882\\]': 'border-blue-500' // Missed border color
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;

dirs.forEach(dir => {
    walkDir(dir, (filePath) => {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        for (const [oldClass, newClass] of Object.entries(colorMap)) {
            const regex = new RegExp(oldClass, 'g');
            newContent = newContent.replace(regex, newClass);
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath.replace(path.join(__dirname, '../'), '')}`);
            modifiedFiles++;
        }
    });
});

console.log(`Second pass complete. Modified ${modifiedFiles} files.`);
