// src/models/vehicleModel.js
import pool from "../config/db.js";

// ✅ Create vehicles table if not exists
export const createVehicleTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      consignor VARCHAR(100),
      make VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year INT,
      best_price NUMERIC(12,2),
      selling_price NUMERIC(12,2),
      is_negotiable BOOLEAN DEFAULT false,
      visible_in_inventory BOOLEAN DEFAULT true,
      mileage INT,
      color VARCHAR(50),
      transmission VARCHAR(50),
      fuel_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'available',
      image_url TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  console.log("✅ Vehicles table ready");
};

// ✅ Add new vehicle
export const addVehicle = async (vehicleData) => {
  const {
    consignor,
    make,
    model,
    year,
    best_price,
    selling_price,
    is_negotiable,
    visible_in_inventory,
    mileage,
    color,
    transmission,
    fuel_type,
    status,
    image_url,
    description,
  } = vehicleData;

  const query = `
    INSERT INTO vehicles
      (consignor, make, model, year, best_price, selling_price, is_negotiable,
       visible_in_inventory, mileage, color, transmission, fuel_type, status, image_url, description)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *;
  `;

  const values = [
    consignor,
    make,
    model,
    year,
    best_price,
    selling_price,
    is_negotiable ?? false,
    visible_in_inventory ?? true,
    mileage,
    color,
    transmission,
    fuel_type,
    status || "available",
    image_url,
    description,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ✅ Get all vehicles
export const getAllVehicles = async () => {
  const query = `SELECT * FROM vehicles ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
};

// ✅ Get single vehicle by ID
export const getVehicleById = async (id) => {
  const query = `SELECT * FROM vehicles WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// ✅ Update vehicle
export const updateVehicle = async (id, vehicleData) => {
  const {
    consignor,
    make,
    model,
    year,
    best_price,
    selling_price,
    is_negotiable,
    visible_in_inventory,
    mileage,
    color,
    transmission,
    fuel_type,
    status,
    image_url,
    description,
  } = vehicleData;

  const query = `
    UPDATE vehicles
    SET consignor = $1, make = $2, model = $3, year = $4, best_price = $5,
        selling_price = $6, is_negotiable = $7, visible_in_inventory = $8,
        mileage = $9, color = $10, transmission = $11, fuel_type = $12,
        status = $13, image_url = $14, description = $15
    WHERE id = $16
    RETURNING *;
  `;

  const values = [
    consignor,
    make,
    model,
    year,
    best_price,
    selling_price,
    is_negotiable,
    visible_in_inventory,
    mileage,
    color,
    transmission,
    fuel_type,
    status,
    image_url,
    description,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ✅ Delete vehicle
export const deleteVehicle = async (id) => {
  const query = `DELETE FROM vehicles WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
