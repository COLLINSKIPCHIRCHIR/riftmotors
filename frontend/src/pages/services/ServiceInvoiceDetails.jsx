import React,{useEffect,useState} from "react";

import {
useParams,
useNavigate
}
from "react-router-dom";


import {
getServiceInvoice,
payServiceInvoice
}
from "../../api/serviceApi";



const ServiceInvoiceDetails=()=>{


const {id}=useParams();

const navigate = useNavigate();


const [invoice,setInvoice]=useState(null);

const [paymentMethod,setPaymentMethod]=useState("");



useEffect(()=>{


const load=async()=>{


const res =
await getServiceInvoice(id);


setInvoice(res.data);


}



load();


},[id]);





if(!invoice)

return <div className="p-6">
Loading invoice...
</div>


const handlePay = async()=>{

if(!paymentMethod){

alert("Select payment method");

return;

}


const res =
await payServiceInvoice(
invoice.id,
paymentMethod
);


navigate(
`/admin/services/receipts/${res.data.receipt.id}`
);


}


return (

<div className="p-6 bg-gray-100 min-h-screen print-container">


<div className="
max-w-5xl
mx-auto
bg-white
rounded-xl
shadow-lg
p-10
print-document
">


{/* HEADER */}

<div className="
flex
justify-between
items-start
border-b
pb-6
">


<div className="flex flex-col">


<img
src="/rmotologo.jpg"
className="w-44 h-32 object-contain mb-3"
/>


<div className="text-sm text-gray-600 leading-6">


<p>
Address: Rift Motors, Nakuru, Kenya
</p>


<p>
Phone: +254 712 345 678
</p>


<p>
Email: info@riftmotors.com
</p>


</div>


</div>





<div className="text-right">


<h2 className="
text-3xl
font-bold
text-blue-700
">

SERVICE INVOICE

</h2>


<p className="mt-3">

Invoice No:

<b>
{invoice.invoice_number}
</b>

</p>


<p>

Date:

{new Date(
invoice.created_at
).toLocaleDateString()}

</p>


</div>



</div>





{/* CUSTOMER */}


<div className="
mt-8
grid
grid-cols-2
">


<div>


<h3 className="font-bold">
Bill To
</h3>


<p>
{invoice.customer_name}
</p>


<p>
{invoice.customer_phone}
</p>


</div>


<div className="text-right">


<h3 className="font-bold">

Status

</h3>


<span className="
bg-yellow-100
text-yellow-700
px-3
py-1
rounded-full
">


{invoice.status}


</span>


</div>


</div>


<select

value={paymentMethod}

onChange={(e)=>
setPaymentMethod(e.target.value)
}

className="border p-2 rounded"

>

<option value="">
Select payment
</option>


<option value="cash">
Cash
</option>


<option value="mpesa">
M-Pesa
</option>


<option value="card">
Card
</option>


<option value="bank">
Bank Transfer
</option>


</select>


{/* BUTTONS */}


<div className="
flex
justify-end
gap-3
my-6
print:hidden
">


{
invoice.status==="unpaid" && (

<button

onClick={handlePay}

className="
bg-green-600
text-white
px-5
py-2
rounded-lg
">

Convert To Receipt

</button>
)
}


<button

onClick={()=>window.print()}

className="
bg-gray-800
text-white
px-5
py-2
rounded-lg
">

Print

</button>


</div>






<table className="w-full border">


<thead className="bg-gray-100">


<tr>


<th className="p-3 text-left">
Description
</th>


<th className="p-3 text-left">
Type
</th>


<th className="p-3 text-left">
Qty
</th>


<th className="p-3 text-left">
Price
</th>


<th className="p-3 text-left">
Total
</th>


</tr>


</thead>


<tbody>


{
invoice.items?.map(item=>(


<tr 
key={item.id}
className="border-t"
>


<td className="p-3">
{item.description}
</td>


<td>
{item.item_type}
</td>


<td>
{item.quantity}
</td>


<td>
KES {item.unit_price}
</td>


<td className="p-3">

<div>
Original:
KES {item.original_price}
</div>


{
item.item_type==="service" &&
item.adjustment > 0 &&

<div className="text-sm text-green-600">

Reduction:
KES {item.adjustment}

</div>

}



{
item.item_type==="sparepart" &&
item.discount_value > 0 &&

<div className="text-sm text-green-600">


Discount:

{
item.discount_type==="percentage"

?

`${item.discount_value}%`

:

`KES ${item.discount_value}`

}


</div>

}



<div className="font-bold">

Final:

KES {item.total_price}

</div>


</td>


</tr>


))

}


</tbody>


</table>





<div className="
flex
justify-end
mt-8
">


<div className="w-64">


<div className="flex justify-between">

<span>
Subtotal
</span>


<b>
KES {invoice.subtotal}
</b>


</div>



<div>

{/*<div className="flex justify-between">

<span>
Discount
</span>

<b>
{
invoice.discount_type==="percentage"
?
`${invoice.discount_value}%`
:
`KES ${invoice.discount_value}`
}
</b>

</div>*/}




{/*<div className="flex justify-between">

<span>
Discount Amount
</span>


<b>
KES {invoice.discount}
</b>


</div>*/}


</div>

<div className="flex justify-between">

<span>
Tax ({invoice.tax_rate}%)
</span>


<b> 
KES {invoice.tax_amount}
</b>


</div>



<hr className="my-3"/>



<div className="
flex
justify-between
text-xl
">


<span>
TOTAL
</span>


<b>
KES {invoice.total}
</b>


</div>


</div>


</div>






<div className="
mt-10
border-t
pt-4
text-center
text-sm
text-gray-500
">


Thank you for choosing Rift Motors.


</div>



</div>


</div>


)


}



export default ServiceInvoiceDetails;