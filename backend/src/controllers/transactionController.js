// src/controllers/transactionController.js
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
} from "../models/transactionModel.js";

export const newTransaction = async (req, res) => {
  try {
    const trx = await createTransaction(req.body);
    res.status(201).json(trx);
  } catch (error) {
    next(error);
  }
};

export const fetchTransactions = async (req, res) => {
  try {
    const list = await getAllTransactions();
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const fetchTransaction = async (req, res) => {
  try {
    const trx = await getTransactionById(req.params.id);
    res.json(trx);
  } catch (error) {
    next(error);
  }
};
