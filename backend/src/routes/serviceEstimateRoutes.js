import express from "express";


import {

createEstimate,
fetchEstimates,
fetchEstimate,
updateEstimateItem

} from "../controllers/serviceEstimateController.js";



const router = express.Router();





// create from job

router.post(
"/create",
createEstimate
);




// all estimates

router.get(
"/",
fetchEstimates
);




// single estimate

router.get(
"/:id",
fetchEstimate
);

router.put(
"/item/:id",
updateEstimateItem
);



export default router;