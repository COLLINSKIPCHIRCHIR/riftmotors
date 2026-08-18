import pool from "../config/db.js";

// ===============================
// Create Skill
// ===============================
export const createEmployeeSkill = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO employee_skills
    (
        employee_id,
        skill_name,
        proficiency_level
    )

    VALUES
    ($1,$2,$3)

    RETURNING *;
    `,
    [
      data.employee_id,
      data.skill_name,
      data.proficiency_level,
    ]
  );

  return result.rows[0];
};

// ===============================
// Get All Skills
// ===============================
export const getAllEmployeeSkills = async () => {
  const result = await pool.query(`
    SELECT

        es.*,

        CONCAT(e.first_name,' ',e.last_name) AS employee_name,

        e.employee_number

    FROM employee_skills es

    JOIN employees e
    ON es.employee_id=e.id

    ORDER BY es.id DESC
  `);

  return result.rows;
};

// ===============================
// Skills By Employee
// ===============================
export const getEmployeeSkills = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_skills

    WHERE employee_id=$1

    ORDER BY skill_name ASC;
    `,
    [employeeId]
  );

  return result.rows;
};

// ===============================
// Get Skill By ID
// ===============================
export const getEmployeeSkillById = async (id) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_skills

    WHERE id=$1;
    `,
    [id]
  );

  return result.rows[0];
};

// ===============================
// Update Skill
// ===============================
export const updateEmployeeSkill = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE employee_skills

    SET

        skill_name=$1,
        proficiency_level=$2

    WHERE id=$3

    RETURNING *;
    `,
    [
      data.skill_name,
      data.proficiency_level,
      id,
    ]
  );

  return result.rows[0];
};

// ===============================
// Delete Skill
// ===============================
export const deleteEmployeeSkill = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM employee_skills

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};