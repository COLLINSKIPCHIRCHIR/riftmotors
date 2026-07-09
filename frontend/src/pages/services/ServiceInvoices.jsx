import React,{useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";

import {
getServiceInvoices
}
from "../../api/serviceApi";


const ServiceInvoices =()=>{


const [invoices,setInvoices]=useState([]);

const navigate=useNavigate();



useEffect(()=>{


const load=async()=>{


try{


const res =
await getServiceInvoices();


setInvoices(res.data);



}catch(err){

console.log(err);

}


}



load();


},[]);





return (

<div className="p-6">


<div className="flex justify-between mb-6">


<h1 className="text-2xl font-bold">

Service Invoices

</h1>



</div>




<div className="bg-white rounded-xl shadow border">


<table className="w-full">


<thead className="bg-gray-100">

<tr>


<th className="p-3 text-left">
Invoice
</th>


<th className="p-3 text-left">
Customer
</th>


<th className="p-3 text-left">
Total
</th>


<th className="p-3 text-left">
Status
</th>


<th className="p-3 text-left">
Action
</th>


</tr>


</thead>




<tbody>


{

invoices.map(invoice=>(


<tr 
key={invoice.id}
className="border-t"
>


<td className="p-3">

{invoice.invoice_number}

</td>



<td>

{invoice.customer_name}

</td>




<td>

KES {invoice.total}

</td>




<td>


<span className="
px-3
py-1
rounded-full
bg-yellow-100
text-yellow-700
text-sm
">


{invoice.status}


</span>


</td>



<td>


<button

onClick={()=>navigate(
`/admin/services/invoices/${invoice.id}`
)}

className="
bg-blue-600
text-white
px-4
py-2
rounded
"


>

View

</button>


</td>



</tr>


))


}



</tbody>


</table>


</div>



</div>

)


}


export default ServiceInvoices;