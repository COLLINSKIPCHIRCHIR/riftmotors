export const errorHandler = (err, req, res, next) => {
  console.error(`❌ [${req.method}] ${req.path} —`, err.message);

  // Postgres unique violation
  if (err.code === "23505") {
    return res.status(409).json({ 
      message: "Duplicate entry", 
      detail: err.detail 
    });
  }

  // Postgres foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({ 
      message: "Referenced record not found", 
      detail: err.detail 
    });
  }

  // Postgres not null violation
  if (err.code === "23502") {
    return res.status(400).json({ 
      message: `Missing required field: ${err.column}` 
    });
  }

  const status = err.status || 500;
  res.status(status).json({ 
    message: err.message || "Internal server error" 
  });
};