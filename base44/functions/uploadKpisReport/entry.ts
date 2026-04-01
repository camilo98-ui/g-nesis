import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { records } = await req.json();
    if (!records || !Array.isArray(records) || records.length === 0) {
      return Response.json({ error: 'No records provided' }, { status: 400 });
    }

    // Insert new records in chunks (no delete — frontend filters by latest report_id)
    const chunkSize = 50;
    let totalInserted = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
      await base44.asServiceRole.entities.SalesReport.bulkCreate(records.slice(i, i + chunkSize));
      totalInserted += Math.min(chunkSize, records.length - i);
      await delay(400);
    }

    return Response.json({ success: true, inserted: totalInserted, report_id: records[0].report_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});