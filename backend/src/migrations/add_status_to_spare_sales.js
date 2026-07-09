import pool from "../config/db.js"; // your PostgreSQL pool

const addStatusColumn = async () => {
  try {
    // Add the column
    await pool.query(`
      ALTER TABLE spare_sales
      ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
    `);

    console.log("✅ status column added to spare_sales table successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to add status column:", err);
    process.exit(1);
  }
};

addStatusColumn();
