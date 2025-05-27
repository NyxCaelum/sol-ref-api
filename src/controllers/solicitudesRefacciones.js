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
          order: [['fecha_inicio_solicitud', 'DESC']],
          limit: base === 3 ? 300 : 150
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
              'recibida_ai',
              'cancelada',
            ] } }
          ]
          },
          limit: base === 3 ? 300 : 150
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
              'recibida_ai',
              'cancelada',
            ] } }
            ]
          },
          limit: base === 3 ? 300 : 150
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

  app.TiemposEnProceso = async (req, res) => {

    try {
      
      const { fechaInicio, fechaFin } = req.params;

      let whereClause = '';
      if (fechaInicio && fechaFin) {
        whereClause = `WHERE SOL.fecha_solicitud_completa BETWEEN '${fechaInicio}' AND '${fechaFin}'`;
      }

      const solicitudes = await app.database.sequelize.query(
        `
          SELECT
            CASE
              WHEN SOL.id_base = 1 THEN 'SALINAS'
              WHEN SOL.id_base = 2 THEN 'SALAMANCA'
            END AS 'BASE',
            SOL.id_solicitud AS 'FOLIO SOLICITUD',
            REF_SOL.id_refaccion_solicitada AS 'FOLIO REFACCION',
            SOL.unidad,
            DATE_FORMAT(SOL.fecha_solicitud_completa, '%d/%m/%Y %H:%i') AS 'FECHA SOLICITUD',
            DATE_FORMAT(REF_SOL.fecha_compromiso_envio_ac, '%d/%m/%Y %H:%i') AS 'FECHA COMPROMISO AC',
            DATE_FORMAT(COM.fecha_compromiso, '%d/%m/%Y %H:%i') AS 'FECHA COMPROMISO COMPRAS',
            DATE_FORMAT(REF_SOL.fecha_entrega, '%d/%m/%Y %H:%i') AS 'FECHA ENTREGA',
            REF_CAT.refaccion,
            CAM.estatus,
            DATE_FORMAT(CAM.fecha_cambio, '%d/%m/%Y %H:%i') AS 'FECHA CAMBIO',
            LAG(CAM.estatus) OVER (PARTITION BY REF_SOL.id_refaccion_solicitada ORDER BY CAM.fecha_cambio) AS estatus_anterior,
            DATE_FORMAT(
              LAG(CAM.fecha_cambio) OVER (PARTITION BY REF_SOL.id_refaccion_solicitada ORDER BY CAM.fecha_cambio),
              '%d/%m/%Y %H:%i'
            ) AS 'FECHA ANTERIOR ESTATUS',
            TIMESTAMPDIFF(
                MINUTE,
                LAG(CAM.fecha_cambio) OVER (PARTITION BY REF_SOL.id_refaccion_solicitada ORDER BY CAM.fecha_cambio),
                CAM.fecha_cambio
            ) AS 'MINUTOS ENTRE ESTATUS ANTERIOR',
            TIMESTAMPDIFF(
                MINUTE,
                SOL.fecha_solicitud_completa,
                REF_SOL.fecha_entrega
            ) AS 'MINUTOS SOLICITUD HASTA ENTREGA'
          FROM
            solicitud AS SOL
            LEFT JOIN refaccion_solicitada AS REF_SOL ON SOL.id_solicitud = REF_SOL.id_solicitud
            LEFT JOIN compras_actualizacion as COM ON REF_SOL.id_refaccion_solicitada = COM.id_refaccion_solicitada
            LEFT JOIN refacciones_catalogo AS REF_CAT ON REF_SOL.id_refaccion = REF_CAT.id_refaccion
            LEFT JOIN cambio_estatus_refaccion AS CAM ON REF_SOL.id_refaccion_solicitada = CAM.id_refaccion_solicitada
          ${whereClause};
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return res.json(solicitudes);

    } catch (err) {
      console.error('Error en SolicitudesPte:', error);
      return res.json(error);
    }
    
  }

  app.RefaccionesPendientesGrafica = async (req, res) => {
    try {
      const solicitudes = await app.database.sequelize.query(
        `
          WITH 
          -- 1) Tu query base
          base_data AS (
            SELECT
              CASE SOL.id_base 
                WHEN 1 THEN 'SALINAS' 
                WHEN 2 THEN 'SALAMANCA' 
              END AS BASE,
              REF_SOL.id_refaccion_solicitada,
              SOL.unidad,
              SOL.fecha_solicitud_completa AS fecha_solicitud,
              DATE(REF_SOL.fecha_entrega)   AS fecha_entrega, -- Convertimos a solo fecha
              CAM.estatus,
              ROW_NUMBER() OVER (
              PARTITION BY REF_SOL.id_refaccion_solicitada 
              ORDER BY CAM.fecha_cambio DESC
              ) AS rn_ult
            FROM 
              solicitud SOL
              LEFT JOIN refaccion_solicitada REF_SOL ON SOL.id_solicitud = REF_SOL.id_solicitud
              LEFT JOIN cambio_estatus_refaccion CAM ON REF_SOL.id_refaccion_solicitada = CAM.id_refaccion_solicitada
          ),

          -- 2) Último estatus y días de vida de cada refacción
          reqs AS (
            SELECT
              BASE,
              id_refaccion_solicitada,
              unidad,
              fecha_solicitud,
              fecha_entrega,
              MAX(CASE WHEN rn_ult = 1 THEN estatus END) AS estatus_final,
              DATEDIFF(fecha_entrega, fecha_solicitud)    AS dias_entrega
            FROM 
              base_data
            GROUP BY 
              BASE,
                  id_refaccion_solicitada,
                  unidad,
                  fecha_solicitud,
                  fecha_entrega
          ),

          -- 3) Generador de números 0–999
          nums AS (
            SELECT 
              a.n + 10*b.n + 100*c.n AS offset_days
            FROM 
            (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
            (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
            (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
          ),

          -- 4) Calendario virtual desde la mínima solicitud hasta hoy
          dates AS (
            SELECT 
              DATE_ADD(
              (SELECT MIN(fecha_solicitud) FROM reqs),
              INTERVAL offset_days DAY
              ) AS fecha
            FROM
              nums
            WHERE 
              DATE_ADD(
                (SELECT MIN(fecha_solicitud) FROM reqs),
                INTERVAL offset_days DAY
              ) <= CURDATE()
          ),

          -- 5) Refacciones pendientes por día
          pending_by_day AS (
            SELECT
              r.BASE,
              d.fecha,
              COUNT(*) AS Refacciones_Pendientes
            FROM 
              reqs r
            JOIN dates d ON d.fecha BETWEEN r.fecha_solicitud AND COALESCE(r.fecha_entrega - INTERVAL 1 DAY, CURDATE())
            WHERE
              r.fecha_entrega IS NULL AND r.estatus_final NOT IN ('solicitud_rechazada','por_solicitar','cancelada')
            GROUP BY 
              r.BASE,
                  d.fecha
          ),

          -- 6) Métricas de entregas por fecha de entrega
          delivered_metrics AS (
            SELECT
              BASE,
              fecha_entrega AS fecha,
              COUNT(*) AS total_entregas,
              ROUND(AVG(dias_entrega),2) AS promedioDiasEntrega,
              SUM(dias_entrega <= 1) AS Entrega_1_dia,
              SUM(dias_entrega = 2) AS Entrega_2_dias,
              SUM(dias_entrega BETWEEN 3 AND 5) AS Entrega_3_5_dias,
              SUM(dias_entrega > 5) AS Entrega_5_dias
            FROM 
              reqs
            WHERE 
              fecha_entrega IS NOT NULL
            GROUP BY 
              BASE,
                  fecha_entrega
          ),

          -- 7) Unidades activas (pendientes o pre-entrega) por día
          units_by_day AS (
            SELECT
              r.BASE,
              d.fecha,
              COUNT(DISTINCT r.unidad) AS UnidadesConRefacciones
            FROM 
              reqs r
              JOIN dates d ON d.fecha BETWEEN r.fecha_solicitud AND COALESCE(r.fecha_entrega - INTERVAL 1 DAY, CURDATE())
            GROUP BY 
              r.BASE,
              d.fecha
          ),

          -- 8) Unión final de todas las métricas
          final AS (
            SELECT
              p.BASE AS BASE,
              DATE_FORMAT(d.fecha, '%d/%m/%Y') AS fecha,
              COALESCE(p.Refacciones_Pendientes, 0) AS Refacciones_Pendientes,
              COALESCE(dm.Entrega_1_dia,      0) AS Entrega_1_dia,
              COALESCE(dm.Entrega_2_dias,     0) AS Entrega_2_dias,
              COALESCE(dm.Entrega_3_5_dias,   0) AS Entrega_3_5_dias,
              COALESCE(dm.Entrega_5_dias,     0) AS Entrega_5_dias,
              COALESCE(u.UnidadesConRefacciones, 0) AS UnidadesConRefacciones,
              COALESCE(dm.promedioDiasEntrega,  0) AS promedioDiasEntrega
            FROM 
              dates d
              LEFT JOIN pending_by_day p ON p.fecha  = d.fecha
              LEFT JOIN delivered_metrics dm ON dm.fecha = d.fecha AND dm.BASE = p.BASE
              LEFT JOIN units_by_day u ON u.fecha = d.fecha AND u.BASE = p.BASE
            ORDER BY 
              d.fecha
          )

          SELECT * 
          FROM final;
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return res.json(solicitudes);

    } catch (error) {
      console.error('Error en RefaccionesPendientesGrafica:', error);
      return res.json(error);
    }
  }

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

  app.ReporteRefaccionesPendientes = async (req, res) => {

    try {
      const solicitudes = await app.database.sequelize.query(
        `
          SELECT
            CASE
              WHEN REF_SOL.estatus = 'pte_validar_sol_ac' THEN 'Por validar ac'
              WHEN REF_SOL.estatus = 'solicitud_rechazada' THEN 'Solicitud rechazada'
              WHEN REF_SOL.estatus = 'en_proceso_compras' THEN 'En proceso compras'
              WHEN REF_SOL.estatus = 'informacion_adicional_solicitada' THEN 'En proceso compras'
              WHEN REF_SOL.estatus = 'pte_recepcion_ac' THEN 'Por recepcion en almacen central'
              WHEN REF_SOL.estatus = 'pte_enviar_ac' THEN 'Por enviar almacen central'
              WHEN REF_SOL.estatus = 'por_recibir_ai' THEN 'Por recibir almacen interno'
              WHEN REF_SOL.estatus = 'recibida_ai' THEN 'Recibido en almacen interno'
            ELSE REF_SOL.estatus
            END AS 'ESTATUS',
            SOL.carril AS 'CARRIL',
            BAS.base AS 'BASE',
            SOL.unidad AS 'UNIDAD',
            REF_SOL.cantidad AS 'CANTIDAD',
            REF_CAT.refaccion AS 'REFACCION',
            SOL.OT AS 'OT',
            DATEDIFF(
              IFNULL(REF_SOL.fecha_entrega, CURDATE()),
              SOL.fecha_solicitud_completa
            ) AS 'DIAS DESDE SOLICITUD',
            DATE_FORMAT(SOL.fecha_solicitud_completa, '%d/%m/%Y') AS 'FECHA SOLICITUD',
            DATE_FORMAT(REF_SOL.fecha_compromiso_envio_ac, '%d/%m/%Y') AS 'FECHA COMPROMISO AC',
            DATE_FORMAT(COM_ACT.fecha_compromiso, '%d/%m/%Y') AS 'FECHA COMPROMISO COMPRAS',
            DATE_FORMAT(REF_SOL.fecha_entrega, '%d/%m/%Y') AS 'FECHA ENTREGA',
            DATEDIFF(REF_SOL.fecha_entrega, SOL.fecha_solicitud_completa) AS 'DIAS DESDE SOLICITUD HASTA ENTREGA'
          FROM
            solicitud AS SOL
              LEFT JOIN base AS BAS ON SOL.id_base = BAS.id_base
              LEFT JOIN refaccion_solicitada AS REF_SOL ON SOL.id_solicitud = REF_SOL.id_solicitud
              LEFT JOIN refacciones_catalogo AS REF_CAT ON REF_SOL.id_refaccion = REF_CAT.id_refaccion
              LEFT JOIN compras_actualizacion AS COM_ACT ON REF_SOL.id_refaccion_solicitada = COM_ACT.id_refaccion_solicitada
          WHERE
            REF_SOL.estatus IS NOT NULL
              AND REF_SOL.estatus <> 'cancelada'
              AND REF_SOL.estatus <> 'por_solicitar'
          ORDER BY
            SOL.fecha_solicitud_completa DESC
          LIMIT 150;
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return res.json({ 
        OK: true,
        result: solicitudes
      });

    } catch (error) {
      console.error('Error en ActualizarSolicitud:', error);
      return res.json(error);
    }
  }

  app.ExportarRefacciones = async (req, res) => {

    try {
      const solicitudes = await app.database.sequelize.query(
        `
        SELECT
          SOL.id_solicitud AS 'FOLIO SOLICITUD',
          REF_SOL.id_refaccion_solicitada AS 'FOLIO REFACCION',
          BAS.base AS 'BASE',
          SOL.unidad AS 'UNIDAD',
          SOL.carril AS 'CARRIL',
          REF_SOL.cantidad AS 'CANTIDAD',
          REF_CAT.clave AS 'CLAVE',
          REF_CAT.refaccion AS 'REFACCION',
          SOL.OT AS 'OT',
          DATEDIFF(
            IFNULL(REF_SOL.fecha_entrega, CURDATE()),
            SOL.fecha_solicitud_completa
          ) AS 'DIAS DESDE SOLICITUD',
          DATE_FORMAT(SOL.fecha_solicitud_completa, '%d/%m/%Y') AS 'FECHA SOLICITUD',
          CASE
            WHEN REF_SOL.core = 1 THEN 'CORE'
            WHEN REF_SOL.core = 0 THEN 'AUTORIZACION'
          END AS 'CORE/AUTO',
          REF_SOL.numero_pedido AS 'NUMERO PEDIDO',
          COM_ACT.proveedor AS 'PROVEEDOR',
          DATE_FORMAT(COM_ACT.fecha_oc, '%d/%m/%Y') AS 'FECHA OC',
          COM_ACT.orden_compra AS 'ORDEN COMPRA',
          DATE_FORMAT(COM_ACT.fecha_compromiso, '%d/%m/%Y') AS 'FECHA COMPROMISO COMPRAS',
          DATE_FORMAT(REF_SOL.fecha_compromiso_envio_ac, '%d/%m/%Y') AS 'FECHA COMPROMISO AC',
          DATE_FORMAT(REF_SOL.fecha_entrega, '%d/%m/%Y') AS 'FECHA ENTREGA',
          CASE
            WHEN REF_SOL.estatus = 'pte_validar_sol_ac' THEN 'Por validar ac'
            WHEN REF_SOL.estatus = 'solicitud_rechazada' THEN 'Solicitud rechazada'
            WHEN REF_SOL.estatus = 'en_proceso_compras' THEN 'En proceso compras'
            WHEN REF_SOL.estatus = 'informacion_adicional_solicitada' THEN 'En proceso compras'
            WHEN REF_SOL.estatus = 'pte_recepcion_ac' THEN 'Por recepcion en almacen central'
            WHEN REF_SOL.estatus = 'pte_enviar_ac' THEN 'Por enviar almacen central'
            WHEN REF_SOL.estatus = 'por_recibir_ai' THEN 'Por recibir almacen interno'
            WHEN REF_SOL.estatus = 'recibida_ai' THEN 'Recibido en almacen interno'
            ELSE REF_SOL.estatus
          END AS 'ESTATUS'
        FROM
          solicitud AS SOL
            LEFT JOIN base AS BAS ON SOL.id_base = BAS.id_base
            LEFT JOIN refaccion_solicitada AS REF_SOL ON SOL.id_solicitud = REF_SOL.id_solicitud
            LEFT JOIN refacciones_catalogo AS REF_CAT ON REF_SOL.id_refaccion = REF_CAT.id_refaccion
            LEFT JOIN compras_actualizacion AS COM_ACT ON REF_SOL.id_refaccion_solicitada = COM_ACT.id_refaccion_solicitada
        WHERE
            REF_SOL.estatus IS NOT NULL
            AND REF_SOL.estatus <> 'cancelada'
            AND REF_SOL.estatus <> 'por_solicitar'
        ORDER BY
          SOL.fecha_solicitud_completa DESC;
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return res.json({ 
        OK: true,
        result: solicitudes
      });

    } catch (error) {
      console.error('Error en ActualizarSolicitud:', error);
      return res.json(error);
    }
  }

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

        // if(clavesCoincidentes.length > 0 && !solicitud.causa_solicitud_nuevamente){
        //   return res.json({
        //     OK: false,
        //     clavesCoincidentes
        //   });
        // }

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
    let t;
    try {
      t = await app.database.sequelize.transaction();
      // Extraemos refacciones y solicitud
      let refacciones = req.body.data.refacciones;
      delete req.body.data.refacciones;
      const solicitud = req.body.data;
      const solicitudCompleta = req.body.solicitudCompleta;
      const estadoInicial = solicitud.estado;
  
      // Rutas de evidencias
      const evidenciasSolicitudes = path.join(__dirname, '../../evidencias/solicitudes');
      const evidenciaRefacciones = path.join(__dirname, '../../evidencias/refacciones');
  
      // —————————————————————————————
      // 1) Lógica de evidencias y actualización de la solicitud
      // —————————————————————————————
      const evAnt = await Solicitud.findOne({
        where: { id_solicitud: solicitud.id_solicitud },
        attributes: [
          'evidencia_advan',
          'evidencia_vale_diagnostico',
          'evidencia_vale_almacen',
          'evidencia_autorizacion_jefatura',
          'evidencia_autorizacion_gerencia',
          'evidencia_autorizacion_CI'
        ],
        transaction: t,
      });
  
      const procesarEvidenciaSolicitud = async (campo, carpeta) => {
        const data = solicitud[campo];
        if (!data) return;
        const m = data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (m && m.length === 3) {
          EliminarEvidenciaAnterior(evAnt[campo], carpeta);
          solicitud[campo] = saveBase64File(data, carpeta, campo, solicitud, 'solicitud');
        }
      };
  
      await Promise.all([
        procesarEvidenciaSolicitud('evidencia_advan', evidenciasSolicitudes),
        procesarEvidenciaSolicitud('evidencia_vale_diagnostico', evidenciasSolicitudes),
        procesarEvidenciaSolicitud('evidencia_vale_almacen', evidenciasSolicitudes),
        procesarEvidenciaSolicitud('evidencia_autorizacion_jefatura', evidenciasSolicitudes),
        procesarEvidenciaSolicitud('evidencia_autorizacion_gerencia', evidenciasSolicitudes),
        procesarEvidenciaSolicitud('evidencia_autorizacion_CI', evidenciasSolicitudes),
      ]);
  
      // estados especiales de solicitud
      if (solicitudCompleta) {
        solicitud.estado = 3;
        solicitud.fecha_solicitud_completa = moment().format('YYYY-MM-DD HH:mm:ss');
      }
      if (estadoInicial === 4) {
        solicitud.estado = 3;
        solicitud.comentario_rechazo_solicitud = null;
      }
  
      // actualiza la solicitud
      await Solicitud.update(solicitud, {
        where: { id_solicitud: solicitud.id_solicitud },
        transaction: t,
      });
  
      // —————————————————————————————
      // 2) Traer refacciones actuales
      // —————————————————————————————
      const actuales = await refaccionSolicitada.findAll({
        where: { 
          id_solicitud: solicitud.id_solicitud,
          estatus: {
            [Op.in]: ['por_solicitar', 'solicitud_rechazada']
          }
        },
        transaction: t,
      });
      const actualesById = new Map(actuales.map(r => [r.id_refaccion_solicitada, r]));
  
      // —————————————————————————————
      // 3) Separar incoming en: crear, actualizar, eliminar
      // —————————————————————————————
      const toCreate = [];
      const toUpdate = [];
      const incomingIds = new Set();
  
      for (let r of refacciones) {
        if (r.id_refaccion_solicitada) {
          incomingIds.add(r.id_refaccion_solicitada);
          if (actualesById.has(r.id_refaccion_solicitada)) {
            toUpdate.push(r);
          } else {
            // id invalido = como nueva
            r.id_refaccion_solicitada = null;
            toCreate.push(r);
          }
        } else {
          toCreate.push(r);
        }
      }
  
      const toDeleteIds = actuales
        .filter(r => !incomingIds.has(r.id_refaccion_solicitada))
        .map(r => r.id_refaccion_solicitada);
  
      // —————————————————————————————
      // 4) Eliminar las que no vienen
      // —————————————————————————————
      if (toDeleteIds.length) {
        await refaccionSolicitada.destroy({
          where: { id_refaccion_solicitada: toDeleteIds },
          transaction: t,
        });
      }
  
      // —————————————————————————————
      // 5) Actualizar existentes
      // —————————————————————————————
      for (let r of toUpdate) {
        const prev = actualesById.get(r.id_refaccion_solicitada);
  
        // procesar evidencias de refacción
        const procesarEvidenciaRef = async (campo) => {
          const data = r[campo];
          if (!data) return;
          const m = data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (m && m.length === 3) {
            EliminarEvidenciaAnterior(prev[campo], evidenciaRefacciones);
            r[campo] = saveBase64File(data, evidenciaRefacciones, campo, r, 'refaccion');
          }
        };
        await Promise.all([
          procesarEvidenciaRef('evidencia_core'),
          procesarEvidenciaRef('evidencia_tarjeta_roja'),
          procesarEvidenciaRef('evidencia_ausencia_core'),
          procesarEvidenciaRef('evidencia_reporte_danos'),
        ]);
  
        // condicionales de estatus
        if (solicitudCompleta || estadoInicial === 4) {
          r.estatus = 'pte_validar_sol_ac';
          await CambioEstatusRefaccion.create({
            id_refaccion_solicitada: r.id_refaccion_solicitada,
            estatus: r.estatus,
            fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
          }, { transaction: t });
        }
  
        // actualiza la refacción
        await refaccionSolicitada.update({
          cantidad: r.cantidad,
          core: r.core,
          estatus: r.estatus,
          evidencia_core: r.evidencia_core,
          evidencia_tarjeta_roja: r.evidencia_tarjeta_roja,
          evidencia_ausencia_core: r.evidencia_ausencia_core,
          evidencia_reporte_danos: r.evidencia_reporte_danos,
        }, {
          where: { id_refaccion_solicitada: r.id_refaccion_solicitada },
          transaction: t,
        });
      }
  
      // —————————————————————————————
      // 6) Crear nuevas refacciones
      // —————————————————————————————
      if (toCreate.length) {
        const nuevos = [];
        for (let r of toCreate) {
          // procesar evidencias
          if (r.evidencia_core) {
            r.evidencia_core = saveBase64File(r.evidencia_core, evidenciaRefacciones, 'evidencia_core', r, 'refaccion');
          }
          if (r.evidencia_tarjeta_roja) {
            r.evidencia_tarjeta_roja = saveBase64File(r.evidencia_tarjeta_roja, evidenciaRefacciones, 'evidencia_tarjeta_roja', r, 'refaccion');
          }
          if (r.evidencia_ausencia_core) {
            r.evidencia_ausencia_core = saveBase64File(r.evidencia_ausencia_core, evidenciaRefacciones, 'evidencia_ausencia_core', r, 'refaccion');
          }
          if (r.evidencia_reporte_danos) {
            r.evidencia_reporte_danos = saveBase64File(r.evidencia_reporte_danos, evidenciaRefacciones, 'evidencia_reporte_danos', r, 'refaccion');
          }
  
          // estatus inicial
          if (solicitudCompleta || estadoInicial === 4) {
            r.estatus = 'pte_validar_sol_ac';
          }
  
          nuevos.push({
            id_solicitud: solicitud.id_solicitud,
            id_refaccion: r.id_refaccion,
            cantidad: r.cantidad,
            core: r.core,
            estatus: r.estatus,
            evidencia_core: r.evidencia_core,
            evidencia_tarjeta_roja: r.evidencia_tarjeta_roja,
            evidencia_ausencia_core: r.evidencia_ausencia_core,
            evidencia_reporte_danos: r.evidencia_reporte_danos,
          });
        }
  
        const created = await refaccionSolicitada.bulkCreate(nuevos, { transaction: t });
  
        // registra cambio de estatus para los nuevos
        if (solicitudCompleta || estadoInicial === 4) {
          const cambios = created.map(r => ({
            id_refaccion_solicitada: r.id_refaccion_solicitada,
            estatus: r.estatus,
            fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
          }));
          await CambioEstatusRefaccion.bulkCreate(cambios, { transaction: t });
        }
      }
  
      await t.commit();
      return res.json({ OK: true });
    } catch (error) {
      if (t) await t.rollback();
      console.error('Error en ActualizarSolicitud:', error);
      return res.status(500).json({ OK: false, error: error.message });
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

        // console.log('Peticion', req.body)

        const refaccionesActualizadas = await Promise.all(
          refacciones.map(async (refaccion) => {

            if(refaccion.colocarNumeroPedido){
              refaccion.estatus = 'en_proceso_compras'
            }

            if(refaccion.pasarAEnviar){
              refaccion.estatus = 'pte_enviar_ac'
              refaccion.numero_pedido = 'stock'
            }

            if(refaccion.refaccionRechazada){
              refaccion.estatus = 'solicitud_rechazada';
              refaccion.numero_pedido = null;
            }

            await refaccionSolicitada.update(
              {
                estatus: refaccion.estatus,
                numero_pedido: refaccion.numero_pedido,
                comentario_rechazo_refaccion: refaccion.comentario_rechazo_refaccion ? refaccion.comentario_rechazo_refaccion : null,
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

        const refaccionesRechazadas = refacciones.filter(refaccion => refaccion.refaccionRechazada);

        // console.log('Refacciones rechazadas', refaccionesRechazadas)

        const solicitudActualizada = await Solicitud.update(
          {
            estado: refaccionesRechazadas.length > 0 ? 4 : 5,
          },
          {
            where: {id_solicitud: solicitud.id_solicitud}
          }
        );

        // console.log('response', {solicitudActualizada, refaccionesActualizadas})

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

  app.cancelarSolicitudDeRefaccion = async (req, res) => {
    const id_refaccion_solicitada = req.params.id_refaccion_solicitada;
    const { causa_de_cancelar } = req.body;

    // console.log(id_refaccion_solicitada, causa_de_cancelar)
    
    try {
      const cancelacion = await refaccionSolicitada.update(
        {
          estatus: 'cancelada',
          causa_de_cancelar: causa_de_cancelar,
        },
        { where: {id_refaccion_solicitada: id_refaccion_solicitada}}
      );

      await CambioEstatusRefaccion.create({
        id_refaccion_solicitada: id_refaccion_solicitada,
        estatus: 'cancelada',
        fecha_cambio: moment().format('YYYY-MM-DD HH:mm:ss'),
      });

      return res.json({
        OK: true,
        msg: {cancelacion, CambioEstatusRefaccion}
      });
    } catch (error) {
      console.error('Error en ActualizarSolicitud:', error);
      return res.json(error);
    }

  }

  app.eliminarSolicitud = async (req, res) => {

    const id_solicitud = req.params.id_solicitud;

    try {

      const solicitud = await Solicitud.findByPk(id_solicitud, {
        attributes: ['id_solicitud', 'estado'],
        include: [
          {
            model: refaccionSolicitada,
            attributes: ['id_refaccion_solicitada', 'estatus'],
            required: false,
            as: 'refaccionesSolicitadas',
          },
        ]
      });

      if (!solicitud) {
        return res.json({
          OK: false,
          error: 'Solicitud no encontrada'
        });
      }

      // Separar las refacciones por estatus
      const refaccionesPorEliminar = solicitud.refaccionesSolicitadas.filter(refaccion =>
        ['por_solicitar', 'solicitud_rechazada'].includes(refaccion.estatus)
      );

      // console.log('Por eliminar', refaccionesPorEliminar)

      const refaccionesNoPorEliminar = solicitud.refaccionesSolicitadas.filter(refaccion =>
        !['por_solicitar', 'solicitud_rechazada'].includes(refaccion.estatus)
      );

      // console.log('No eliminar', refaccionesNoPorEliminar)

      if (refaccionesPorEliminar.length > 0) {
        const refaccionesIds = refaccionesPorEliminar.map(refaccion => refaccion.id_refaccion_solicitada);

        await refaccionSolicitada.destroy({
          where: {
            id_refaccion_solicitada: {
              [Op.in]: refaccionesIds
            }
          }
        });
      }

      // console.log('estado', solicitud.estado)
      // console.log('lenght', refaccionesNoPorEliminar.length)
      if(solicitud.estado === 4 && refaccionesNoPorEliminar.length > 0){

        const [updatedRows] = await Solicitud.update(
          {
            estado: 5,
          },
          {
            where: { id_solicitud: id_solicitud }
          }
        );

        if (updatedRows === 0) {
          console.log(`No se actualizó la solicitud con id ${id_solicitud} a estado 5`);
        } else {
          console.log(`Solicitud con id ${id_solicitud} actualizada a estado 5`);
        }
      }

      if (refaccionesNoPorEliminar.length > 0) {
        return res.json({
          OK: true,
          msg: 'refacciones asociadas eliminadas correctamente'
        });
      }

      // Eliminar la solicitud si no hay refacciones con otros estatus
      await Solicitud.destroy({
        where: {
          id_solicitud: solicitud.id_solicitud
        }
      });

      return res.json({
        OK: true,
        msg: 'Solicitud y refacciones asociadas eliminadas correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar la solicitud:', error);
      return res.json({
        OK: false,
        error: error.message
      });
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
