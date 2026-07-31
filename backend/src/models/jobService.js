import pool from "../config/db.js";
import { ensureJobEditable } from "../utils/jobGuards.js";

// Create service attached to a job
export const createJobService = async (data) => {
    const { job_id, service_id, is_custom, custom_name } = data;
    let { quantity, price } = data;

    await ensureJobEditable(job_id);

    // --- CUSTOM / NOT-IN-CATALOG SERVICE ---
    if (is_custom) {
        if (!custom_name || !custom_name.trim()) {
            const err = new Error("Enter a name for the custom service");
            err.statusCode = 400;
            throw err;
        }
        if (price === undefined || price === null || price === "") {
            const err = new Error("Enter a price for the custom service");
            err.statusCode = 400;
            throw err;
        }

        const result = await pool.query(
            `
            INSERT INTO job_services
            (job_id, service_id, custom_name, is_custom, quantity, price)
            VALUES ($1, NULL, $2, true, $3, $4)
            RETURNING *
            `,
            [job_id, custom_name.trim(), quantity || 1, price]
        );

        return result.rows[0];
    }

    // --- EXISTING CATALOG-BASED FLOW (unchanged) ---
    const catalogResult = await pool.query(
        `SELECT price, pricing_type FROM service_catalog WHERE id=$1`,
        [service_id]
    );

    const catalogService = catalogResult.rows[0];

    if (!catalogService) {
        const err = new Error("Service not found in catalog");
        err.statusCode = 404;
        throw err;
    }

    const pricing_type = catalogService.pricing_type;

    if (pricing_type === "variable" && (price === undefined || price === null || price === "")) {
        const err = new Error("This service requires a manually entered price after inspection");
        err.statusCode = 400;
        throw err;
    }

    quantity = pricing_type === "unit" ? (quantity || 1) : 1;
    const finalPrice = pricing_type === "variable" ? price : (price ?? catalogService.price);

    const result = await pool.query(
        `
        INSERT INTO job_services
        (job_id, service_id, quantity, price)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT(job_id,service_id)
        DO UPDATE SET
            quantity = CASE WHEN $5 = 'unit' THEN job_services.quantity + EXCLUDED.quantity ELSE 1 END,
            price = EXCLUDED.price
        RETURNING *
        `,
        [job_id, service_id, quantity, finalPrice, pricing_type]
    );

    return result.rows[0];
};

// Get services for one job
export const getJobServices = async (job_id) => {
    const result = await pool.query(
        `
        SELECT 
        js.*,
        COALESCE(sc.name, js.custom_name) AS service_name,
        sc.description,
        COALESCE(sc.pricing_type, 'fixed') AS pricing_type,
        sc.unit
        FROM job_services js
        LEFT JOIN service_catalog sc ON js.service_id = sc.id
        WHERE js.job_id=$1
        ORDER BY js.id DESC
        `,
        [job_id]
    );
    return result.rows;
};


// Delete service from job
export const deleteJobService = async (id) => {
    const existing = await pool.query(
        `SELECT job_id FROM job_services WHERE id=$1`,
        [id]
    );

    if (!existing.rows[0]) {
        return null;
    }

    await ensureJobEditable(existing.rows[0].job_id);

    const result = await pool.query(
        `
        DELETE FROM job_services
        WHERE id=$1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};