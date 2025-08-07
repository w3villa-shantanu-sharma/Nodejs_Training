import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the routes directory
const routesDir = path.join(__dirname, 'routes');

// Function to find routes in a file
function findRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Look for potential route definitions with URLs or colons
  const regex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      method: match[1],
      path: match[2],
      file: path.basename(filePath),
      line: getLineNumber(content, match.index)
    });
  }
  
  return matches;
}

// Function to get line number from index position in string
function getLineNumber(content, index) {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

// Process all route files
function scanRouteFiles() {
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  let allRoutes = [];
  
  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const routes = findRoutes(filePath);
    allRoutes = [...allRoutes, ...routes];
  }
  
  // Look for suspicious routes (with URLs or colons not used for parameters)
  const suspiciousRoutes = allRoutes.filter(route => {
    // Check for URLs with colons that don't follow parameter pattern
    if (route.path.includes('http') && route.path.includes(':')) return true;
    
    // Look for colons not followed by a parameter name
    const colonPositions = [...route.path.matchAll(/:/g)].map(m => m.index);
    for (const pos of colonPositions) {
      // If colon is at the end or followed by non-word character
      if (pos === route.path.length - 1 || !/\w/.test(route.path[pos + 1])) {
        return true;
      }
    }
    
    return false;
  });
  
  console.log('All routes:');
  console.log(allRoutes);
  
  console.log('\nSuspicious routes:');
  console.log(suspiciousRoutes);
}

scanRouteFiles();