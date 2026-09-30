/**
 * Utilitas pen-generate SKU produk & varian (bukan data mock).
 */

export function generateProductSku(categorySlug = 'gen', name = '', existingProducts = []) {
  const catCode = (categorySlug || 'GEN').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'GEN';
  const nameCode = (name || 'PRD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRD';
  const prefix = `TSK-${catCode}-${nameCode}`;

  const existingSet = new Set();
  if (Array.isArray(existingProducts)) {
    existingProducts.forEach((p) => {
      if (p?.sku) existingSet.add(p.sku.toUpperCase());
      if (Array.isArray(p?.variants)) {
        p.variants.forEach((v) => {
          if (v?.sku) existingSet.add(v.sku.toUpperCase());
        });
      }
    });
  }

  let seq = 1;
  let candidate = `${prefix}-${seq.toString().padStart(3, '0')}`;

  while (existingSet.has(candidate)) {
    seq++;
    if (seq <= 999) {
      candidate = `${prefix}-${seq.toString().padStart(3, '0')}`;
    } else {
      candidate = `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
      if (!existingSet.has(candidate)) break;
    }
  }

  return candidate;
}

export function generateVariantSku(baseSku = 'TSK-PRD', attributes = [], existingProducts = [], takenSkus = new Set()) {
  const cleanBase = (baseSku || 'TSK-PRD').trim().toUpperCase();

  let suffix = '';
  if (Array.isArray(attributes)) {
    suffix = attributes
      .map((val) => String(val || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase())
      .filter(Boolean)
      .join('-');
  } else if (typeof attributes === 'string') {
    suffix = attributes.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  }

  const rawCandidate = suffix ? `${cleanBase}-${suffix}` : `${cleanBase}-VAR`;

  const existingSet = new Set();
  if (cleanBase) existingSet.add(cleanBase);
  if (takenSkus instanceof Set) {
    takenSkus.forEach((s) => {
      if (s) existingSet.add(String(s).toUpperCase());
    });
  }

  if (Array.isArray(existingProducts)) {
    existingProducts.forEach((p) => {
      if (p?.sku) existingSet.add(p.sku.toUpperCase());
      if (Array.isArray(p?.variants)) {
        p.variants.forEach((v) => {
          if (v?.sku) existingSet.add(v.sku.toUpperCase());
        });
      }
    });
  }

  if (!existingSet.has(rawCandidate.toUpperCase())) {
    return rawCandidate.toUpperCase();
  }

  let counter = 1;
  let candidate = `${rawCandidate}-${String(counter).padStart(2, '0')}`;
  while (existingSet.has(candidate.toUpperCase())) {
    counter++;
    if (counter <= 99) {
      candidate = `${rawCandidate}-${String(counter).padStart(2, '0')}`;
    } else {
      candidate = `${rawCandidate}-${Date.now().toString(36).toUpperCase().slice(-3)}${Math.floor(10 + Math.random() * 90)}`;
      if (!existingSet.has(candidate.toUpperCase())) break;
    }
  }

  return candidate.toUpperCase();
}
