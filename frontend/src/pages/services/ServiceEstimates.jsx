import React,{useEffect,useState,useMemo} from "react";
import {getServiceEstimates} from "../../api/serviceApi";
import {useNavigate} from "react-router-dom";
import {FaEye} from "react-icons/fa";


export default function ServiceEstimates(){


const [estimates,setEstimates]=useState([]);
const [searchTerm,setSearchTerm]=useState("");

const navigate=useNavigate();



useEffect(()=>{


const load=async()=>{

try{

const res =
await getServiceEstimates();


setEstimates(res.data);


}catch(err){

console.log(err);

}


}


load();


},[]);


const filteredEstimates = useMemo(()=>{

const term = searchTerm.trim().toLowerCase();

if(!term) return estimates;

return estimates.filter(est=>
String(est.id).includes(term) ||
(est.customer_name || "").toLowerCase().includes(term) ||
(est.job_number || "").toLowerCase().includes(term) ||
(est.status || "").toLowerCase().includes(term)
);

},[estimates,searchTerm]);


return (

<div className="p-6">


<div className="
bg-white
rounded-xl
shadow
p-6
">


<div className="flex justify-between items-center mb-6 gap-4">

<h1 className="
text-2xl
font-bold
">

Service Estimates

</h1>

<input
type="text"
placeholder="Search by ID, customer, job #, or status..."
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



<table className="w-full border">


<thead className="bg-gray-100">

<tr>

<th className="p-3 border">
ID
</th>

<th className="p-3 border">
Customer
</th>


<th className="p-3 border text-left">
Vehicle
</th>


<th className="p-3 border text-left">
Total
</th>


<th className="p-3 border text-left">
Status
</th>


<th className="p-3 border text-left">
Action
</th>


</tr>

</thead>



<tbody>


{
filteredEstimates.map(est=>(


<tr key={est.id}>


<td className="border p-3">
{est.id}
</td>


<td className="border p-3">
{est.customer_name}
</td>


<td className="border p-3">
{est.job_number || "-"}
</td>


<td className="border p-3">
KES {Number(est.total).toFixed(2)}
</td>


<td className="border p-3 capitalize">
{est.status}
</td>



<td className="border p-3">


<button

onClick={()=>navigate(
`/admin/services/estimates/${est.id}`
)}

className="
text-blue-600
flex
items-center
gap-2
"


>

<FaEye/>

View

</button>


</td>



</tr>


))

}

{

filteredEstimates.length===0 && (

<tr>
<td colSpan={6} className="p-6 text-center text-gray-500 border">
No estimates match your search.
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