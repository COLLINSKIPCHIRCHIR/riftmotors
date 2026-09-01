import React,{useEffect,useState,useMemo} from "react";

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
const [searchTerm,setSearchTerm]=useState("");

const navigate=useNavigate();



useEffect(()=>{


const load=async()=>{


try{

const res =
await getServiceReceipts();


setReceipts(res.data);

}catch(err){

console.log(err);

}


};


load();


},[]);


const filteredReceipts = useMemo(()=>{

const term = searchTerm.trim().toLowerCase();

if(!term) return receipts;

return receipts.filter(receipt=>
(receipt.receipt_number || "").toLowerCase().includes(term) ||
(receipt.customer_name || "").toLowerCase().includes(term) ||
(receipt.payment_method || "").toLowerCase().includes(term)
);

},[receipts,searchTerm]);



return (

<div className="p-6 bg-gray-100 min-h-screen">


<div className="flex justify-between items-center mb-6 gap-4">

<h1 className="text-3xl font-bold">

Service Receipts

</h1>

<input
type="text"
placeholder="Search by receipt #, customer, or payment method..."
value={searchTerm}
onChange={(e)=>setSearchTerm(e.target.value)}
className="
border
rounded
px-3
py-2
w-72
bg-white
"
/>

</div>



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
filteredReceipts.map(receipt=>(


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

{

filteredReceipts.length===0 && (

<tr>
<td colSpan={5} className="p-6 text-center text-gray-500">
No receipts match your search.
</td>
</tr>

)

}



</tbody>


</table>



</div>



</div>


)


}



export default ServiceReceipts;