import {
  getSalesSummary,
  getSalesByDay,
  getTopSellingParts,
  getLowStockAlert,
  getDashboardStats
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