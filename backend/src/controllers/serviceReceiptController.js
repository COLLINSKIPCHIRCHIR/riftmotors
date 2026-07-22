import {

convertServiceInvoiceToReceipt,
getServiceReceipts,
getServiceReceiptById

}
from "../models/serviceReceipt.js";





export const payServiceInvoice = async (req, res) => {

  try {

    const { payment_method, amount_paid } = req.body;

    if (!payment_method) {
      return res.status(400).json({ message: "Payment method required" });
    }

    if (!amount_paid || Number(amount_paid) <= 0) {
      return res.status(400).json({ message: "amount_paid must be greater than zero" });
    }

    const receipt = await convertServiceInvoiceToReceipt(
      req.params.id,
      payment_method,
      amount_paid
    );

    res.json({
      message: "Payment recorded successfully",
      receipt
    });

  } catch (err) {

    res.status(400).json({ error: err.message });

  }

};







export const getReceipts = async(req,res)=>{


try{


const receipts =
await getServiceReceipts();


res.json(receipts);



}catch(err){


res.status(500).json({

error:err.message

});


}


};







export const getReceipt = async(req,res)=>{


try{


const receipt =
await getServiceReceiptById(req.params.id);



if(!receipt){

return res.status(404).json({

message:"Receipt not found"

});

}



res.json(receipt);



}catch(err){


res.status(500).json({

error:err.message

});


}


};