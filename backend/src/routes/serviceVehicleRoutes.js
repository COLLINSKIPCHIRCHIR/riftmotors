import express from "express";
import {
addVehicle,
getVehicles,
fetchVehicle,
editVehicle
} from "../controllers/serviceVehicleController.js";


const router = express.Router();


router.post("/",addVehicle);

router.get("/", getVehicles);

router.get("/:id",fetchVehicle);

router.put("/:id",editVehicle);


export default router;