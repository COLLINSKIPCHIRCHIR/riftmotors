// src/migrations/add_receipt_number_to_spare_sales.js
import pool from "../config/db.js";

const runMigration = async () => {
  try {
    console.log("🚀 Running migration: add receipt_number to spare_sales...");

    await pool.query(`
      ALTER TABLE spare_sales
      ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);
    `);

    console.log("✅ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

runMigration();
