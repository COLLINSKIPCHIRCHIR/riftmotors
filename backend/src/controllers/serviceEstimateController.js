import pool from "../config/db.js";
import {

createServiceEstimate,
getServiceEstimates,
getServiceEstimateById,
recalculateEstimateTotals

} from "../models/serviceEstimate.js";





// CREATE

export const createEstimate = async(req,res)=>{


try{


const estimate =
await createServiceEstimate(req.body);


res.json({
estimate
});


}catch(err){

console.error("CREATE ESTIMATE ERROR:", err);

res.status(500).json({
error:err.message
});


}


}






// GET ALL


export const fetchEstimates = async(req,res)=>{


try{


const estimates =
await getServiceEstimates();


res.json(estimates);



}catch(error){


res.status(500).json({

message:error.message

});


}


};







// GET ONE


export const fetchEstimate = async(req,res)=>{


try{


const estimate =
await getServiceEstimateById(
req.params.id
);



if(!estimate){

return res.status(404).json({

message:"Estimate not found"

});

}



res.json(estimate);



}catch(error){


res.status(500).json({

message:error.message

});


}


};


export const updateEstimateItem = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { adjustment, discount_type, discount_value } = req.body;

    const itemResult = await client.query(
      `SELECT * FROM service_estimate_items WHERE id=$1`,
      [id]
    );
    if (itemResult.rows.length === 0) throw new Error("Item not found");
    const data = itemResult.rows[0];

    const statusResult = await client.query(
      `SELECT status FROM service_estimates WHERE id=$1`,
      [data.estimate_id]
    );
    if (statusResult.rows[0].status !== "pending") {
      throw new Error("Converted estimates cannot be edited");
    }

    if (data.customer_supplied) {
      throw new Error("Customer-supplied parts cannot be discounted");
    }

    const original = Number(data.original_price);
    let clamped = false;

    if (data.item_type === "service") {
      const qty = Number(data.quantity) || 1;
      const requested = Number(adjustment || 0);

      // min/max are per unit, original_price is unit price x qty
      let unitFinal = (original - requested) / qty;
      const min = Number(data.min_price || 0);
      const max = Number(data.max_price || 0);

      if (unitFinal < min) unitFinal = min;
      if (max > 0 && unitFinal > max) unitFinal = max;

      const finalPrice = unitFinal * qty;
      const applied = original - finalPrice;
      clamped = Math.abs(applied - requested) > 0.005;

      await client.query(
        `UPDATE service_estimate_items
         SET adjustment=$1, total_price=$2
         WHERE id=$3`,
        [applied, finalPrice, id]
      );
    }

    if (data.item_type === "sparepart") {
      const type = discount_type || "amount";
      const value = Number(discount_value || 0);

      let finalPrice =
        type === "percentage"
          ? original * (1 - value / 100)
          : original - value;
      if (finalPrice < 0) finalPrice = 0;

      await client.query(
        `UPDATE service_estimate_items
         SET discount_type=$1, discount_value=$2, total_price=$3
         WHERE id=$4`,
        [type, value, finalPrice, id]
      );
    }

    await recalculateEstimateTotals(client, data.estimate_id);
    await client.query("COMMIT");

    res.json({ message: "Estimate updated", clamped });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};