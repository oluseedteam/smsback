import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from '@babel/parser';

const projectRoot = path.resolve(import.meta.dirname, '..');
const frontendRoot = path.join(projectRoot, 'resources', 'js');

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listSourceFiles(fullPath)
      : /\.(?:js|jsx)$/.test(entry.name)
        ? [fullPath]
        : [];
  });
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((child) => walk(child, visit));
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      walk(value, visit);
    }
  }
}

function endpointPattern(node) {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type !== 'TemplateLiteral') return null;

  return node.quasis
    .map((quasi, index) => quasi.value.cooked + (index < node.expressions.length ? '{value}' : ''))
    .join('');
}

function requestMethod(optionsNode, defaultMethod = 'GET') {
  if (optionsNode?.type !== 'ObjectExpression') return defaultMethod;
  const methodProperty = optionsNode.properties.find((property) => {
    if (property.type !== 'ObjectProperty') return false;
    return property.key?.name === 'method' || property.key?.value === 'method';
  });
  return methodProperty?.value?.type === 'StringLiteral'
    ? methodProperty.value.value.toUpperCase()
    : defaultMethod;
}

const calls = [];
for (const file of listSourceFiles(frontendRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  walk(ast, (node) => {
    if (node.type !== 'CallExpression' || node.callee?.type !== 'Identifier') return;
    if (!['apiFetch', 'downloadApiFile'].includes(node.callee.name)) return;

    const endpoint = endpointPattern(node.arguments[0]);
    if (!endpoint) return;

    calls.push({
      // A trailing template expression without a slash is an optional query
      // suffix (for example `${query ? `?${query}` : ''}`).
      endpoint: endpoint.split('?')[0].replace(/(?<!\/)\{value\}$/, ''),
      method: requestMethod(node.arguments[1]),
      file: path.relative(projectRoot, file),
      line: node.loc?.start.line ?? 1,
    });
  });
}

const routeProcess = spawnSync('php', ['artisan', 'route:list', '--json'], {
  cwd: projectRoot,
  encoding: 'utf8',
});

if (routeProcess.status !== 0) {
  process.stderr.write(routeProcess.stderr || routeProcess.stdout);
  process.exit(routeProcess.status || 1);
}

const apiRoutes = JSON.parse(routeProcess.stdout)
  .filter((route) => route.uri.startsWith('api/'))
  .map((route) => ({
    endpoint: `/${route.uri.slice(4)}`,
    methods: route.method.split('|'),
  }));

function routeMatches(route, call) {
  if (!route.methods.includes(call.method)) return false;
  const expression = route.endpoint
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{[^}]+\\\}/g, '[^/]+');
  return new RegExp(`^${expression}$`).test(call.endpoint.replace(/\{value\}/g, 'value'));
}

const missing = calls.filter((call) => !apiRoutes.some((route) => routeMatches(route, call)));

if (missing.length > 0) {
  console.error('Frontend API calls without a matching Laravel route:');
  missing.forEach((call) => {
    console.error(`- ${call.method} ${call.endpoint} (${call.file}:${call.line})`);
  });
  process.exit(1);
}

console.log(`Route contract verified for ${calls.length} frontend API call sites.`);
