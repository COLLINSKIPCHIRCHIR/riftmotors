import pool from "../config/db.js";

// ===============================
// Create Employee
// ===============================
export const createEmployee = async (data) => {
  const query = `
    INSERT INTO employees
    (
      employee_number,
      user_id,
      branch_id,
      department_id,
      first_name,
      last_name,
      gender,
      date_of_birth,
      national_id,
      kra_pin,
      nssf_number,
      shif_number,
      phone,
      email,
      address,
      county,
      job_title,
      employment_type,
      employment_date,
      probation_end_date,
      termination_date,
      employment_status,
      payment_frequency,
      bank_name,
      bank_account_number,
      photo_url
    )

    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26
    )

    RETURNING *;
  `;

  const values = [
    data.employee_number,
    data.user_id || null,
    data.branch_id || null,
    data.department_id || null,
    data.first_name,
    data.last_name,
    data.gender,
    data.date_of_birth,
    data.national_id,
    data.kra_pin,
    data.nssf_number,
    data.shif_number,
    data.phone,
    data.email,
    data.address,
    data.county,
    data.job_title,
    data.employment_type,
    data.employment_date,
    data.probation_end_date,
    data.termination_date,
    data.employment_status,
    data.payment_frequency,
    data.bank_name,
    data.bank_account_number,
    data.photo_url,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// ===============================
// Get All Employees
// ===============================
export const getAllEmployees = async () => {
  const result = await pool.query(`
      SELECT
          e.*,

          d.name AS department_name,

          b.name AS branch_name,

          u.username AS system_user

      FROM employees e

      LEFT JOIN departments d
      ON e.department_id=d.id

      LEFT JOIN branches b
      ON e.branch_id=b.id

      LEFT JOIN users u
      ON e.user_id=u.id

      WHERE e.is_active=true

      ORDER BY e.id DESC
  `);

  return result.rows;
};

// ===============================
// Get Employee By ID
// ===============================
export const getEmployeeById = async (id) => {
  const result = await pool.query(
    `
    SELECT
        e.*,
        d.name AS department_name,
        b.name AS branch_name,
        u.username AS system_user

    FROM employees e

    LEFT JOIN departments d
    ON e.department_id=d.id

    LEFT JOIN branches b
    ON e.branch_id=b.id

    LEFT JOIN users u
    ON e.user_id=u.id

    WHERE e.id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ===============================
// Update Employee
// ===============================
export const updateEmployee = async (id, data) => {
  const query = `
    UPDATE employees

    SET

    employee_number=$1,
    user_id=$2,
    branch_id=$3,
    department_id=$4,
    first_name=$5,
    last_name=$6,
    gender=$7,
    date_of_birth=$8,
    national_id=$9,
    kra_pin=$10,
    nssf_number=$11,
    shif_number=$12,
    phone=$13,
    email=$14,
    address=$15,
    county=$16,
    job_title=$17,
    employment_type=$18,
    employment_date=$19,
    probation_end_date=$20,
    termination_date=$21,
    employment_status=$22,
    payment_frequency=$23,
    bank_name=$24,
    bank_account_number=$25,
    photo_url=$26,
    updated_at=CURRENT_TIMESTAMP

    WHERE id=$27

    RETURNING *;
  `;

  const values = [
    data.employee_number,
    data.user_id || null,
    data.branch_id || null,
    data.department_id || null,
    data.first_name,
    data.last_name,
    data.gender,
    data.date_of_birth || null,
    data.national_id,
    data.kra_pin,
    data.nssf_number,
    data.shif_number,
    data.phone,
    data.email,
    data.address,
    data.county,
    data.job_title,
    data.employment_type,
    data.employment_date,
    data.probation_end_date || null,
    data.termination_date || null,
    data.employment_status,
    data.payment_frequency,
    data.bank_name,
    data.bank_account_number,
    data.photo_url,
    id,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// ===============================
// Delete Employee
// ===============================
export const deleteEmployee = async (id) => {
  const result = await pool.query(
    `
    UPDATE employees

    SET
      is_active=false,
      updated_at=CURRENT_TIMESTAMP

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};