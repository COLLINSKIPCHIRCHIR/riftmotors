import { getStockHistory } from "../models/stockMovementModel.js";

export const fetchStockHistory = async (req, res) => {
  try {
    const { sparepartId } = req.params;
    const history = await getStockHistory(sparepartId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
