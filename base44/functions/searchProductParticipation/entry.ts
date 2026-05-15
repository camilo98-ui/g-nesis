import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchTerm, store_code, limit = 20 } = await req.json();

    if (!searchTerm || !store_code) {
      return Response.json({ error: 'searchTerm and store_code required' }, { status: 400 });
    }

    // Buscar en SalesReport (participación, ventas, productos)
    const allReports = await base44.entities.SalesReport.list('-uploaded_at', 5000);
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const filtered = allReports.filter(r => {
      const normalizedCode = (r.store_code || '').toUpperCase().replace(/BOGOTA/g, 'BTA').trim();
      const normalizedStoreSearch = store_code.toUpperCase().replace(/BOGOTA/g, 'BTA').trim();
      
      const storeMatch = normalizedCode === normalizedStoreSearch || 
                         normalizedCode.replace(/\s/g, '') === normalizedStoreSearch.replace(/\s/g, '');
      
      const productMatch = r.product && r.product.toLowerCase().includes(normalizedSearch);
      
      return storeMatch && productMatch;
    });

    if (filtered.length === 0) {
      return Response.json({
        found: false,
        message: `No se encontró "${searchTerm}" en la tienda ${store_code}`,
        results: []
      });
    }

    // Agrupar por producto y extraer info agregada
    const productMap = {};
    filtered.forEach(r => {
      const key = r.product || 'Sin nombre';
      if (!productMap[key]) {
        productMap[key] = {
          product_name: r.product,
          department: r.department || 'Sin categoría',
          section: r.section || 'Sin sección',
          total_sales: 0,
          total_units: 0,
          months: new Set(),
          records: []
        };
      }
      productMap[key].total_sales += r.total_sales || 0;
      productMap[key].total_units += r.units_sold || 0;
      if (r.month && r.year) {
        productMap[key].months.add(`${r.month}/${r.year}`);
      }
      productMap[key].records.push({
        month: r.month,
        year: r.year,
        sales: r.total_sales || 0,
        units: r.units_sold || 0,
        participation: r.participation || 0
      });
    });

    const results = Object.values(productMap)
      .map(p => ({
        product_name: p.product_name,
        department: p.department,
        section: p.section,
        total_sales: p.total_sales,
        total_units: p.total_units,
        months_in_report: Array.from(p.months).sort(),
        latest_participation: p.records[0]?.participation || 0,
        avg_participation: (p.records.reduce((sum, r) => sum + r.participation, 0) / p.records.length).toFixed(2),
        record_count: p.records.length,
        trend: p.records.length > 1 ? (p.records[0].participation - p.records[p.records.length - 1].participation).toFixed(2) : 'N/A'
      }))
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, limit);

    return Response.json({
      found: true,
      search_term: searchTerm,
      store_code: store_code,
      result_count: results.length,
      results: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});