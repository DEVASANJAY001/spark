const fs = require('fs');
const path = require('path');

const srcDir = 'c:/projects/gets/mobile/src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Usage: looking for Alert.alert or Alert as a standalone word
    // (excluding strings and comments would be better but let's stick to simple first)
    const hasAlertUsage = /Alert\./.test(content) || /\sAlert[,}]/.test(content) || /[,{]Alert\s/.test(content);
    
    // Import: looking for Alert inside react-native import block
    // Matches: import { ..., Alert, ... } from 'react-native' (single or multi line)
    const rnImportMatch = content.match(/import\s*\{[^}]*Alert[^}]*\}\s*from\s*['"]react-native['"]/s);
    const rnRequireMatch = content.match(/(const|var|let)\s*\{[^}]*Alert[^}]*\}\s*=\s*require\(['"]react-native['"]\)/s);
    
    const hasAlertImport = !!(rnImportMatch || rnRequireMatch);
    
    if (hasAlertUsage && !hasAlertImport) {
        console.log(`CRITICAL: Alert used but not imported in: ${file}`);
    }
});
