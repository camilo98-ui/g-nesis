import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Iniciando backup para:', user.email);

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
    
    console.log(`Creando backup: ${fileName}`);

    // Subir el backup a Base44 storage
    const file = new File([jsonContent], fileName, { type: 'application/json' });
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const fileUrl = uploadResult.file_url;
    
    console.log('Archivo subido a:', fileUrl);

    // Enviar email con el link
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
              <p><strong>Registros respaldados:</strong></p>
              <ul>
                <li>Tiendas: ${stores.length}</li>
                <li>Cajeros: ${cashiers.length}</li>
                <li>Registros de turnos: ${shiftRecords.length}</li>
                <li>Turnos programados: ${shifts.length}</li>
                <li>Cursos: ${courses.length}</li>
                <li>Insignias: ${badges.length}</li>
              </ul>
            </div>
            
            <a href="${fileUrl}" style="display: inline-block; background: linear-gradient(to right, #ec4899, #f43f5e); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0;">
              📥 Descargar Backup
            </a>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este archivo contiene todos tus datos en formato JSON. Guárdalo en un lugar seguro.
            </p>
          </div>
        `
      });
      
      emailSent = true;
      console.log('✅ Email enviado correctamente');
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
    }

    console.log('✅ Backup completado');
    
    return Response.json({ 
      success: true,
      file_name: fileName,
      file_url: fileUrl,
      full_backup: backupData,
      email_sent: emailSent,
      records_backed_up: {
        stores: stores.length,
        cashiers: cashiers.length,
        shift_records: shiftRecords.length,
        shifts: shifts.length
      },
      message: `Backup creado y enviado a ${user.email}`
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