export const paginate = (query, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return {
    query: `${query} LIMIT $`,
    offset,
    limit: Number(limit),
  };
};

// Use this in any model that needs pagination
export const paginatedQuery = async (pool, baseQuery, values, page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  // Count total
  const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS subq`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);

  // Fetch page
  const dataResult = await pool.query(
    `${baseQuery} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limitNum, offset]
  );

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};