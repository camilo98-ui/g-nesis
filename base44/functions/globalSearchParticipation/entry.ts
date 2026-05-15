import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, store_code, limit = 10 } = await req.json();

    if (!query || !store_code) {
      return Response.json({ error: 'query and store_code required' }, { status: 400 });
    }

    // Obtener todos los reportes de participación
    const allReports = await base44.entities.SalesReport.list('-uploaded_at', 5000);
    
    const normalizedQuery = query.toLowerCase().trim();
    const normalizedStoreCode = store_code.toUpperCase().replace(/BOGOTA/g, 'BTA').trim();

    // Filtrar por tienda
    const storeReports = allReports.filter(r => {
      const normalizedCode = (r.store_code || '').toUpperCase().replace(/BOGOTA/g, 'BTA').trim();
      return normalizedCode === normalizedStoreCode || 
             normalizedCode.replace(/\s/g, '') === normalizedStoreCode.replace(/\s/g, '');
    });

    // Índice global: buscar en departamentos, secciones y productos
    const departmentResults = new Map();
    const sectionResults = new Map();
    const productResults = new Map();

    storeReports.forEach(r => {
      const dept = r.department || 'Sin categoría';
      const section = r.section || 'Sin sección';
      const product = r.product || 'Sin nombre';

      // Búsqueda en departamento
      if (dept.toLowerCase().includes(normalizedQuery)) {
        const deptKey = dept;
        if (!departmentResults.has(deptKey)) {
          departmentResults.set(deptKey, {
            type: 'department',
            name: dept,
            total_sales: 0,
            total_units: 0,
            product_count: new Set(),
            months: new Set(),
            records: []
          });
        }
        const deptData = departmentResults.get(deptKey);
        deptData.total_sales += r.total_sales || 0;
        deptData.total_units += r.units_sold || 0;
        deptData.product_count.add(product);
        if (r.month && r.year) deptData.months.add(`${r.month}/${r.year}`);
        deptData.records.push({
          month: r.month,
          year: r.year,
          sales: r.total_sales || 0,
          units: r.units_sold || 0,
          participation: r.participation || 0
        });
      }

      // Búsqueda en sección
      if (section.toLowerCase().includes(normalizedQuery)) {
        const sectionKey = `${dept}::${section}`;
        if (!sectionResults.has(sectionKey)) {
          sectionResults.set(sectionKey, {
            type: 'section',
            department: dept,
            name: section,
            total_sales: 0,
            total_units: 0,
            product_count: 0,
            months: new Set(),
            records: []
          });
        }
        const sectionData = sectionResults.get(sectionKey);
        sectionData.total_sales += r.total_sales || 0;
        sectionData.total_units += r.units_sold || 0;
        sectionData.product_count++;
        if (r.month && r.year) sectionData.months.add(`${r.month}/${r.year}`);
        sectionData.records.push({
          month: r.month,
          year: r.year,
          sales: r.total_sales || 0,
          units: r.units_sold || 0,
          participation: r.participation || 0
        });
      }

      // Búsqueda en producto
      if (product.toLowerCase().includes(normalizedQuery)) {
        const productKey = product;
        if (!productResults.has(productKey)) {
          productResults.set(productKey, {
            type: 'product',
            name: product,
            department: dept,
            section: section,
            total_sales: 0,
            total_units: 0,
            months: new Set(),
            records: []
          });
        }
        const productData = productResults.get(productKey);
        productData.total_sales += r.total_sales || 0;
        productData.total_units += r.units_sold || 0;
        if (r.month && r.year) productData.months.add(`${r.month}/${r.year}`);
        productData.records.push({
          month: r.month,
          year: r.year,
          sales: r.total_sales || 0,
          units: r.units_sold || 0,
          participation: r.participation || 0
        });
      }
    });

    // Construir resultados ordenados por relevancia (sales totales)
    const results = [
      ...Array.from(departmentResults.values()).map(d => ({
        ...d,
        months: Array.from(d.months).sort(),
        product_count: d.product_count.size,
        avg_participation: d.records.length > 0 ? (d.records.reduce((s, r) => s + r.participation, 0) / d.records.length).toFixed(2) : 0,
        trend: d.records.length > 1 ? (d.records[0].participation - d.records[d.records.length - 1].participation).toFixed(2) : 'N/A'
      })),
      ...Array.from(sectionResults.values()).map(s => ({
        ...s,
        months: Array.from(s.months).sort(),
        avg_participation: s.records.length > 0 ? (s.records.reduce((sum, r) => sum + r.participation, 0) / s.records.length).toFixed(2) : 0,
        trend: s.records.length > 1 ? (s.records[0].participation - s.records[s.records.length - 1].participation).toFixed(2) : 'N/A'
      })),
      ...Array.from(productResults.values()).map(p => ({
        ...p,
        months: Array.from(p.months).sort(),
        avg_participation: p.records.length > 0 ? (p.records.reduce((s, r) => s + r.participation, 0) / p.records.length).toFixed(2) : 0,
        trend: p.records.length > 1 ? (p.records[0].participation - p.records[p.records.length - 1].participation).toFixed(2) : 'N/A'
      }))
    ]
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, limit);

    return Response.json({
      found: results.length > 0,
      query: query,
      store_code: store_code,
      result_count: results.length,
      results: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});