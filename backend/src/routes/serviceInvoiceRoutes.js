import express from "express";

import {

convertEstimate,
getInvoices,
getInvoice

}

from "../controllers/serviceInvoiceController.js";


const router = express.Router();



router.get("/",getInvoices);


router.get("/:id",getInvoice);



router.post(
"/:id/convert-from-estimate",
convertEstimate
);



export default router;
