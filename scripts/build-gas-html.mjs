import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, 'dist', 'assets');

if (!fs.existsSync(assetsDir) || !fs.readdirSync(assetsDir).some((f) => f.endsWith('.css'))) {
  console.log('1. Running vite build to extract compiled Tailwind v4 CSS...');
  execSync('npx vite build', { stdio: 'inherit' });
} else {
  console.log('1. Reusing compiled Tailwind v4 CSS from dist/assets...');
}

const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find((f) => f.endsWith('.css'));
if (!cssFile) {
  throw new Error('Compiled CSS file not found in dist/assets');
}
const compiledCss = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');

console.log('2. Bundling src/main.tsx with esbuild (externalizing CDN libraries via importmap)...');
const virtualRuntimeStubPlugin = {
  name: 'gas-compiled-html-stub',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, () => ({
      path: 'empty-css',
      namespace: 'css-stub'
    }));
    build.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({
      contents: '',
      loader: 'js'
    }));
    build.onResolve({ filter: /gasCompiledHtml/ }, () => ({
      path: 'gasCompiledHtml-stub',
      namespace: 'gas-stub'
    }));
    build.onLoad({ filter: /.*/, namespace: 'gas-stub' }, () => ({
      contents: `
        export const COMPILED_GAS_INDEX_HTML = '';
        export function getCompiledGasIndexHtml() {
          if (typeof document !== 'undefined' && document.documentElement) {
            return '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
          }
          return '';
        }
      `,
      loader: 'ts'
    }));
  }
};

const bundleResult = await esbuild.build({
  entryPoints: [path.join(rootDir, 'src', 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  write: false,
  jsx: 'automatic',
  plugins: [virtualRuntimeStubPlugin],
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.VITE_APPS_SCRIPT_URL': '""'
  },
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    'lucide-react',
    'recharts',
    'jspdf',
    'jspdf-autotable',
    'xlsx',
    'canvas-confetti'
  ]
});

const rawJs = bundleResult.outputFiles[0].text;
// Prevent any accidental </script closing tag inside inline JS
const safeInlineJs = rawJs.replace(/<\/script/gi, '<\\/script');

const importMap = {
  imports: {
    'react': 'https://esm.sh/react@19.0.1',
    'react/jsx-runtime': 'https://esm.sh/react@19.0.1/jsx-runtime',
    'react-dom': 'https://esm.sh/react-dom@19.0.1',
    'react-dom/client': 'https://esm.sh/react-dom@19.0.1/client',
    'lucide-react': 'https://esm.sh/lucide-react@0.546.0?external=react,react-dom',
    'recharts': 'https://esm.sh/recharts@3.10.1?external=react,react-dom',
    'jspdf': 'https://esm.sh/jspdf@4.2.1',
    'jspdf-autotable': 'https://esm.sh/jspdf-autotable@5.0.8',
    'xlsx': 'https://esm.sh/xlsx@0.18.5',
    'canvas-confetti': 'https://esm.sh/canvas-confetti@1.9.4'
  }
};

const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>44S Ops_pro - Sistem Manajemen Terpadu Operasional Kendaraan &amp; Rekening Kas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style id="44s-ops-tailwind-css">
${compiledCss}
  </style>
  <script type="importmap">
${JSON.stringify(importMap, null, 2)}
  </script>
</head>
<body class="bg-slate-100 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
  <div id="root"></div>
  <script type="module">
${safeInlineJs}
  </script>
</body>
</html>`;

const outTsPath = path.join(rootDir, 'src', 'utils', 'gasCompiledHtml.ts');
const tsContent = `// ============================================================================
// AUTO-GENERATED FULL REACT APPLICATION BUNDLE FOR GOOGLE APPS SCRIPT (Index.html)
// Renders the 100% identical React UI, Sidebar, Header, 16 Modules, Print Preview & RBAC
// ============================================================================

export const COMPILED_GAS_INDEX_HTML: string = ${JSON.stringify(fullHtml)};

export function getCompiledGasIndexHtml(): string {
  if (COMPILED_GAS_INDEX_HTML && COMPILED_GAS_INDEX_HTML.length > 500) {
    return COMPILED_GAS_INDEX_HTML;
  }
  if (typeof document !== 'undefined' && document.documentElement) {
    return '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
  }
  return '';
}
`;

fs.writeFileSync(outTsPath, tsContent, 'utf8');
console.log(`3. Successfully wrote ${Math.round(fullHtml.length / 1024)} KB full React Index.html into src/utils/gasCompiledHtml.ts!`);
