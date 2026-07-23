import pool from "../config/db.js";


// Converts "" / undefined to null so numeric columns never choke
const toNumericOrNull = (value) => {
    if (value === "" || value === undefined || value === null) return null;
    return value;
};

// Create service
export const createService = async (data) => {
    const {
        name,
        description,
        price,
        min_price,
        max_price,
        pricing_type,
        unit
    } = data;

    const result = await pool.query(
        `
        INSERT INTO service_catalog
        (name, description, price, min_price, max_price, pricing_type, unit)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
            name,
            description,
            toNumericOrNull(price),
            toNumericOrNull(min_price),
            toNumericOrNull(max_price),
            pricing_type || 'fixed',
            unit || null
        ]
    );

    return result.rows[0];
};




// Get all services
export const getServices = async () => {

    const result = await pool.query(
        `
        SELECT *
        FROM service_catalog
        ORDER BY id DESC
        `
    );


    return result.rows;

};




// Get single service
export const getServiceById = async(id)=>{


    const result = await pool.query(
        `
        SELECT *
        FROM service_catalog
        WHERE id=$1
        `,
        [id]
    );


    return result.rows[0];

};





// Update service
export const updateService = async (id, data) => {
    const {
        name,
        description,
        price,
        min_price,
        max_price,
        pricing_type,
        unit
    } = data;

    const result = await pool.query(
        `
        UPDATE service_catalog
        SET
            name=$1,
            description=$2,
            price=$3,
            min_price=$4,
            max_price=$5,
            pricing_type=$6,
            unit=$7
        WHERE id=$8
        RETURNING *
        `,
        [
            name,
            description,
            toNumericOrNull(price),
            toNumericOrNull(min_price),
            toNumericOrNull(max_price),
            pricing_type,
            unit,
            id
        ]
    );

    return result.rows[0];
};





// Delete service
export const deleteService = async(id)=>{


    await pool.query(
        `
        DELETE FROM service_catalog
        WHERE id=$1
        `,
        [id]
    );


};
