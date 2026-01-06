// Simple validation script to check for common JavaScript issues
const fs = require('fs');

function validateJavaScript() {
    try {
        const scriptContent = fs.readFileSync('scripts.js', 'utf8');
        
        // Check for common issues
        const issues = [];
        
        // Check for unclosed brackets
        const openBrackets = (scriptContent.match(/\{/g) || []).length;
        const closeBrackets = (scriptContent.match(/\}/g) || []).length;
        if (openBrackets !== closeBrackets) {
            issues.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
        }
        
        // Check for unclosed parentheses
        const openParens = (scriptContent.match(/\(/g) || []).length;
        const closeParens = (scriptContent.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            issues.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
        }
        
        // Check for duplicate function declarations
        const functionMatches = scriptContent.match(/function\s+(\w+)/g);
        if (functionMatches) {
            const functionNames = functionMatches.map(match => match.replace('function ', ''));
            const duplicates = functionNames.filter((name, index) => functionNames.indexOf(name) !== index);
            if (duplicates.length > 0) {
                issues.push(`Duplicate functions: ${[...new Set(duplicates)].join(', ')}`);
            }
        }
        
        // Check for console.log statements (should be warnings in production)
        const consoleLogs = (scriptContent.match(/console\.log/g) || []).length;
        if (consoleLogs > 0) {
            issues.push(`Found ${consoleLogs} console.log statements (consider removing for production)`);
        }
        
        if (issues.length === 0) {
            console.log('✅ JavaScript validation passed - no major issues found');
        } else {
            console.log('⚠️  JavaScript validation found issues:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        return issues.length === 0;
        
    } catch (error) {
        console.error('❌ Error validating JavaScript:', error.message);
        return false;
    }
}

// Run validation
validateJavaScript();