const fs = require('fs');
const path = require('path');

// Main project root
const ROOT_DIR = process.cwd();

const ROUTES_DIR = path.join(ROOT_DIR, 'routes');
const CONTROLLERS_DIR = path.join(ROOT_DIR, 'controllers');
const MODELS_DIR = path.join(ROOT_DIR, 'models');
const MIDDLEWARES_DIR = path.join(ROOT_DIR, 'middlewares');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

function extractApiRoutesFromFile(fileContent) {
  const routeRegex = /(router|app)\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g;
  const routes = [];
  let match;
  while ((match = routeRegex.exec(fileContent))) {
    routes.push({
      method: match[2].toUpperCase(),
      route: match[3],
    });
  }
  return routes;
}

function extractFunctionsFromFile(fileContent) {
  const fnRegex = /exports\.(\w+)\s*=\s*async\s*\(/g;
  const fns = [];
  let match;
  while ((match = fnRegex.exec(fileContent))) {
    fns.push(match[1]);
  }
  return fns;
}

function extractModels(fileContent) {
  const modelRegex = /sequelize\.define\(['"`](.*?)['"`]/g;
  const results = [];
  let match;
  while ((match = modelRegex.exec(fileContent))) {
    results.push(match[1]);
  }
  return results;
}

// Parse files by category
function parseDirectory(targetDir, extractor) {
  const files = walk(targetDir);
  const data = [];

  files.forEach((filePath) => {
    const relPath = path.relative(ROOT_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const extracted = extractor(content);
    if (extracted.length > 0) {
      data.push({
        file: relPath,
        data: extracted,
      });
    }
  });

  return data;
}

// Full report structure
const report = {
  root: ROOT_DIR,
  createdAt: new Date().toISOString(),
  totalFiles: walk(ROOT_DIR).length,
  foldersAnalyzed: ['routes', 'controllers', 'models', 'middlewares'],
  apiRoutes: parseDirectory(ROUTES_DIR, extractApiRoutesFromFile),
  controllers: parseDirectory(CONTROLLERS_DIR, extractFunctionsFromFile),
  middlewares: parseDirectory(MIDDLEWARES_DIR, extractFunctionsFromFile),
  models: parseDirectory(MODELS_DIR, extractModels),
};

// Save report
const outputFile = path.join(ROOT_DIR, 'backend-analysis.json');
fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
console.log(`✅ backend-analysis.json generated in: ${outputFile}`);
