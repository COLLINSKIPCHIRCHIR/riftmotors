// utils/dbDebug.js
export const queryWithDiagnostics = async (client, label, text, params) => {
  try {
    return await client.query(text, params);
  } catch (err) {
    console.error(`DB ERROR in [${label}]`, {
      code: err.code,
      message: err.message,
      query: text.replace(/\s+/g, " ").trim(),
      params,
    });
    throw err;
  }
};