import axios from "axios";


export const sendInvoiceToKRA = async(invoice)=>{


const payload = {


invoiceNumber:
invoice.invoice_number,


customerName:
invoice.customer_name,


customerPhone:
invoice.customer_phone,


items:
invoice.items,


subtotal:
invoice.subtotal,


tax:
invoice.tax_amount,


total:
invoice.total


};



const response =
await axios.post(

process.env.KRA_ETIMS_URL,

payload,

{

headers:{

Authorization:
`Bearer ${process.env.KRA_TOKEN}`

}

}

);


return response.data;


}