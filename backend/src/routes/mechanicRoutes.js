import express from "express";


import {

addMechanic,
fetchMechanics,
fetchMechanic,
editMechanic,
removeMechanic

} from "../controllers/mechanicController.js";



const router = express.Router();



router.post(
"/",
addMechanic
);



router.get(
"/",
fetchMechanics
);



router.get(
"/:id",
fetchMechanic
);



router.put(
"/:id",
editMechanic
);



router.delete(
"/:id",
removeMechanic
);



export default router;