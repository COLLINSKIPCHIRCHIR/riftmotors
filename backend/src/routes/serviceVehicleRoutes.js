import express from "express";
import {
addVehicle,
getVehicles,
fetchVehicle
} from "../controllers/serviceVehicleController.js";


const router = express.Router();


router.post("/",addVehicle);

router.get("/", getVehicles);

router.get("/:id",fetchVehicle);


export default router;