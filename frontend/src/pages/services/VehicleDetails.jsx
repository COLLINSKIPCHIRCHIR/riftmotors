import React,{useEffect,useState} from "react";

import {useParams,Link} from "react-router-dom";

import {
getVehicleDetails,
getServiceJobs
} from "../../api/serviceApi";


import {
FaCar,
FaUser,
FaTools,
FaPlus
} from "react-icons/fa";




const VehicleDetails=()=>{


const {id}=useParams();



const [vehicle,setVehicle]=useState(null);

const [jobs,setJobs]=useState([]);




useEffect(()=>{


loadVehicle();

loadJobs();


},[id]);





const loadVehicle=async()=>{


try{


const res =
await getVehicleDetails(id);


setVehicle(res.data);



}catch(err){

console.log(err)

}


}






const loadJobs=async()=>{


try{


const res =
await getServiceJobs();



const vehicleJobs =
res.data.filter(
job=>job.vehicle_id===Number(id)
);



setJobs(vehicleJobs);



}catch(err){

console.log(err)

}


}








if(!vehicle){

return (

<div className="p-6">

Loading vehicle...

</div>

)

}






const completed =
jobs.filter(
job=>job.status==="Completed"
).length;





return (


<div>




<div className="flex justify-between mb-6">



<div>


<h1 className="text-2xl font-bold">

{vehicle.make} {vehicle.model}

</h1>


<p className="text-slate-500">

{vehicle.registration_number}

</p>


</div>





<Link


to={`/admin/services/jobs/create?vehicle=${vehicle.id}`}


className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
flex
items-center
gap-2
"


>


<FaPlus/>

Create Job


</Link>




</div>









<div className="grid md:grid-cols-3 gap-5">





<div className="
bg-white
border
shadow
rounded-xl
p-5
">


<div className="flex gap-3 items-center mb-4">


<FaCar className="text-blue-600"/>


<h2 className="font-bold">

Vehicle

</h2>


</div>




<p>

Make:

<b>
 {vehicle.make}
</b>

</p>



<p>

Model:

<b>
 {vehicle.model}
</b>

</p>




<p>

Year:

<b>
 {vehicle.year}
</b>

</p>




<p>

Mileage:

<b>
 {vehicle.mileage} KM
</b>

</p>




<p>

Fuel:

<b>
 {vehicle.fuel_type}
</b>

</p>



<p>

Transmission:

<b>
 {vehicle.transmission}
</b>

</p>



</div>









<div className="
bg-white
border
shadow
rounded-xl
p-5
">


<div className="flex gap-3 items-center mb-4">


<FaUser className="text-green-600"/>


<h2 className="font-bold">

Owner

</h2>


</div>





<p>

Name:

<b>

{vehicle.name}

</b>

</p>



<p>

Phone:

<b>

{vehicle.phone}

</b>

</p>



</div>









<div className="
bg-white
border
shadow
rounded-xl
p-5
">


<div className="flex gap-3 items-center mb-4">


<FaTools className="text-orange-600"/>


<h2 className="font-bold">

Service Summary

</h2>


</div>




<p>

Total Jobs:

<b>

{jobs.length}

</b>


</p>



<p>

Completed:

<b>

{completed}

</b>


</p>




</div>




</div>









<div className="
mt-8
bg-white
border
shadow
rounded-xl
p-5
">



<h2 className="font-bold text-xl mb-5">

Service History

</h2>






<table className="w-full">



<thead>


<tr className="border-b">


<th className="text-left p-3">

Job Number

</th>



<th>

Status

</th>



<th>

Date

</th>



<th>

Action

</th>



</tr>


</thead>





<tbody>



{

jobs.length===0 ?


<tr>


<td

colSpan="4"

className="p-5 text-center"

>

No service history

</td>


</tr>


:

jobs.map(job=>(



<tr

key={job.id}

className="border-b"


>



<td className="p-3">


{job.job_number}


</td>




<td>


<span className="
px-3
py-1
rounded-full
bg-blue-100
text-blue-600
">


{job.status}


</span>


</td>





<td>


{
new Date(job.created_at)
.toLocaleDateString()

}


</td>




<td>


<Link


to={`/admin/services/jobs/${job.id}`}


className="text-blue-600"


>


View


</Link>


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



export default VehicleDetails;