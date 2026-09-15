// src/models/vehicleModel.js
import pool from "../config/db.js";

/*
|--------------------------------------------------------------------------
| Add Vehicle
|--------------------------------------------------------------------------
*/

export const addVehicle = async (vehicleData) => {
  const {
    consignor_id,
    make,
    model,
    year,
    condition,
    chassis_no,
    engine_no,
    registration_no,
    model_code,
    best_price,
    selling_price,
    duty_free_price,
    duty_paid_price,
    is_negotiable,
    visible_in_inventory,
    mileage,
    color,
    transmission,
    fuel_type,
    status,
    description,

    // New vehicle specification fields
    engine_rating,
    max_power,
    max_torque,
    braking,
    seating_capacity,
    fuel_tank_litres,
    suspension,
    tyre_size,
    warranty_text,
    free_service_text,
    stock_quantity,
  } = vehicleData;

  const query = `
    INSERT INTO vehicles
      (
        consignor_id,
        make,
        model,
        year,
        condition,
        chassis_no,
        engine_no,
        registration_no,
        model_code,
        best_price,
        selling_price,
        duty_free_price,
        duty_paid_price,
        is_negotiable,
        visible_in_inventory,
        mileage,
        color,
        transmission,
        fuel_type,
        status,
        description,
        engine_rating,
        max_power,
        max_torque,
        braking,
        seating_capacity,
        fuel_tank_litres,
        suspension,
        tyre_size,
        warranty_text,
        free_service_text,
        stock_quantity
      )
    VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
        $31,$32
      )
    RETURNING *;
  `;

  const values = [
    consignor_id || null,
    make,
    model,
    year,
    condition || "used",
    chassis_no || null,
    engine_no || null,
    registration_no || null,
    model_code || null,
    best_price || null,
    selling_price,
    duty_free_price || null,
    duty_paid_price || null,
    is_negotiable ?? false,
    visible_in_inventory ?? true,
    mileage || null,
    color || null,
    transmission || null,
    fuel_type || null,
    status || "available",
    description || null,

    // New fields
    engine_rating || null,
    max_power || null,
    max_torque || null,
    braking || null,
    seating_capacity || null,
    fuel_tank_litres || null,
    suspension || null,
    tyre_size || null,
    warranty_text || null,
    free_service_text || null,
    stock_quantity ?? 1,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};


/*
|--------------------------------------------------------------------------
| Get All Vehicles
|--------------------------------------------------------------------------
*/

export const getAllVehicles = async () => {
  const query = `
    SELECT
      v.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', vi.id,
            'image_url', vi.image_url,
            'is_primary', vi.is_primary
          )
        ) FILTER (WHERE vi.id IS NOT NULL),
        '[]'
      ) AS images
    FROM vehicles v
    LEFT JOIN vehicle_images vi
      ON vi.vehicle_id = v.id
    GROUP BY v.id
    ORDER BY v.created_at DESC;
  `;

  const result = await pool.query(query);

  return result.rows;
};


/*
|--------------------------------------------------------------------------
| Get Vehicle By ID
|--------------------------------------------------------------------------
*/

export const getVehicleById = async (id) => {
  const vehicleResult = await pool.query(
    `SELECT * FROM vehicles WHERE id = $1`,
    [id]
  );

  const vehicle = vehicleResult.rows[0];

  if (!vehicle) return null;

  const imagesResult = await pool.query(
    `
      SELECT
        id,
        image_url,
        is_primary
      FROM vehicle_images
      WHERE vehicle_id = $1
      ORDER BY is_primary DESC, id ASC
    `,
    [id]
  );

  vehicle.images = imagesResult.rows;

  return vehicle;
};


/*
|--------------------------------------------------------------------------
| Update Vehicle
|--------------------------------------------------------------------------
*/

export const updateVehicle = async (id, vehicleData) => {
  const {
    consignor_id,
    make,
    model,
    year,
    condition,
    chassis_no,
    engine_no,
    registration_no,
    model_code,
    best_price,
    selling_price,
    duty_free_price,
    duty_paid_price,
    is_negotiable,
    visible_in_inventory,
    mileage,
    color,
    transmission,
    fuel_type,
    status,
    description,

    // New vehicle specification fields
    engine_rating,
    max_power,
    max_torque,
    braking,
    seating_capacity,
    fuel_tank_litres,
    suspension,
    tyre_size,
    warranty_text,
    free_service_text,
    stock_quantity,
  } = vehicleData;

  const query = `
    UPDATE vehicles
    SET
      consignor_id = $1,
      make = $2,
      model = $3,
      year = $4,
      condition = $5,
      chassis_no = $6,
      engine_no = $7,
      registration_no = $8,
      model_code = $9,
      best_price = $10,
      selling_price = $11,
      duty_free_price = $12,
      duty_paid_price = $13,
      is_negotiable = $14,
      visible_in_inventory = $15,
      mileage = $16,
      color = $17,
      transmission = $18,
      fuel_type = $19,
      status = $20,
      description = $21,

      -- New fields
      engine_rating = $22,
      max_power = $23,
      max_torque = $24,
      braking = $25,
      seating_capacity = $26,
      fuel_tank_litres = $27,
      suspension = $28,
      tyre_size = $29,
      warranty_text = $30,
      free_service_text = $31,
      stock_quantity = $32

    WHERE id = $33
    RETURNING *;
  `;

  const values = [
    consignor_id || null,
    make,
    model,
    year,
    condition,
    chassis_no || null,
    engine_no || null,
    registration_no || null,
    model_code || null,
    best_price || null,
    selling_price,
    duty_free_price || null,
    duty_paid_price || null,
    is_negotiable ?? false,
    visible_in_inventory ?? true,
    mileage || null,
    color || null,
    transmission || null,
    fuel_type || null,
    status || "available",
    description || null,

    // New fields
    engine_rating || null,
    max_power || null,
    max_torque || null,
    braking || null,
    seating_capacity || null,
    fuel_tank_litres || null,
    suspension || null,
    tyre_size || null,
    warranty_text || null,
    free_service_text || null,
    stock_quantity ?? 1,

    id,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};


/*
|--------------------------------------------------------------------------
| Adjust Vehicle Stock
|--------------------------------------------------------------------------
|
| delta:
|   +1 = add one vehicle to stock
|   -1 = remove one vehicle from stock
|
*/

export const adjustVehicleStock = async (id, delta) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query(
      `
        SELECT stock_quantity
        FROM vehicles
        WHERE id = $1
        FOR UPDATE
      `,
      [id]
    );

    if (!current.rows[0]) {
      throw new Error("Vehicle not found");
    }

    const newQty =
      Number(current.rows[0].stock_quantity) + Number(delta);

    if (newQty < 0) {
      throw new Error("Stock cannot go below zero");
    }

    const result = await client.query(
      `
        UPDATE vehicles
        SET stock_quantity = $1
        WHERE id = $2
        RETURNING *;
      `,
      [newQty, id]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


/*
|--------------------------------------------------------------------------
| Delete Vehicle
|--------------------------------------------------------------------------
*/

export const deleteVehicle = async (id) => {
  const query = `
    DELETE FROM vehicles
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};