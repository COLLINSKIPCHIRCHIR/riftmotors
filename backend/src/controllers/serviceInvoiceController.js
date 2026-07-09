import {

convertServiceEstimateToInvoice,
getServiceInvoices,
getServiceInvoiceById

}
from "../models/serviceInvoiceModel.js";




export const convertEstimate = async(req,res)=>{


try{


const invoice =
await convertServiceEstimateToInvoice(
req.params.id
);



res.json({

message:"Service estimate converted",
invoice

});


}catch(err){

res.status(400).json({

error:err.message

});

}


}



export const getInvoices = async(req,res)=>{


const invoices =
await getServiceInvoices();


res.json(invoices);


}



export const getInvoice = async(req,res)=>{


const invoice =
await getServiceInvoiceById(
req.params.id
);


res.json(invoice);


}
