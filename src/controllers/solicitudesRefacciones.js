// Importaciones necesarias
const fs = require('fs');
const moment = require('moment');
const path = require('path');

// Función para guardar archivos en base64
function saveBase64File(base64Data, folder, filenamePrefix, nuevaSoli, extension = '.png') {
  // Asegurarse de que la carpeta exista
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const DateFormated = moment(nuevaSoli.fecha_solicitud).format('DD.MM.YYYY_hh.mm')

  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Formato base64 inválido');
  }
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${filenamePrefix}_${DateFormated}_${nuevaSoli.unidad}_${nuevaSoli.ot}${extension}`;
  const filePath = path.join(folder, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

module.exports = (app) => {

    const Base = app.database.models.Base;
    const Solicitud = app.database.models.Solicitud;
    const Refacciones = app.database.models.Refacciones;
    const HistorialActualizaciones = app.database.models.HistorialActualizaciones;
    
    app.SolicitudesPte = async (req, res) => {
        const base = req.params.base;
        let opcionBase;
        
        try {
            switch(base) {
                case '3':
                    opcionBase = {};
                    break;
                default:
                    opcionBase = { id_base: base };
                    break;
            }
            
            const solicitudes = await Solicitud.findAll({
                where: opcionBase,
                include: [
                    { model: Refacciones, required: false },
                    { model: Base, required: false },
                    { model: HistorialActualizaciones,
                      required: false,
                      separate: true,
                      order: [['fecha_actualizacion', 'DESC']],
                      limit: 1 }
                ]
            });
            
            if (solicitudes !== null) {
                const result = solicitudes.map(solicitud => {
                    const HistorialActualizaciones = solicitud.HistorialActualizaciones[0] || null;  
                    return {
                      ...solicitud.toJSON(),
                      HistorialActualizaciones
                    };
                });

                return res.json({ OK: true, result: result });
            }
            
            return res.json({ OK: true, result: null });
        } catch (error) {
            console.error('Error en SolicitudesPte:', error);
            return res.json(error);
        }
    };

    app.NuevaSolicitud = async (req, res) => {
        let nuevaSoli = req.body;
        const uploadFolder = path.join(__dirname, '../../evidencias');

        try {
          
            if (nuevaSoli.evidencia_advan) {
              nuevaSoli.evidencia_advan = saveBase64File(nuevaSoli.evidencia_advan, uploadFolder, 'evidencia_advan', nuevaSoli);
            }
            if (nuevaSoli.evidencia_autorizaciones) {
              nuevaSoli.evidencia_autorizaciones = saveBase64File(nuevaSoli.evidencia_autorizaciones, uploadFolder, 'evidencia_autorizaciones', nuevaSoli);
            }
            if (nuevaSoli.evidencia_core) {
              nuevaSoli.evidencia_core = saveBase64File(nuevaSoli.evidencia_core, uploadFolder, 'evidencia_core', nuevaSoli);
            }
            if (nuevaSoli.evidencia_vale) {
              nuevaSoli.evidencia_vale = saveBase64File(nuevaSoli.evidencia_vale, uploadFolder, 'evidencia_vale', nuevaSoli);
            }
    
            const createSolicitud = await Solicitud.create(nuevaSoli);
    
            return res.json({
                OK: true,
                result: createSolicitud
            });
        } catch (error) {
            console.error('Error en NuevaSolicitud:', error);
            return res.json({ OK: false, error });
        }
    };

    app.ActualizarSolicitud = async (req, res) => {
        const solicitud = req.body;
        const uploadFolder = path.join(__dirname, '../../evidencias');

        try {

          if (solicitud.evidencia_advan) {
            const matches = solicitud.evidencia_advan.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
            }else{
              solicitud.evidencia_advan = saveBase64File(solicitud.evidencia_advan, uploadFolder, 'evidencia_advan', solicitud);
            }
          }
          if (solicitud.evidencia_autorizaciones) {
            const matches = solicitud.evidencia_autorizaciones.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
            }else{
              solicitud.evidencia_autorizaciones = saveBase64File(solicitud.evidencia_autorizaciones, uploadFolder, 'evidencia_autorizaciones', solicitud);
            }
          }
          if (solicitud.evidencia_core) {
            const matches = solicitud.evidencia_core.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
            }else{
              solicitud.evidencia_core = saveBase64File(solicitud.evidencia_core, uploadFolder, 'evidencia_core', solicitud);
            }
          }
          if (solicitud.evidencia_vale) {
            const matches = solicitud.evidencia_vale.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
            }else{
              solicitud.evidencia_vale = saveBase64File(solicitud.evidencia_vale, uploadFolder, 'evidencia_vale', solicitud);
            }
          }

          if(solicitud.estado === 3){
            Object.defineProperty(solicitud, "fecha_entrega", {
                value: moment().format('YYYY-MM-DD'),
                writable: true,
                enumerable: true,
                configurable: true
            });
          }
          const solicitudActualizada = await Solicitud.update(solicitud, {
                where: {
                    id_solicitud: solicitud.id_solicitud,
                },
          });
          return res.json({
              OK: true,
              msg: solicitudActualizada
          });
      } catch (error) {
          console.error('Error en ActualizarSolicitud:', error);
          return res.json(error);
      }
    };

  return app;
};
