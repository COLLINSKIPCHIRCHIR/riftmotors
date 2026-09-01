import React,{useEffect,useState,useMemo} from "react";
import {useNavigate} from "react-router-dom";

import {
getServiceCreditNotes
}
from "../../api/serviceApi";


const ServiceCreditNotes =()=>{

const [creditNotes,setCreditNotes]=useState([]);
const [searchTerm,setSearchTerm]=useState("");

const navigate=useNavigate();

useEffect(()=>{

const load=async()=>{

try{

const res =
await getServiceCreditNotes();

setCreditNotes(res.data);

}catch(err){

console.log(err);

}

}

load();

},[]);

const filteredCreditNotes = useMemo(()=>{

const term = searchTerm.trim().toLowerCase();

if(!term) return creditNotes;

return creditNotes.filter(cn=>
(cn.credit_note_number || "").toLowerCase().includes(term) ||
(cn.customer_name || "").toLowerCase().includes(term) ||
(cn.reason || "").toLowerCase().includes(term)
);

},[creditNotes,searchTerm]);


return (

<div className="p-6">


<div className="flex justify-between items-center mb-6 gap-4">


<h1 className="text-2xl font-bold">

Service Credit Notes

</h1>

<input
type="text"
placeholder="Search by credit note #, customer, or reason..."
value={searchTerm}
onChange={(e)=>setSearchTerm(e.target.value)}
className="
border
rounded
px-3
py-2
w-72
"
/>


</div>




<div className="bg-white rounded-xl shadow border">


<table className="w-full">


<thead className="bg-gray-100">

<tr>


<th className="p-3 text-left">
Credit Note
</th>


<th className="p-3 text-left">
Customer
</th>


<th className="p-3 text-left">
Amount
</th>


<th className="p-3 text-left">
Reason
</th>


<th className="p-3 text-left">
Action
</th>


</tr>


</thead>




<tbody>


{

filteredCreditNotes.map(creditNote=>(


<tr 
key={creditNote.id}
className="border-t"
>


<td className="p-3">

{creditNote.credit_note_number}

</td>



<td>

{creditNote.customer_name}

</td>




<td>

KES {creditNote.total}

</td>



<td className="max-w-xs truncate">

{creditNote.reason || "N/A"}

</td>




<td>


<button

onClick={()=>navigate(
`/admin/services/credit-notes/${creditNote.id}`
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

{

filteredCreditNotes.length===0 && (

<tr>
<td colSpan={5} className="p-6 text-center text-gray-500">
No credit notes match your search.
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


export default ServiceCreditNotes;