import { getCustomerStatement} from "../models/statementModel.js";
import { getCustomerById } from "../models/customerModel.js";
import { getCustomerOverview } from "../models/customer360Model.js";



export const getStatement = async (req, res) => {
  try {
    const { id } = req.params; // customer id
    const { from, to, type = "both" } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to dates are required" });
    }

    const customer = await getCustomerById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const statement = await getCustomerStatement(id, from, to, type);
    res.json({ customer, from, to, ...statement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


export const getCustomer360 = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await getCustomerById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const overview = await getCustomerOverview(id);
    res.json({ customer, ...overview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


