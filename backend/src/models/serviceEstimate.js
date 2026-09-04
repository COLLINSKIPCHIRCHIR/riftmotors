import pool from "../config/db.js";


export const recalculateEstimateTotals = async (client, estimate_id) => {

  const items = await client.query(
    `
    SELECT
    total_price

    FROM service_estimate_items

    WHERE estimate_id=$1

    `,
    [
      estimate_id
    ]

  );


  let subtotal = 0;


  items.rows.forEach(item => {

    subtotal += Number(item.total_price);

  });


  const estimate = await client.query(

    `
    SELECT

    tax_rate,
    discount_type,
    discount

    FROM service_estimates

    WHERE id=$1

    `,
    [
      estimate_id
    ]

  );


  const data = estimate.rows[0];


  const taxAmount =
    subtotal * (Number(data.tax_rate) / 100);


  let discountAmount = 0;


  if (data.discount_type === "percentage") {

    discountAmount =
      subtotal *
      (Number(data.discount) / 100);

  } else {

    discountAmount =
      Number(data.discount);

  }


  const total =
    subtotal +
    taxAmount -
    discountAmount;


  await client.query(

    `

    UPDATE service_estimates

    SET

    subtotal=$1,

    tax_amount=$2,

    total=$3

    WHERE id=$4


    `,

    [

      subtotal,

      taxAmount,

      total,

      estimate_id

    ]

  );


}


// CREATE SERVICE ESTIMATE FROM JOB
export const createServiceEstimate = async (
  {
    job_id,
    discount_type = "amount",
    discount = 0,
    tax_rate = 0
  }) => {


  const client = await pool.connect();


  try {


    await client.query("BEGIN");



    // get job customer details

    const jobResult = await client.query(
  `
  SELECT
sj.id,
sj.job_number,
sj.driver_name,
sj.driver_phone,
sj.bill_to_customer_id,
sj.bill_to_name,
sj.bill_to_kra_pin,
c.name AS customer_name,
c.phone AS customer_phone,
c.kra_pin AS customer_kra_pin
FROM service_jobs sj
LEFT JOIN customers c ON sj.customer_id = c.id
WHERE sj.id=$1
  `,
  [job_id]
);



    if (jobResult.rows.length === 0) {

      throw new Error("Job not found");

    }


    const job = jobResult.rows[0];

    const billToCustomerId = job.bill_to_customer_id || null;
    const billToName = job.bill_to_name || job.customer_name;
    const billToKraPin = job.bill_to_kra_pin || job.customer_kra_pin;

    // Estimate number always mirrors the job number so the two documents
    // are traceable at a glance (JOB-000123 -> EST-000123). If this job
    // already has an estimate, this will collide on re-generation - that's
    // expected, since a job should only ever carry one live estimate.
    const estimate_number = job.job_number.startsWith("JOB-")
  ? job.job_number.replace("JOB-", "EST-")
  : `EST-${job.job_number}`;


    // get services
    // LEFT JOIN here (not INNER JOIN) — custom services have service_id
    // NULL and no service_catalog row, so an inner join would silently
    // drop them from the estimate. name falls back to custom_name,
    // min_price/max_price come back null for custom rows and that's fine,
    // they're only used for the min/max clamp on catalog services.

   const services = await client.query(
  `
  SELECT

  js.id AS job_item_id,
  js.created_at,
  js.service_id,
  js.is_custom,
  COALESCE(sc.name, js.custom_name) AS name,
  js.quantity,
  js.price,
  sc.min_price,
  sc.max_price

  FROM job_services js

  LEFT JOIN service_catalog sc
  ON js.service_id=sc.id

  WHERE js.job_id=$1

  `,
  [job_id]
);



    // get parts

const parts = await client.query(
  `
  SELECT
  jp.id AS job_item_id,
  jp.created_at,
  jp.sparepart_id,
  jp.customer_supplied,
  jp.is_custom,
  COALESCE(sp.name, jp.part_name) AS name,
  jp.quantity,
  jp.unit_price
  FROM job_parts jp
  LEFT JOIN spareparts sp ON jp.sparepart_id = sp.id
  WHERE jp.job_id=$1
  `,
  [job_id]
);



    let subtotal = 0;




    services.rows.forEach(item => {

      subtotal +=
        Number(item.price) *
        Number(item.quantity);

    });


    parts.rows.forEach(item => {

      subtotal +=
        Number(item.unit_price) *
        Number(item.quantity);

    });


    const taxAmount =
      subtotal * (Number(tax_rate) / 100);



    let discountAmount = 0;



    if (discount_type === "percentage") {


      discountAmount =
        subtotal * (Number(discount) / 100);


    } else {


      discountAmount =
        Number(discount);


    }




    const total =
      subtotal +
      taxAmount -
      discountAmount;




    // create estimate


    const estimate = await client.query(
  `
  INSERT INTO service_estimates
(
job_id,
estimate_number,
customer_name,
customer_phone,
driver_name,
driver_phone,
bill_to_customer_id,
bill_to_name,
bill_to_kra_pin,
subtotal,
discount_type,
discount,
tax_rate,
tax_amount,
total,
status
)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending')
RETURNING *
  `,

  [
    job_id,
    estimate_number,
    job.customer_name,
    job.customer_phone,
    job.driver_name,
    job.driver_phone,
    billToCustomerId,
    billToName,
    billToKraPin,
    subtotal,
    discount_type,
    discount,
    tax_rate,
    taxAmount,
    total
  ]
);



    const estimate_id =
      estimate.rows[0].id;





    // insert services


    const mergedItems = [
  ...services.rows.map(row => ({ ...row, item_type: "service" })),
  ...parts.rows.map(row => ({ ...row, item_type: "sparepart" })),
].sort((a, b) => {
  const diff = new Date(a.created_at) - new Date(b.created_at);
  return diff !== 0 ? diff : a.job_item_id - b.job_item_id;
});

for (const item of mergedItems) {

  const originalPrice = item.customer_supplied
  ? 0
  : item.item_type === "service"
    ? Number(item.price) * Number(item.quantity)
    : Number(item.unit_price) * Number(item.quantity);

  const adjustment = 0;
  const finalPrice = originalPrice - adjustment;

  if (item.item_type === "service") {

    await client.query(
      `
      INSERT INTO service_estimate_items

      (
      estimate_id,
      item_type,
      service_id,
      description,
      quantity,
      unit_price,
      original_price,
      adjustment,
      total_price,
      min_price,
      max_price,
      customer_supplied,
      is_custom
      )

      VALUES($1,'service',$2,$3,$4,$5,$6,$7,$8,$9,$10,false,$11)
      `,
      [
        estimate_id,
        item.service_id,
        item.name,
        item.quantity,
        item.price,
        originalPrice,
        adjustment,
        finalPrice,
        item.min_price,
        item.max_price,
        item.is_custom || false
      ]
    );

  } else {

    await client.query(
      `
      INSERT INTO service_estimate_items

      (
      estimate_id,
      item_type,
      sparepart_id,
      description,
      quantity,
      unit_price,
      original_price,
      adjustment,
      total_price,
      discount_type,
      discount_value,
      customer_supplied,
      is_custom
      )

      VALUES($1,'sparepart',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        estimate_id,
        item.sparepart_id,
        item.name,
        item.quantity,
        item.unit_price,
        originalPrice,
        adjustment,
        finalPrice,
        "amount",
        0,
        item.customer_supplied,
        item.is_custom || false
      ]
    );

  }

}

    await recalculateEstimateTotals(
      client,
      estimate_id
    );


    await client.query("COMMIT");


    return estimate.rows[0];



  } catch (error) {


    await client.query("ROLLBACK");

    throw error;


  } finally {


    client.release();


  }


};






// GET ALL ESTIMATES

export const getServiceEstimates = async () => {


  const result = await pool.query(

    `
    SELECT *

    FROM service_estimates

    ORDER BY created_at DESC

    `

  );


  return result.rows;


};








// GET SINGLE ESTIMATE

export const getServiceEstimateById = async (id) => {


  const estimate = await pool.query(

    `
    SELECT

    se.*,

    sj.job_number,

    cv.registration_number,
    cv.make      AS vehicle_make,
    cv.model     AS vehicle_model,
    cv.year      AS vehicle_year,
    cv.mileage,
    cv.color     AS vehicle_color,
    cv.vin_no,
    cv.engine_number,

    c.kra_pin  AS customer_kra_pin,
    c.address  AS customer_address,
    c.email    AS customer_email

    FROM service_estimates se

    LEFT JOIN service_jobs sj
    ON se.job_id = sj.id

    LEFT JOIN customer_vehicles cv
    ON sj.vehicle_id = cv.id

    LEFT JOIN customers c
    ON sj.customer_id = c.id

    WHERE se.id=$1

    `,
    [id]

  );



  if (estimate.rows.length === 0) {

    return null;

  }




  const items = await pool.query(

    `
    SELECT *

    FROM service_estimate_items

    WHERE estimate_id=$1

    ORDER BY id

    `,
    [id]

  );




  return {


    ...estimate.rows[0],

    items: items.rows


  };


};