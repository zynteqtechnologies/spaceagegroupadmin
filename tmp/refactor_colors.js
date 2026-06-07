const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, '../app/(protected)'),
    path.join(__dirname, '../components')
];

const colorMap = {
  // Backgrounds
  'bg-\\[#F5F0E8\\]': 'bg-slate-50',
  'bg-\\[#0B1528\\]': 'bg-slate-900',
  'bg-\\[#B8A882\\]': 'bg-blue-500',
  
  // Text Colors
  'text-\\[#0B1528\\]': 'text-slate-900',
  'text-\\[#3D3420\\]': 'text-slate-700',
  'text-\\[#6B5E42\\]': 'text-slate-600',
  'text-\\[#8A8070\\]': 'text-slate-400',
  'text-\\[#E8DEC0\\]': 'text-white',
  'text-\\[#B8A882\\]': 'text-blue-500',

  // Borders
  'border-\\[#EDE8DF\\]': 'border-slate-100',
  'border-\\[#D9D0BC\\]': 'border-slate-200'
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

console.log(`Refactoring complete. Modified ${modifiedFiles} files.`);
