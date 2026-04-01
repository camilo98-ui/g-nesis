import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const records = body.records;
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return Response.json({ error: 'No records provided' }, { status: 400 });
    }

    let totalInserted = 0;
    const chunkSize = 50;
    
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await base44.asServiceRole.entities.SalesReport.bulkCreate(chunk);
      totalInserted += chunk.length;
      await new Promise(res => setTimeout(res, 100));
    }

    return Response.json({ 
      success: true, 
      inserted: totalInserted, 
      report_id: records[0].report_id 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});