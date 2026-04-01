import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { records } = await req.json();
  if (!records?.length) return Response.json({ error: 'No records' }, { status: 400 });

  let inserted = 0;
  for (let i = 0; i < records.length; i += 50) {
    await base44.asServiceRole.entities.SalesReport.bulkCreate(records.slice(i, i + 50));
    inserted += Math.min(50, records.length - i);
  }

  return Response.json({ success: true, inserted, report_id: records[0].report_id });
});