import dotenv from "dotenv";
import pool from "../config/db.js";

dotenv.config();

const createSpareEstimateTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spare_estimates (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(50),
        subtotal NUMERIC(12,2) NOT NULL,
        discount NUMERIC(12,2) DEFAULT 0,
        total NUMERIC(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS spare_estimate_items (
        id SERIAL PRIMARY KEY,
        estimate_id INT NOT NULL REFERENCES spare_estimates(id) ON DELETE CASCADE,
        sparepart_id INT NOT NULL REFERENCES spareparts(id),
        quantity INT NOT NULL,
        unit_price NUMERIC(12,2) NOT NULL,
        total_price NUMERIC(12,2) NOT NULL
      );
    `);

    console.log("✅ Spare estimate tables created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating spare estimate tables:", error);
    process.exit(1);
  }
};

createSpareEstimateTables();
