import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener access token de Google Drive
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    
    if (!accessToken) {
      throw new Error('No se pudo obtener el token de Google Drive. Verifica que la conexión esté activa.');
    }
    
    console.log('Access token obtenido correctamente');

    // Recopilar datos de todas las entidades principales
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

    // Crear documento de backup en formato JSON
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
    
    console.log(`Preparando backup: ${fileName} (${jsonContent.length} bytes)`);

    // Crear archivo en Google Drive
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [] // Se guarda en root de Drive
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([jsonContent], { type: 'application/json' }));

    console.log('Intentando subir archivo a Google Drive...');
    
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    });
    
    console.log(`Upload response status: ${uploadResponse.status}`);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Google Drive upload error:', errorText);
      throw new Error(`Google Drive upload failed (${uploadResponse.status}): ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('File uploaded to Drive:', result);

    console.log('Compartiendo archivo en Drive...');
    
    // Hacer el archivo accesible
    const shareResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'anyone',
        role: 'reader'
      })
    });

    let shareSuccess = false;
    if (!shareResponse.ok) {
      const shareError = await shareResponse.text();
      console.error('Share error:', shareError);
    } else {
      shareSuccess = true;
      console.log('Archivo compartido exitosamente');
    }

    // Enviar email con el link
    const downloadLink = `https://drive.google.com/uc?export=download&id=${result.id}`;
    let emailSent = false;
    
    try {
      console.log('Enviando email a:', user.email);
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Popsy Management',
        to: user.email,
        subject: `🍦 Backup Popsy - ${fileName}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ec4899;">✅ Backup Completado</h2>
            <p>Tu backup de Popsy Management se ha creado exitosamente.</p>
            
            <div style="background: #fce7f3; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📁 ${fileName}</h3>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
              <p><strong>Registros:</strong></p>
              <ul>
                <li>Tiendas: ${stores.length}</li>
                <li>Cajeros: ${cashiers.length}</li>
                <li>Registros de turnos: ${shiftRecords.length}</li>
                <li>Turnos programados: ${shifts.length}</li>
              </ul>
            </div>
            
            <a href="${downloadLink}" style="display: inline-block; background: linear-gradient(to right, #ec4899, #f43f5e); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0;">
              📥 Descargar Backup
            </a>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              También puedes buscar el archivo "${fileName}" en tu Google Drive.
            </p>
          </div>
        `
      });
      
      emailSent = true;
      console.log('Email enviado correctamente');
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
    }

    console.log('✅ Backup completado exitosamente');
    
    return Response.json({ 
      success: true,
      file_id: result.id,
      file_name: fileName,
      drive_link: `https://drive.google.com/file/d/${result.id}/view`,
      download_link: `https://drive.google.com/uc?export=download&id=${result.id}`,
      full_backup: backupData,
      email_sent: emailSent,
      share_success: shareSuccess,
      records_backed_up: {
        stores: stores.length,
        cashiers: cashiers.length,
        shift_records: shiftRecords.length,
        shifts: shifts.length
      },
      message: `Backup creado exitosamente: ${fileName}`
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