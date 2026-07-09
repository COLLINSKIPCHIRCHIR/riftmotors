import express from "express";


import {

payServiceInvoice,
getReceipts,
getReceipt

}
from "../controllers/serviceReceiptController.js";



const router = express.Router();





router.get(
"/",
getReceipts
);




router.get(
"/:id",
getReceipt
);





router.post(
"/:id/pay",
payServiceInvoice
);





export default router;