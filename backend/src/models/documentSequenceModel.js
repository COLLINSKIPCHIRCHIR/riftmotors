import pool from "../config/db.js";

export const createDocumentSequenceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS document_sequences (
      doc_type VARCHAR(30) PRIMARY KEY,
      prefix VARCHAR(20) NOT NULL,
      last_number INT NOT NULL DEFAULT 0
    );
  `;
  await pool.query(query);

  // Seed known sequences if not already present
  await pool.query(
    `INSERT INTO document_sequences (doc_type, prefix, last_number)
     VALUES ('sales_quote', 'RML/Q/', 1174)
     ON CONFLICT (doc_type) DO NOTHING;`
  );

  console.log("✅ Document sequences table ready");
};

// Must be called with a client that is inside an active transaction
export const getNextDocumentRef = async (client, docType) => {
  const result = await client.query(
    `UPDATE document_sequences
     SET last_number = last_number + 1
     WHERE doc_type = $1
     RETURNING prefix, last_number;`,
    [docType]
  );

  if (result.rows.length === 0) {
    throw new Error(`No document sequence configured for type: ${docType}`);
  }

  const { prefix, last_number } = result.rows[0];
  return `${prefix}${last_number}`;
};