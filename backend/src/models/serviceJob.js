import pool from "../config/db.js";


export const createServiceJob = async(data)=>{
const {
    job_number,
    customer_id,
    vehicle_id,
    driver_name,
    driver_phone,
    bill_to_name,
    bill_to_kra_pin,
    complaint,
    diagnosis,
    notes,
    created_by
} = data;

const insertResult = await pool.query(
    `
    INSERT INTO service_jobs
    (job_number, customer_id, vehicle_id, driver_name, driver_phone, bill_to_name, bill_to_kra_pin, complaint, diagnosis, notes, created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
    `,
    [
      job_number,
      customer_id,
      vehicle_id,
      driver_name || null,
      driver_phone || null,
      bill_to_name || null,
      bill_to_kra_pin || null,
      complaint,
      diagnosis || null,
      notes || null,
      created_by || 1
    ]
);

return insertResult.rows[0];
};


export const getServiceJobs = async()=>{

const result = await pool.query(`

SELECT 

sj.*,

c.name AS customer_name,

cv.registration_number,

cv.make,

cv.model


FROM service_jobs sj


JOIN customers c
ON sj.customer_id = c.id


JOIN customer_vehicles cv
ON sj.vehicle_id = cv.id


ORDER BY

CASE WHEN sj.job_number ~ '^[0-9]+' THEN 0 ELSE 1 END,

CASE WHEN sj.job_number ~ '^[0-9]+'
     THEN substring(sj.job_number from '^[0-9]+')::bigint
     ELSE NULL
END DESC NULLS LAST,

sj.job_number DESC

`);


return result.rows;

};


// GET SINGLE JOB
export const getServiceJobById = async (id) => {

  const result = await pool.query(
    `
    SELECT

    sj.*,

    c.name          AS customer_name,
    c.phone         AS customer_phone,
    c.email         AS customer_email,
    c.address       AS customer_address,
    c.kra_pin       AS customer_kra_pin,

    cv.registration_number,
    cv.make,
    cv.model,
    cv.year         AS vehicle_year,
    cv.mileage,
    cv.color        AS vehicle_color,
    cv.vin_no,
    cv.engine_number

    FROM service_jobs sj

    JOIN customers c
    ON sj.customer_id = c.id

    JOIN customer_vehicles cv
    ON sj.vehicle_id = cv.id

    WHERE sj.id=$1

    `,
    [id]
  );

  if (result.rows.length === 0) {

    return null;

  }

  return result.rows[0];

};


// DAILY JOB REPORT
export const getDailyJobReport = async (from, to) => {

  const result = await pool.query(
    `
    SELECT

    sj.id,
    sj.job_number,
    sj.created_at,
    sj.complaint,
    sj.diagnosis,
    sj.notes,
    sj.status,

    c.name  AS customer_name,
    c.phone AS customer_phone,

    cv.registration_number,
    cv.make,
    cv.model,
    cv.mileage,

    COALESCE(mech.mechanic_names, '')  AS technicians,
    COALESCE(svc.service_names, '')    AS services,
    COALESCE(parts.part_list, '')      AS parts_required,
    COALESCE(pending.pending_names, '') AS pending_work

    FROM service_jobs sj

    JOIN customers c
    ON sj.customer_id = c.id

    JOIN customer_vehicles cv
    ON sj.vehicle_id = cv.id

    LEFT JOIN (
      SELECT sa.job_id, STRING_AGG(DISTINCT m.name, ', ') AS mechanic_names
      FROM service_assignments sa
      JOIN mechanics m ON sa.mechanic_id = m.id
      GROUP BY sa.job_id
    ) mech ON mech.job_id = sj.id

    LEFT JOIN (
      SELECT js.job_id, STRING_AGG(COALESCE(sc.name, js.custom_name), ', ') AS service_names
      FROM job_services js
      LEFT JOIN service_catalog sc ON js.service_id = sc.id
      GROUP BY js.job_id
    ) svc ON svc.job_id = sj.id

    LEFT JOIN (
      SELECT jp.job_id,
      STRING_AGG(
        COALESCE(sp.name, jp.part_name) || ' (x' || jp.quantity || ')',
        ', '
      ) AS part_list
      FROM job_parts jp
      LEFT JOIN spareparts sp ON jp.sparepart_id = sp.id
      GROUP BY jp.job_id
    ) parts ON parts.job_id = sj.id

    LEFT JOIN (
      SELECT js.job_id,
      STRING_AGG(COALESCE(sc.name, js.custom_name), ', ') AS pending_names
      FROM job_services js
      LEFT JOIN service_catalog sc ON js.service_id = sc.id
      WHERE js.is_completed = false
      GROUP BY js.job_id
    ) pending ON pending.job_id = sj.id

    WHERE sj.created_at::date BETWEEN $1 AND $2

    ORDER BY sj.created_at ASC

    `,
    [from, to]
  );

  return result.rows;
};


export const updateServiceJob = async (id, data) => {

  const allowedFields = [
    "complaint",
    "diagnosis",
    "notes",
    "driver_name",
    "driver_phone",
    "bill_to_name",
    "bill_to_kra_pin"
  ];

  const fields = Object.keys(data).filter(key => allowedFields.includes(key));

  if (fields.length === 0) {
    return null;
  }

  const setClause = fields
    .map((field, i) => `${field} = $${i + 1}`)
    .join(", ");

  const values = fields.map(field => data[field]);

  const result = await pool.query(
    `
    UPDATE service_jobs
    SET ${setClause}
    WHERE id = $${fields.length + 1}
    RETURNING *
    `,
    [...values, id]
  );

  return result.rows[0];

};