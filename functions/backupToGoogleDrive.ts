import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Iniciando backup para:', user.email);

    // Obtener token de Google Drive
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    
    if (!accessToken) {
      throw new Error('No hay conexión con Google Drive');
    }

    console.log('Token de Drive obtenido');

    // Recopilar datos
    const [
      stores, cashiers, shiftRecords, budgets, dailySales, 
      shifts, courses, badges, goals, cleaningChecklists
    ] = await Promise.all([
      base44.asServiceRole.entities.Store.list(),
      base44.asServiceRole.entities.Cashier.list(),
      base44.asServiceRole.entities.ShiftRecord.list(),
      base44.asServiceRole.entities.Budget.list(),
      base44.asServiceRole.entities.DailySales.list(),
      base44.asServiceRole.entities.Shift.list(),
      base44.asServiceRole.entities.Course.list(),
      base44.asServiceRole.entities.CashierBadge.list(),
      base44.asServiceRole.entities.CashierGoal.list(),
      base44.asServiceRole.entities.CleaningChecklist.list()
    ]);

    const backupData = {
      app: 'Popsy Management',
      backup_date: new Date().toISOString(),
      backup_by: user.email,
      data: {
        stores,
        cashiers,
        shift_records: shiftRecords,
        budgets,
        daily_sales: dailySales,
        shifts,
        courses,
        badges,
        goals,
        cleaning_checklists: cleaningChecklists
      },
      summary: {
        total_stores: stores.length,
        total_cashiers: cashiers.length,
        total_shift_records: shiftRecords.length,
        total_shifts_scheduled: shifts.length
      }
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    const fileName = `Popsy_Backup_${new Date().toISOString().split('T')[0]}.json`;
    
    console.log(`Subiendo a Drive: ${fileName}`);

    // Subir a Google Drive
    const metadata = {
      name: fileName,
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([jsonContent], { type: 'application/json' }));

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Error de Drive: ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('✅ Archivo en Drive ID:', result.id);

    // Crear link de descarga de Drive
    const driveDownloadLink = `https://drive.google.com/uc?export=download&id=${result.id}`;
    const driveViewLink = `https://drive.google.com/file/d/${result.id}/view`;

    // Enviar email
    let emailSent = false;
    try {
      console.log('Enviando email a:', user.email);
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Popsy Management',
        to: user.email,
        subject: `🍦 Backup Popsy - ${fileName}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ec4899;">✅ Backup en Google Drive</h2>
            <p>Tu backup se guardó exitosamente en tu Google Drive.</p>
            
            <div style="background: #fce7f3; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📁 ${fileName}</h3>
              <p><strong>Registros:</strong> ${stores.length} tiendas, ${cashiers.length} cajeros, ${shiftRecords.length} turnos</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
            </div>
            
            <a href="${driveDownloadLink}" style="display: inline-block; background: linear-gradient(to right, #ec4899, #f43f5e); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px;">
              📥 Descargar Backup
            </a>
            
            <a href="${driveViewLink}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #2563eb); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px;">
              📂 Ver en Drive
            </a>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Busca el archivo en tu Google Drive: <strong>${fileName}</strong>
            </p>
          </div>
        `
      });
      
      emailSent = true;
      console.log('✅ Email enviado');
    } catch (emailError) {
      console.error('❌ Error email:', emailError);
    }

    console.log('✅ Proceso completo');

    return Response.json({ 
      success: true,
      file_name: fileName,
      drive_id: result.id,
      drive_link: driveViewLink,
      download_link: driveDownloadLink,
      full_backup: backupData,
      email_sent: emailSent,
      message: `Backup guardado en Drive y enviado a ${user.email}`
    });

  } catch (error) {
    console.error('Backup error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});