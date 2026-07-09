// src/models/userModel.js
import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'cashier',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  console.log("✅ Users table ready");
};

// Function to create a new user
export const createUser = async (
    username,
    email,
    password,
    role_id
)=>{

    const hashedPassword =
    await bcrypt.hash(password,10);

    const result =
    await pool.query(

    `

    INSERT INTO users
    (
        username,
        email,
        password,
        role_id
    )

    VALUES($1,$2,$3,$4)

    RETURNING
    id,
    username,
    email,
    role_id

    `,

    [
        username,
        email,
        hashedPassword,
        role_id
    ]

    );

    return result.rows[0];

}

// Function to find user by email
export const findUserByEmail = async (email) => {
  const query = 
  `SELECT
    u.*,
    r.name AS role,
    COALESCE(
        ARRAY_AGG(DISTINCT p.name)
        FILTER (WHERE p.name IS NOT NULL),
        '{}'
    ) AS permissions

    FROM users u

    JOIN roles r
    ON u.role_id = r.id

    LEFT JOIN role_permissions rp
    ON r.id = rp.role_id

    LEFT JOIN permissions p
    ON rp.permission_id = p.id

    WHERE u.email = $1

    GROUP BY
    u.id,
    r.name;`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
};


export const getAllUsers = async () => {

    const result = await pool.query(`

        SELECT

            u.id,
            u.username,
            u.email,
            u.is_active,
            u.created_at,

            r.id AS role_id,
            r.name AS role

        FROM users u

        JOIN roles r
            ON u.role_id = r.id

        ORDER BY u.username ASC

    `);

    return result.rows;

};


export const adminCreateUser = async (

    username,
    email,
    password,
    role_id

) => {

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(

        `

        INSERT INTO users
        (
            username,
            email,
            password,
            role_id
        )

        VALUES
        (
            $1,
            $2,
            $3,
            $4
        )

        RETURNING *

        `,

        [
            username,
            email,
            hashedPassword,
            role_id
        ]

    );

    return result.rows[0];

};


export const updateUser = async (

    id,
    username,
    email,
    role_id

) => {

    const result = await pool.query(

        `

        UPDATE users

        SET

            username = $1,
            email = $2,
            role_id = $3

        WHERE id = $4

        RETURNING *

        `,

        [
            username,
            email,
            role_id,
            id
        ]

    );

    return result.rows[0];

};


export const toggleUserStatus = async (id) => {

    const result = await pool.query(

        `

        UPDATE users

        SET is_active = NOT is_active

        WHERE id = $1

        RETURNING is_active

        `,

        [id]

    );

    return result.rows[0];

};

export const resetUserPassword = async (

    id,
    password

) => {

    const hashedPassword = await bcrypt.hash(password,10);

    await pool.query(

        `

        UPDATE users

        SET password = $1

        WHERE id = $2

        `,

        [
            hashedPassword,
            id
        ]

    );

};