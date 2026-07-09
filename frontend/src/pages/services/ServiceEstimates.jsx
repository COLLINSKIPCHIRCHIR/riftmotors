import React,{useEffect,useState} from "react";
import {getServiceEstimates} from "../../api/serviceApi";
import {useNavigate} from "react-router-dom";
import {FaEye} from "react-icons/fa";


export default function ServiceEstimates(){


const [estimates,setEstimates]=useState([]);

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



return (

<div className="p-6">


<div className="
bg-white
rounded-xl
shadow
p-6
">


<h1 className="
text-2xl
font-bold
mb-6
">

Service Estimates

</h1>



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
estimates.map(est=>(


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



</tbody>



</table>


</div>


</div>


)

}