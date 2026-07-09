import express from "express";


import {

addService,
fetchServices,
fetchService,
editService,
removeService


} from "../controllers/serviceCatalogController.js";



const router = express.Router();



router.post(
"/",
addService
);



router.get(
"/",
fetchServices
);



router.get(
"/:id",
fetchService
);



router.put(
"/:id",
editService
);



router.delete(
"/:id",
removeService
);




export default router;
