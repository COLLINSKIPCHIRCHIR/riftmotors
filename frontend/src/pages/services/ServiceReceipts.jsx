import React,{useEffect,useState} from "react";

import {
getServiceReceipts
}
from "../../api/serviceApi";


import {
useNavigate
}
from "react-router-dom";



const ServiceReceipts=()=>{


const [receipts,setReceipts]=useState([]);

const navigate=useNavigate();



useEffect(()=>{


const load=async()=>{


const res =
await getServiceReceipts();


setReceipts(res.data);


};


load();


},[]);





return (

<div className="p-6 bg-gray-100 min-h-screen">


<h1 className="text-3xl font-bold mb-6">

Service Receipts

</h1>



<div className="bg-white rounded-xl shadow p-6">


<table className="w-full">


<thead className="bg-gray-100">

<tr>


<th className="p-3 text-left">
Receipt
</th>


<th className="p-3 text-left">
Customer
</th>


<th className="p-3 text-left">
Total
</th>


<th className="p-3 text-left">
Payment
</th>


<th className="p-3 text-left">
Action
</th>


</tr>


</thead>



<tbody>


{
receipts.map(receipt=>(


<tr
key={receipt.id}
className="border-t"
>


<td className="p-3">

{receipt.receipt_number}

</td>


<td>

{receipt.customer_name}

</td>


<td>

KES {receipt.total}

</td>


<td>

{receipt.payment_method}

</td>



<td>


<button

onClick={()=>navigate(
`/admin/services/receipts/${receipt.id}`
)}

className="
bg-blue-600
text-white
px-3
py-1
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



export default ServiceReceipts;