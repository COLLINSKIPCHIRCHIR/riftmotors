import pool from "../config/db.js";


export const getAllRoles = async () => {
    const result = await pool.query(`
        SELECT
            id,
            name,
            description
        FROM roles
        ORDER BY id
    `);

    return result.rows;
};

export const getAllPermissions = async () => {
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


export const getRolePermissions = async (roleId) => {

    const permissions = await pool.query(`

        SELECT
            permission_id

        FROM role_permissions

        WHERE role_id = $1

    `,[roleId]);

    return permissions.rows.map(p => p.permission_id);

};


export const updateRolePermissions = async (
    roleId,
    permissionIds
) => {

    const client = await pool.connect();

    try{

        await client.query("BEGIN");

        await client.query(

            `DELETE FROM role_permissions
             WHERE role_id = $1`,

            [roleId]

        );

        for(const permissionId of permissionIds){

            await client.query(

                `

                INSERT INTO role_permissions
                (
                    role_id,
                    permission_id
                )

                VALUES($1,$2)

                `,

                [roleId, permissionId]

            );

        }

        await client.query("COMMIT");

    }catch(error){

        await client.query("ROLLBACK");

        throw error;

    }finally{

        client.release();

    }

};