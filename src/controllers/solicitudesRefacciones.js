const fs = require('fs');
const moment = require('moment');
const path = require('path');
const sequelize = require('sequelize');
const { Op } = require('sequelize');

// const sql = require('mssql')
// const sqlConfig = require('../libs/configMSSQL');

// Función para guardar archivos en base64

function saveBase64File(base64Data, folder, filenamePrefix, solicitud, type) {
  // Asegurarse de que la carpeta exista
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const DateFormated = moment(solicitud.fecha_solicitud).format('DD.MM.YYYY_hh.mm');

  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Formato base64 inválido');
  }

  const mimeType = matches[1];
  const extension = mimeType.split('/')[1];

  const buffer = Buffer.from(matches[2], 'base64');
  let filename;
  if (type === 'solicitud') {
    // console.log(solicitud);
    filename = `${filenamePrefix}_${DateFormated}_${solicitud.id_base}_${solicitud.unidad}_${solicitud.ot}_${solicitud.id_solicitud}.${extension}`;
  } else if (type === 'refaccion') {
    filename = `${filenamePrefix}_${DateFormated}_${solicitud.id_refaccion_solicitada}_${solicitud.id_refaccion}.${extension}`;
  }
  const filePath = path.join(folder, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

function saveBase64FileEvidenciaEntrega(base64Data, data, type) {

  const evidenciaEntregadasPath = path.join(__dirname, '../../evidencias/entregadas');

  if (!fs.existsSync(evidenciaEntregadasPath)) {
    fs.mkdirSync(evidenciaEntregadasPath, { recursive: true });
  }

  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Formato base64 inválido');
  }

  const DateFormated = moment().format('DD.MM.YYYY_hh.mm');

  const mimeType = matches[1];
  const extension = mimeType.split('/')[1];

  const buffer = Buffer.from(matches[2], 'base64');
  let filename = `${type}_${DateFormated}_${data.id_refaccion_solicitada}_${data.unidad}_${data.ot}.${extension}`;
  
  const filePath = path.join(evidenciaEntregadasPath, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

module.exports = (app) => {

  const Base = app.database.models.Base;
  const Solicitud = app.database.models.Solicitud;
  const refaccionSolicitada = app.database.models.Refaccion_solicitada;
  const comprasActualizacion = app.database.models.Compras_actualizacion;
  const refaccionesCatalogo = app.database.models.Refacciones;
  const CambioEstatusRefaccion = app.database.models.Cambio_estatus_refaccion;

  app.SolicitudesPte = async (req, res) => {
      const base = req.params.base;
      let opcionBase;
      
      try {
        switch(base) {
          case '3':
              opcionBase = {};
              break;
          default:
            opcionBase = {id_base: base};
              break;
        }
        
        const solicitudes = await Solicitud.findAll({
          where: opcionBase,
          include: [
            { 
              model: Base,
              required: false,
              as: 'base'
            },
            { 
              model: refaccionSolicitada,
              attributes: { exclude: [] },
              required: false,
              include: [
                { 
                  model: refaccionesCatalogo,
                  required: false,
                  as: 'refaccion'
                },
                { 
                  model: comprasActualizacion,
                  required: false,
                  as: 'comprasActualizacion'
                },
                { 
                  model: CambioEstatusRefaccion,
                  required: false,
                  as: 'cambiosEstatus',
                  attributes: {
                    include: [
                    [
                      app.database.Sequelize.literal(`
                        TIMEDIFF(
                          fecha_cambio,
                          COALESCE(
                            LAG(fecha_cambio) OVER (
                              PARTITION BY refaccionesSolicitadas.id_refaccion_solicitada 
                              ORDER BY fecha_cambio
                            ),
                            fecha_cambio
                          )
                        )
                      `),
                      'diferencia_horas_minutos'
                    ],
                  ]                  
                }
              }
            ],
            as: 'refaccionesSolicitadas'
            }
          ],
          limit: base === 3 ? 140 : 70
        });
        
        const refaccionesPorEstatusCriticas = await refaccionSolicitada.findAll({
          attributes: [
          'estatus',
          [sequelize.fn('COUNT', sequelize.col('estatus')), 'cantidad']
          ],
          include: [
          {
            model: Solicitud,
            attributes: [],
            required: true,
            as: 'solicitud',
              where: {
              ...opcionBase,
              [Op.and]: [
                { carril: { [Op.ne]: null } },
                { carril: { [Op.ne]: '' } },
                { carril: { [Op.ne]: 'CUARENTENA' } }
              ]
            }
          }
          ],
          group: ['estatus'],
          where: {
          [Op.or]: [
            { estatus: null },
            { estatus: { [Op.in]: [
              'por_solicitar',
              'pte_validar_sol_ac',
              'solicitud_rechazada',
              'en_proceso_compras',
              'pte_recepcion_ac',
              'pte_enviar_ac',
              'informacion_adicional_solicitada',
              'por_recibir_ai',
              'devolucion',
              'recibida_ai'
            ] } }
          ]
          }
        });

        const refaccionesPorEstatusTodas = await refaccionSolicitada.findAll({
          attributes: [
            'estatus',
            [sequelize.fn('COUNT', sequelize.col('estatus')), 'cantidad']
          ],
          include: [
            {
              model: Solicitud,
              attributes: [],
              required: true,
              as: 'solicitud',
              where: opcionBase
            }
          ],
          group: ['estatus'],
          where: {
            [Op.or]: [
            { estatus: null },
            { estatus: { [Op.in]: [
              'por_solicitar',
              'pte_validar_sol_ac',
              'solicitud_rechazada',
              'en_proceso_compras',
              'pte_recepcion_ac',
              'pte_enviar_ac',
              'informacion_adicional_solicitada',
              'por_recibir_ai',
              'devolucion',
              'recibida_ai'
            ] } }
            ]
          }
        });

        const conteoPorEstatusCriticas = refaccionesPorEstatusCriticas.reduce((acc, item) => {
          acc[item.estatus || 'null'] = parseInt(item.dataValues.cantidad, 10);
          return acc;
        }, {});

        const conteoPorEstatus = refaccionesPorEstatusTodas.reduce((acc, item) => {
          acc[item.estatus || 'null'] = parseInt(item.dataValues.cantidad, 10);
          return acc;
        }, {});

        return res.json({ 
          OK: true, 
          result: solicitudes, 
          conteoPorEstatus, 
          conteoPorEstatusCriticas,
        });

      } catch (error) {
          console.error('Error en SolicitudesPte:', error);
          return res.json(error);
      }
  };

  // app.ObtenerNumEconomico = async (req, res) => {

  //   try {

  //     await sql.connect(sqlConfig)
  //     const result = await sql.query`
  //       SELECT
  //           TRACTO_NUM_ECO AS 'NUM ECO'
  //       FROM 
  //           TRACTO
  //       WHERE 
  //           TRACTO_NUM_ECO LIKE 'TLEA-%' OR TRACTO_NUM_ECO LIKE 'C%'
  //       UNION ALL
  //       SELECT 
  //           REMOLQUE_NUM_ECO
  //       FROM
  //           REMOLQUE
  //       WHERE 
  //           REMOLQUE_NUM_ECO LIKE 'RE-%' OR REMOLQUE_NUM_ECO LIKE 'DL-%'`

  //     const response = result.recordsets[0].map(row => row['NUM ECO'].trim());

  //     return res.status(200).json({
  //       OK: true,
  //       result: response
  //     })
     
  //   } catch (error) {
  //       console.error('Error en ObtenerNumEconomico:', error);
  //       return res.json(error);
  //   }
  // }

  app.NuevaSolicitud = async (req, res) => {
    let refacciones = req.body.data.refacciones;
    delete req.body.data.refacciones;
    let solicitud = req.body.data;
    const confirmarSolicitudConMismaOTyUnidad = req.body.confirmarSolicitudConMismaOTyUnidad;

    try {

      const idsRefacciones = refacciones.map(refaccion => refaccion.id_refaccion);

      const EncontrarRefacciones = await refaccionesCatalogo.findAll({
        attributes: ['clave'],
        where: {
          id_refaccion: {
            [Op.in]: idsRefacciones
          }
        }
      });

      const claves = EncontrarRefacciones.map(refaccion => refaccion.clave);

      const solicitudExistente = await app.database.sequelize.query(
        `
        SELECT
          SOL.id_solicitud,
          REF_CAT.clave,
          REF_CAT.refaccion
        FROM
          solicitud AS SOL
          LEFT JOIN refaccion_solicitada AS REF_SOL ON SOL.id_solicitud = REF_SOL.id_solicitud
          LEFT JOIN refacciones_catalogo AS REF_CAT ON REF_SOL.id_refaccion = REF_CAT.id_refaccion
        WHERE
          SOL.unidad = :unidad
          AND SOL.ot = :ot
          AND REF_SOL.estatus <> 'recibida_ai'
        `,
        {
          replacements: { 
            unidad: solicitud.unidad,
            ot: solicitud.ot,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (solicitudExistente.length > 0) {

        const clavesCoincidentes = solicitudExistente.filter(solicitud => 
          claves.includes(solicitud.clave)
        );

        if(clavesCoincidentes.length > 0){
          return res.json({
            OK: false,
            clavesCoincidentes
          });
        }

        if(clavesCoincidentes.length === 0 && !confirmarSolicitudConMismaOTyUnidad){
          return res.json({
            OK: false,
            clavesCoincidentes
          });
        }
      }

      } catch (error) {
        console.error('Error en ActualizarSolicitud:', error);
        return res.json(error);
    }

    const evidenciasSolicitudes = path.join(__dirname, '../../evidencias/solicitudes');
    const evidenciaRefacciones = path.join(__dirname, '../../evidencias/refacciones');

    try {
      
      if (solicitud.evidencia_advan) {
        solicitud.evidencia_advan = saveBase64File(solicitud.evidencia_advan, evidenciasSolicitudes, 'evidencia_advan', solicitud, 'solicitud');
      }

      if (solicitud.evidencia_vale_diagnostico) {
        solicitud.evidencia_vale_diagnostico = saveBase64File(solicitud.evidencia_vale_diagnostico, evidenciasSolicitudes, 'evidencia_vale_diagnostico', solicitud, 'solicitud');
      }

      Object.defineProperty(solicitud, "fecha_inicio_solicitud", {
        value: moment(),
        writable: true,
        enumerable: true,
        configurable: true
      });
      
      const solicitudCreada = await Solicitud.create(solicitud);

      refacciones = refacciones.map(refaccion => {
        refaccion.id_solicitud = solicitudCreada.id_solicitud;

        if (refaccion.evidencia_core) {
          refaccion.evidencia_core = saveBase64File(refaccion.evidencia_core, evidenciaRefacciones, 'evidencia_core', refaccion, 'refaccion');
        }

        if (refaccion.evidencia_tarjeta_roja) {
          refaccion.evidencia_tarjeta_roja = saveBase64File(refaccion.evidencia_tarjeta_roja, evidenciaRefacciones, 'evidencia_tarjeta_roja', refaccion, 'refaccion');
        }

        if(refaccion.evidencia_ausencia_core){
          refaccion.evidencia_ausencia_core = saveBase64File(refaccion.evidencia_ausencia_core, evidenciaRefacciones, 'evidencia_ausencia_core', refaccion, 'refaccion');
        }

        if(refaccion.evidencia_reporte_danos){
          refaccion.evidencia_reporte_danos = saveBase64File(refaccion.evidencia_reporte_danos, evidenciaRefacciones, 'evidencia_reporte_danos', refaccion, 'refaccion');

        }

        return refaccion;
      })

      const refaccionesCreadas = await refaccionSolicitada.bulkCreate(refacciones);

      await Promise.all(
        refaccionesCreadas.map(async (refaccion) => {
          await CambioEstatusRefaccion.create({
            id_refaccion_solicitada: refaccion.id_refaccion_solicitada,
            estatus: 'por_solicitar',
            fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
          });
        })
      );

      return res.json({
          OK: true,
          result: {
            solicitudCreada,
            refaccionesCreadas
          }
      });
    } catch (error) {
        console.error('Error en NuevaSolicitud:', error);
        return res.json({ OK: false, error });
    }
  };

  app.ActualizarSolicitud = async (req, res) => {
      let refacciones = req.body.data.refacciones;
      delete req.body.data.refacciones;
      let solicitud = req.body.data;
      const estadoSolicitudAlRecibir = req.body.data.estado
      const solicitudCompleta = req.body.solicitudCompleta;

      const evidenciasSolicitudes = path.join(__dirname, '../../evidencias/solicitudes');
      const evidenciaRefacciones = path.join(__dirname, '../../evidencias/refacciones');

      //Evidencias
      const evidencia_advan = solicitud.evidencia_advan;
      const evidencia_vale_diagnostico = solicitud.evidencia_vale_diagnostico;
      const evidencia_vale_almacen = solicitud.evidencia_vale_almacen;
      const evidencia_autorizacion_jefatura = solicitud.evidencia_autorizacion_jefatura;
      const evidencia_autorizacion_gerencia = solicitud.evidencia_autorizacion_gerencia;
      const evidencia_autorizacion_CI = solicitud.evidencia_autorizacion_CI;

      try {

        const evidencias_anteriores = await Solicitud.findOne({
          where: { id_solicitud: solicitud.id_solicitud },
          attributes: [
            'evidencia_advan',
            'evidencia_vale_diagnostico',
            'evidencia_vale_almacen',
            'evidencia_autorizacion_jefatura',
            'evidencia_autorizacion_gerencia',
            'evidencia_autorizacion_CI'
          ]
        });

        if (evidencia_advan) {
          const matches = evidencia_advan.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {} 
          else {
            EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_advan, evidenciasSolicitudes);
            solicitud.evidencia_advan = saveBase64File(evidencia_advan, evidenciasSolicitudes, 'evidencia_advan', solicitud, 'solicitud');
          }
        }

        if (evidencia_vale_diagnostico) {
          const matches = evidencia_vale_diagnostico.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
          }else{
            EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_vale_diagnostico, evidenciasSolicitudes);
            solicitud.evidencia_vale_diagnostico = saveBase64File(evidencia_vale_diagnostico, evidenciasSolicitudes, 'evidencia_vale_diagnostico', solicitud, 'solicitud');
          }
        }

        if (evidencia_vale_almacen) {
          const matches = evidencia_vale_almacen.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {}
          else{
            EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_vale_almacen, evidenciasSolicitudes);
            solicitud.evidencia_vale_almacen = saveBase64File(evidencia_vale_almacen, evidenciasSolicitudes, 'evidencia_vale_almacen', solicitud, 'solicitud');
          }
        }

        if (evidencia_autorizacion_jefatura) {
          const matches = evidencia_autorizacion_jefatura.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {}
          else{
            EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_autorizacion_jefatura, evidenciasSolicitudes);
            solicitud.evidencia_autorizacion_jefatura = saveBase64File(evidencia_autorizacion_jefatura, evidenciasSolicitudes, 'evidencia_autorizacion_jefatura', solicitud, 'solicitud');
          }
        }

        if (evidencia_autorizacion_gerencia) {
          const matches = evidencia_autorizacion_gerencia.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {}
          else{
            EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_autorizacion_gerencia, evidenciasSolicitudes);
            solicitud.evidencia_autorizacion_gerencia = saveBase64File(evidencia_autorizacion_gerencia, evidenciasSolicitudes, 'evidencia_autorizacion_gerencia', solicitud, 'solicitud');
          }
        }

        if (evidencia_autorizacion_CI) {
          const matches = evidencia_autorizacion_CI.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {}
          else{
            EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_autorizacion_CI, evidenciasSolicitudes);
            solicitud.evidencia_autorizacion_CI = saveBase64File(evidencia_autorizacion_CI, evidenciasSolicitudes, 'evidencia_autorizacion_CI', solicitud, 'solicitud');
          }
        }

        if(solicitudCompleta){
          solicitud.estado = 3;
          solicitud.fecha_solicitud_completa = moment(); 
        }

        if(solicitud.estado === 4){
          solicitud.estado = 3;
          solicitud.comentario_rechazo_solicitud = null;
        }

        const solicitudActualizada = await Solicitud.update(solicitud, {
          where: {
            id_solicitud: solicitud.id_solicitud,
          },
          returning: true,
        });


        const idsRefaccionesExistentes = refacciones
          .filter(r => r.id_refaccion_solicitada !== undefined && r.id_refaccion_solicitada !== null)
          .map(r => r.id_refaccion_solicitada);

          if (idsRefaccionesExistentes.length > 0) {
          await refaccionSolicitada.destroy({
            where: {
              id_solicitud: solicitud.id_solicitud,
              id_refaccion_solicitada: {
                [Op.notIn]: idsRefaccionesExistentes
              }
            }
          });
        }

        const refaccionesParaActualizar = await Promise.all(
          refacciones.map(async (refaccion) => {

          const evidencia_core = refaccion.evidencia_core;
          const evidencia_tarjeta_roja = refaccion.evidencia_tarjeta_roja;
          const evidencia_ausencia_core = refaccion.evidencia_ausencia_core;
          const evidencia_reporte_danos = refaccion.evidencia_reporte_danos;

          if(!refaccion.id_refaccion_solicitada){
            refaccion.id_refaccion_solicitada = null
          }

          const evidencias_anteriores = await refaccionSolicitada.findOne({
            where: { id_refaccion_solicitada: refaccion.id_refaccion_solicitada },
            attributes: [
              'evidencia_core',
              'evidencia_tarjeta_roja',
              'evidencia_ausencia_core',
              'evidencia_reporte_danos',
            ]
          });

          if (evidencia_core) {
            const matches = evidencia_core.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {}
            else{
              EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_core, evidenciaRefacciones);
              refaccion.evidencia_core = saveBase64File(evidencia_core, evidenciaRefacciones, 'evidencia_core', refaccion, 'refaccion');
            }
          }

          if (evidencia_tarjeta_roja) {
            const matches = evidencia_tarjeta_roja.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {}
            else{
              EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_tarjeta_roja, evidenciaRefacciones);
              refaccion.evidencia_tarjeta_roja = saveBase64File(evidencia_tarjeta_roja, evidenciaRefacciones, 'evidencia_tarjeta_roja', refaccion, 'refaccion');
            }
          }

          if (evidencia_ausencia_core) {
            const matches = evidencia_ausencia_core.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {}
            else{
              EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_ausencia_core, evidenciaRefacciones);
              refaccion.evidencia_ausencia_core = saveBase64File(evidencia_ausencia_core, evidenciaRefacciones, 'evidencia_ausencia_core', refaccion, 'refaccion');
            }
          }

          if (evidencia_reporte_danos) {
            const matches = evidencia_reporte_danos.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {}
            else{
              EliminarEvidenciaAnterior(evidencias_anteriores.evidencia_reporte_danos, evidenciaRefacciones);
              refaccion.evidencia_reporte_danos = saveBase64File(evidencia_reporte_danos, evidenciaRefacciones, 'evidencia_reporte_danos', refaccion, 'refaccion');
            }
          }

          if(solicitudCompleta || estadoSolicitudAlRecibir === 4){
              refaccion.estatus = 'pte_validar_sol_ac';

          // Trigger para almacenar información en cambio_estatus_refaccion
            await CambioEstatusRefaccion.create({
              id_refaccion_solicitada: refaccion.id_refaccion_solicitada,
              estatus: refaccion.estatus,
              fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
            });
          }

          return {
            ...refaccion,
            id_solicitud: solicitud.id_solicitud
          };
        })
      );

      const actualizacion = await refaccionSolicitada.bulkCreate(refaccionesParaActualizar, {
        updateOnDuplicate: ["id_refaccion", "estatus", "cantidad", "core", "evidencia_core", "evidencia_tarjeta_roja", "evidencia_ausencia_core", "evidencia_reporte_danos"]
      });

      return res.json({
          OK: true,
          result: {solicitudActualizada, actualizacion}
      });
    } catch (error) {
        console.error('Error en ActualizarSolicitud:', error);
        return res.json(error);
    }
  };

  app.ActualizarValidarSolicitud = async (req, res) => {

    // console.log(req.body);

    let refacciones = req.body.refacciones;
    delete req.body.refacciones;
    let solicitud = req.body;

    try {

      if(solicitud.comentario_rechazo_solicitud !== null){
        solicitud.estado = 4;

        const solicitudActualizada = await Solicitud.update(solicitud, {
          where: {id_solicitud: solicitud.id_solicitud}
        });

        const refaccionesActualizadas = await Promise.all(
          refacciones.map(async (refaccion) => {
            refaccion.estatus = 'solicitud_rechazada';
            await refaccionSolicitada.update(
              { estatus: refaccion.estatus },
              { where: { id_refaccion_solicitada: refaccion.id_refaccion_solicitada } }
            );

            await CambioEstatusRefaccion.create({
              id_refaccion_solicitada: refaccion.id_refaccion_solicitada,
              estatus: refaccion.estatus,
              fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
            });
            
            return refaccion;
          })
        );

        return res.json({
          OK: true,
          result: { solicitudActualizada, refaccionesActualizadas }
        });
      } else {

        solicitud.estado = 5;

        const solicitudActualizada = await Solicitud.update(
          {
            estado: solicitud.estado
          },
          {
            where: {id_solicitud: solicitud.id_solicitud}
          }
        );

        const refaccionesActualizadas = await Promise.all(
          refacciones.map(async (refaccion) => {

            if(refaccion.colocarNumeroPedido){
              refaccion.estatus = 'en_proceso_compras'
            }

            if(refaccion.pasarAEnviar){
              refaccion.estatus = 'pte_enviar_ac'
              refaccion.numero_pedido = 'stock'
            }

            await refaccionSolicitada.update(
              {
                estatus: refaccion.estatus,
                numero_pedido: refaccion.numero_pedido
              },
              { where: { id_refaccion_solicitada: refaccion.id_refaccion_solicitada } }
            );

            await CambioEstatusRefaccion.create({
              id_refaccion_solicitada: refaccion.id_refaccion_solicitada,
              estatus: refaccion.estatus,
              fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
            });
            
            return refaccion;
          })
        );

        return res.json({
          OK: true,
          msg: { solicitudActualizada, refaccionesActualizadas }
        });
      }
      
    } catch (error) {
      console.error('Error en ActualizarSolicitud:', error);
      return res.json(error);
    }    
  }

  app.cambiarEstatusAlmacenCentral = async (req, res) => {
    const {data, confirmarRecepcionAlmacenCentral, pasarAPorRecepcionAlmacenInterno, fechaCompromisoAC} = req.body;

    // console.log(req.body)

    try {

      if(fechaCompromisoAC){
        await refaccionSolicitada.update(
          {
            fecha_compromiso_envio_ac: fechaCompromisoAC
          },
          {
           where: {id_refaccion_solicitada: data.id_refaccion_solicitada}
          }
        );
      }


      if(data.estatus === 'pte_recepcion_ac' && confirmarRecepcionAlmacenCentral){
        await refaccionSolicitada.update(
          {
            estatus: 'pte_enviar_ac'
          },
          {
           where: {id_refaccion_solicitada: data.id_refaccion_solicitada}
          }
        );

        await CambioEstatusRefaccion.create({
          id_refaccion_solicitada: data.id_refaccion_solicitada,
          estatus: 'pte_enviar_ac',
          fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
      }

      if(data.estatus === 'pte_enviar_ac' && pasarAPorRecepcionAlmacenInterno){
        await refaccionSolicitada.update(
          {
            estatus: 'por_recibir_ai'
          },
          {
           where: {id_refaccion_solicitada: data.id_refaccion_solicitada}
          }
        );

        await CambioEstatusRefaccion.create({
          id_refaccion_solicitada: data.id_refaccion_solicitada,
          estatus: 'por_recibir_ai',
          fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
      }
        
        return res.json({
            OK: true,
            msg: 'Actualizado correctamente'
        });
    } catch (error) {
        console.error('Error en ActualizarSolicitud:', error);
        return res.json(error);
    }
  }

  app.confirmarRecepcion = async (req, res) => {
    // console.log(req.body);
    const data = req.body;

    let evidencia_refaccion_entregado;
    let evidencia_numeroParte_entregado;

    try {

      if(data.confirmarRecepcion){

        if(data.evidencia_refaccion_entregado){
          evidencia_refaccion_entregado = saveBase64FileEvidenciaEntrega(data.evidencia_refaccion_entregado, data, 'evidencia_refaccion_entregado');
        }
  
        if(data.evidencia_numeroParte_entregado){
          evidencia_numeroParte_entregado = saveBase64FileEvidenciaEntrega(data.evidencia_numeroParte_entregado, data, 'evidencia_numeroParte_entregado');
        }

        await refaccionSolicitada.update(
          {
            estatus: 'recibida_ai',
            fecha_entrega: moment(),
            evidencia_refaccion_entregado: evidencia_refaccion_entregado,
            evidencia_numeroParte_entregado: evidencia_numeroParte_entregado
          },
          {
           where: {id_refaccion_solicitada: data.id_refaccion_solicitada}
          }
        );

        await CambioEstatusRefaccion.create({
          id_refaccion_solicitada: data.id_refaccion_solicitada,
          estatus: 'recibida_ai',
          fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
      }

      if(data.devolucion){
        await refaccionSolicitada.update(
          {
            estatus: 'devolucion',
            fecha_entrega: moment(),
            causa_de_devolucion: data.causa_de_devolucion,
          },
          {
           where: {id_refaccion_solicitada: data.id_refaccion_solicitada}
          }
        );

        await CambioEstatusRefaccion.create({
          id_refaccion_solicitada: data.id_refaccion_solicitada,
          estatus: 'devolucion',
          fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
      }
        
      return res.json({
          OK: true,
          msg: 'Actualizado correctamente'
      });
    } catch (error) {
        console.error('Error en ActualizarSolicitud:', error);
        return res.json(error);
    }
}

  return app;
};

const EliminarEvidenciaAnterior = (nombreArchivo, filepath) => {
  if(nombreArchivo){
    const previousFilePath = path.join(filepath, nombreArchivo);
    if (fs.existsSync(previousFilePath)) {
      fs.unlinkSync(previousFilePath);
    }
  }
}



// const solicitudes = await app.database.sequelize.query(
//   `SELECT 
//     SOL.id_solicitud,
//       SOL.id_base,
//       SOL.fecha_inicio_solicitud,
//       SOL.fecha_solicitud_completa,
//       SOl.unidad,
//       SOL.ot,
//       SOL.carril,
//       SOL.estado,
//       SOL.numero_pedido,
//       SOL.comentario_rechazo_solicitud,
//       SOL.evidencia_advan,
//       SOL.evidencia_vale_diagnostico,
//       SOL.evidencia_vale_almacen,
//       SOL.evidencia_autorizacion_jefatura,
//       SOL.evidencia_autorizacion_gerencia,
//       SOL.evidencia_autorizacion_CI,
      
//       BASE.base,
      
//       REF_SOL.id_refaccion_solicitada,
//       REF_SOL.estatus,
//       REF_SOL.cantidad,
//       REF_SOL.core,
//       REF_SOL.fecha_entrega,
//       REF_SOL.evidencia_core,
//       REF_SOL.evidencia_tarjeta_roja,
//       REF_SOL.evidencia_ausencia_core,
//       REF_SOL.evidencia_reporte_danos,
      
//       REF_CAT.id_refaccion,
//       REF_CAT.clave,
//       REF_CAT.refaccion,
      
//       COM_ACT.id_compras_actualizacion,
//       COM_ACT.orden_compra,
//       COM_ACT.fecha_actualizacion,
//       COM_ACT.fecha_compromiso,
//       COM_ACT.fecha_oc,
//       COM_ACT.causas_retraso,
//       COM_ACT.terminal,
//       COM_ACT.proveedor,
//       COM_ACT.observaciones
//   FROM
//     solicitud AS SOL
//       LEFT JOIN base AS BASE ON BASE.id_base = SOL.id_base
//       LEFT JOIN refaccion_solicitada AS REF_SOL ON SOL.id_solicitud = REF_SOL.id_solicitud
//       LEFT JOIN refacciones_catalogo AS REF_CAT ON REF_SOL.id_refaccion = REF_CAT.id_refaccion
//       LEFT JOIN compras_actualizacion AS COM_ACT ON REF_SOL.id_refaccion_solicitada = COM_ACT.id_refaccion_solicitada
//   WHERE 
//     SOL.id_base = ?`,
//   {
//     replacements: [base],
//     type: QueryTypes.SELECT,
//   },
// );