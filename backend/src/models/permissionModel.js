import pool from "../config/db.js";

export const getPermissions = async () => {

    const result = await pool.query(`
        SELECT
            id,
            name,
            module,
            description
        FROM permissions
        ORDER BY module, name
    `);

    return result.rows;
};