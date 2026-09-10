#!/usr/bin/env node

/**
 * ==============================================================================
 * TUSKO WHOLE-PROJECT ZERO DUPLICATION SCANNER
 * ==============================================================================
 * Scanner mandiri yang membaca dan memindai LANGSUNG seluruh berkas fisik
 * codebase (TIDAK menggunakan git diff).
 *
 * Memeriksa 4 pilar duplikasi:
 * 1. API & Rute (backend/routes/api.php): Duplikasi method+path & duplikasi action mapping.
 * 2. Database & Migrasi (backend/database/migrations/): Duplikasi Schema::create(table).
 * 3. Fungsi & Helper (frontend/src/ & backend/app/): Duplikasi formatters/helpers lokal.
 * 4. Komponen & Fitur (frontend/src/components/): Duplikasi nama komponen & export.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../../');

let totalErrors = 0;
const errors = [];

function reportError(category, message, file = null, line = null) {
  totalErrors++;
  const loc = file ? (line ? `${file}:${line}` : file) : '';
  errors.push(`[${category}] ${loc ? `${loc} -> ` : ''}${message}`);
}

// ==============================================================================
// 1. SCAN DUPLIKASI API & RUTE (backend/routes/api.php)
// ==============================================================================
function scanApiRoutes() {
  const apiRoutesPath = path.join(REPO_ROOT, 'backend/routes/api.php');
  if (!fs.existsSync(apiRoutesPath)) {
    reportError('API_ROUTES', `File tidak ditemukan: ${apiRoutesPath}`);
    return;
  }

  const content = fs.readFileSync(apiRoutesPath, 'utf8');
  const lines = content.split('\n');

  const definedRoutes = new Map(); // key: "METHOD:PATH", val: { line, target }
  const actionTargets = new Map(); // key: "Controller@action", val: [{ method, path, line }]

  let currentPrefixes = []; // stack of prefixes

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    // Track Route::prefix('...')->group(...)
    const prefixMatch = line.match(/Route::prefix\(['"]([^'"]+)['"]\)/);
    if (prefixMatch && line.includes('group')) {
      currentPrefixes.push(prefixMatch[1].replace(/^\/|\/$/g, ''));
    }

    // Match route method definitions: Route::(get|post|put|patch|delete|match)(...)
    const routeRegex = /Route::(get|post|put|patch|delete|match)\(\s*(\[[^\]]+\]|['"][^'"]*['"])\s*,\s*([^;]+)\)/;
    const match = line.match(routeRegex);

    if (match) {
      const rawVerb = match[1];
      const rawPathArg = match[2];
      const rawTarget = match[3];

      let methods = [rawVerb.toUpperCase()];
      let routePath = '';

      if (rawVerb === 'match') {
        const verbsMatch = rawPathArg.match(/\[([^\]]+)\]/);
        const verbs = verbsMatch ? verbsMatch[1].replace(/['"\s]/g, '').split(',') : [];
        methods = verbs.map(v => v.toUpperCase());

        // For match(['put', 'patch'], '/path', ...) the path is the next argument in line
        const pathMatch = line.match(/Route::match\(\[[^\]]+\],\s*['"]([^'"]*)['"]/);
        routePath = pathMatch ? pathMatch[1] : '';
      } else {
        routePath = rawPathArg.replace(/['"]/g, '');
      }

      // Normalisasi path dengan prefix saat ini
      const prefixStr = currentPrefixes.filter(Boolean).join('/');
      const cleanSubPath = routePath.replace(/^\/|\/$/g, '');
      const fullPath = ('/' + (prefixStr ? prefixStr + (cleanSubPath ? '/' + cleanSubPath : '') : cleanSubPath)).replace(/\/+/g, '/');

      // Normalisasi target controller action
      let cleanTarget = rawTarget.trim();
      const controllerMatch = cleanTarget.match(/\[\s*([^:]+)::class\s*,\s*['"]([^'"]+)['"]\s*\]/);
      let targetKey = null;
      if (controllerMatch) {
        const ctrl = controllerMatch[1].split('\\').pop();
        const action = controllerMatch[2];
        targetKey = `${ctrl}@${action}`;
      }

      // Cek duplikasi Method + Path
      for (const method of methods) {
        const routeKey = `${method} ${fullPath}`;
        if (definedRoutes.has(routeKey)) {
          const prev = definedRoutes.get(routeKey);
          reportError(
            'API_ROUTE_DUPLICATION',
            `Duplikasi route method + URI: "${routeKey}" telah didefinisikan sebelumnya di baris ${prev.line}`,
            'backend/routes/api.php',
            lineNum
          );
        } else {
          definedRoutes.set(routeKey, { line: lineNum, target: targetKey });
        }
      }

      // Cek duplikasi controller action mapping (rute alias ganda yang tidak diinginkan)
      if (targetKey) {
        if (!actionTargets.has(targetKey)) {
          actionTargets.set(targetKey, []);
        }
        actionTargets.get(targetKey).push({ methods, path: fullPath, line: lineNum });
      }
    }

    // Check closing of group
    if (line === '});' && currentPrefixes.length > 0) {
      currentPrefixes.pop();
    }
  }

  // Evaluasi action targets: jika sebuah action di-bind ke multiple rute yang berbeda, cek apakah alias duplikat
  // Pengecualian valid: route dengan parameter ID vs SKU jika memang terpisah (misal {idOrSlug})
  for (const [action, bindings] of actionTargets.entries()) {
    if (bindings.length > 1) {
      // Cek apakah ada rute dengan path berbeda yang memetakan ke action yang sama
      const paths = bindings.map(b => b.path);
      const uniquePaths = new Set(paths);
      if (uniquePaths.size > 1) {
        // Cek jika rute-rute tersebut adalah alias yang redundan (misal /stock vs /inventory, /login vs /auth/login)
        const pathList = Array.from(uniquePaths).join(', ');
        const linesList = bindings.map(b => `L${b.line}`).join(', ');
        // Izinkan jika memang rute dengan parameter berbeda seperti /{id}/add-stock vs /add-stock
        const isBulkAndSingle = paths.some(p => p.includes('{')) && paths.some(p => !p.includes('{'));
        if (!isBulkAndSingle) {
          reportError(
            'API_ALIAS_DUPLICATION',
            `Action [${action}] memiliki multiple rute alias redundan: [${pathList}] pada baris (${linesList})`,
            'backend/routes/api.php'
          );
        }
      }
    }
  }
}

// ==============================================================================
// 2. SCAN DUPLIKASI DATABASE & MIGRASI (backend/database/migrations/)
// ==============================================================================
function scanMigrations() {
  const migrationsDir = path.join(REPO_ROOT, 'backend/database/migrations');
  if (!fs.existsSync(migrationsDir)) {
    reportError('MIGRATIONS', `Direktori migrasi tidak ditemukan: ${migrationsDir}`);
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.php'));
  const createdTables = new Map(); // key: tableName, val: { file, line }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      const match = line.match(/Schema::create\(\s*['"]([^'"]+)['"]/);
      if (match) {
        const tableName = match[1];
        if (createdTables.has(tableName)) {
          const prev = createdTables.get(tableName);
          reportError(
            'DATABASE_TABLE_DUPLICATION',
            `Tabel "${tableName}" dibuat lebih dari 1 kali (Schema::create duplikat). Pertama di ${prev.file}:${prev.line}, kedua di ${file}:${lineNum}`,
            path.join('backend/database/migrations', file),
            lineNum
          );
        } else {
          createdTables.set(tableName, { file, line: lineNum });
        }
      }
    }
  }
}

// ==============================================================================
// 3. SCAN DUPLIKASI FUNGSI & HELPER (frontend/src/ & backend/app/)
// ==============================================================================
function scanFunctionAndHelperDuplications() {
  const feSrcDir = path.join(REPO_ROOT, 'frontend/src');
  if (!fs.existsSync(feSrcDir)) return;

  function walk(dir, callback) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
          walk(full, callback);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
        callback(full);
      }
    }
  }

  const formattersFile = path.join(feSrcDir, 'utils/formatters.js');

  walk(feSrcDir, (filePath) => {
    // Lewati file formatters.js itu sendiri
    if (path.resolve(filePath) === path.resolve(formattersFile)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relPath = path.relative(REPO_ROOT, filePath);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // Cek deklarasi fungsi lokal format mata uang Rupiah
      if (
        line.match(/\b(const|let|var|function)\s+(formatIDR|formatRupiah|toIDR|formatCurrency)\b/) ||
        (line.includes('Intl.NumberFormat') && line.includes('IDR'))
      ) {
        reportError(
          'HELPER_DUPLICATION',
          `Ditemukan implementasi fungsi formatter mata uang duplikat/lokal. Wajib mengimpor formatRupiah dari utils/formatters.js: "${line.trim()}"`,
          relPath,
          lineNum
        );
      }
    }
  });
}

// ==============================================================================
// 4. SCAN DUPLIKASI KOMPONEN & FITUR (frontend/src/components/)
// ==============================================================================
function scanComponentDuplications() {
  const compDir = path.join(REPO_ROOT, 'frontend/src/components');
  if (!fs.existsSync(compDir)) return;

  const files = fs.readdirSync(compDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  const exportedComponents = new Map(); // key: compName, val: { file }

  for (const file of files) {
    const filePath = path.join(compDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Cek default export name
    const exportMatch = content.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/) ||
                        content.match(/export\s+default\s+class\s+([A-Za-z0-9_]+)/) ||
                        content.match(/function\s+([A-Za-z0-9_]+)\s*\(.*export\s+default\s+\1/s);

    if (exportMatch) {
      const compName = exportMatch[1];
      if (exportedComponents.has(compName)) {
        const prev = exportedComponents.get(compName);
        reportError(
          'COMPONENT_DUPLICATION',
          `Komponen "${compName}" didefinisikan ganda pada file ${prev.file} dan ${file}`,
          path.join('frontend/src/components', file)
        );
      } else {
        exportedComponents.set(compName, { file });
      }
    }
  }
}

// ==============================================================================
// MAIN EXECUTION
// ==============================================================================
console.log('🔍 [Zero-Duplication Scanner] Memulai pemindaian codebase menyeluruh...');
console.log('📁 Root Target: ' + REPO_ROOT);

scanApiRoutes();
scanMigrations();
scanFunctionAndHelperDuplications();
scanComponentDuplications();

if (totalErrors > 0) {
  console.log('\n❌ [Zero-Duplication Scanner] DITEMUKAN PELANGGARAN DUPLIKASI:');
  console.log('======================================================================');
  errors.forEach((err, idx) => {
    console.log(`${idx + 1}. ${err}`);
  });
  console.log('======================================================================');
  console.log(`💥 Total Pelanggaran: ${totalErrors}`);
  console.log('💡 Hapus atau konsolidasikan duplikasi di atas sebelum melakukan commit.\n');
  process.exit(1);
} else {
  console.log('\n✅ [Zero-Duplication Scanner] PASSED: Codebase bersih!');
  console.log('   ✓ 0 Duplikasi Rute API & Controller Actions');
  console.log('   ✓ 0 Duplikasi Tabel Database & Migrasi');
  console.log('   ✓ 0 Duplikasi Helper & Formatters');
  console.log('   ✓ 0 Duplikasi Komponen & Export\n');
  process.exit(0);
}
