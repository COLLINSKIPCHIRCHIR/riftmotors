import {
  getSalesSummary,
  getSalesByDay,
  getTopSellingParts,
  getLowStockAlert,
  getDashboardStats,
   getBusinessInvoiceReport  
} from "../models/reportModel.js";

export const fetchDashboardStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const fetchSalesSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ 
        message: "from and to date params required" 
      });
    }

    const summary = await getSalesSummary(from, to);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const fetchSalesByDay = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ 
        message: "from and to date params required" 
      });
    }

    const data = await getSalesByDay(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const fetchTopSellingParts = async (req, res, next) => {
  try {
    const { from, to, limit } = req.query;

    if (!from || !to) {
      return res.status(400).json({ 
        message: "from and to date params required" 
      });
    }

    const parts = await getTopSellingParts(from, to, limit || 10);
    res.json(parts);
  } catch (err) {
    next(err);
  }
};

export const fetchLowStockAlert = async (req, res, next) => {
  try {
    const parts = await getLowStockAlert();
    res.json(parts);
  } catch (err) {
    next(err);
  }
};



const resolveDateRange = ({ preset, from, to }) => {
  if (from && to) return { from, to };

  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start;

  switch (preset) {
    case "today":
      start = end;
      break;
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().slice(0, 10);
      break;
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().slice(0, 10);
      break;
    }
    case "year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().slice(0, 10);
      break;
    }
    default: {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().slice(0, 10);
    }
  }

  return { from: start, to: end };
};

export const fetchBusinessInvoiceReport = async (req, res, next) => {
  try {
    const { preset, from, to, type } = req.query;
    const range = resolveDateRange({ preset, from, to });

    const data = await getBusinessInvoiceReport(range.from, range.to, type || "both");

    res.json({
      from: range.from,
      to: range.to,
      type: type || "both",
      ...data,
    });
  } catch (err) {
    next(err);
  }
};