import pool from "../config/db.js";

// Throws if the job doesn't exist or is already completed.
// Call this before any create/delete that touches a job's line items.
export const ensureJobEditable = async (job_id) => {
    const result = await pool.query(
        `SELECT status FROM service_jobs WHERE id=$1`,
        [job_id]
    );

    const job = result.rows[0];

    if (!job) {
        const err = new Error("Job not found");
        err.statusCode = 404;
        throw err;
    }

    if (job.status === "completed") {
        const err = new Error("Cannot modify a completed job");
        err.statusCode = 400;
        throw err;
    }
};