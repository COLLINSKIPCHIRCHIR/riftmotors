import pool from "../config/db.js";


// Create service
export const createService = async (data) => {

    const {
        name,
        description,
        price,
        min_price,
        max_price
    } = data;


    const result = await pool.query(
        `
        INSERT INTO service_catalog
        (
            name,
            description,
            price,
            min_price,
            max_price
        )

        VALUES($1,$2,$3,$4,$5)

        RETURNING *
        `,
        [
            name,
            description,
            price,
            min_price,
            max_price
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
export const updateService = async(id,data)=>{


    const {
        name,
        description,
        price,
        min_price,
        max_price
    } = data;


    const result = await pool.query(
        `
        UPDATE service_catalog

        SET
        name=$1,
        description=$2,
        price=$3
        min_price=$4,
        max_price=$5

        WHERE id=$6

        RETURNING *

        `,
        [
            name,
            description,
            price,
            min_price,
            max_price,
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
