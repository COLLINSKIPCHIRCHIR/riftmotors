import React,{useEffect,useState} from "react";
import {useParams, useNavigate} from "react-router-dom";

import {
 getServiceJobs,
 getJobAssignments,
 getJobServices,
 getJobParts,
 getMechanics,
 assignMechanic,
 getServiceCatalog,
 addJobService,
 deleteJobService,
 getSpareParts,
 addJobPart,
 createServiceEstimate,


} from "../../api/serviceApi";


import CreateEstimateModal from "./CreateEstimateModal";

import {
 FaUserCog,
 FaCar,
 FaTools

} from "react-icons/fa";



const JobDetails =()=>{


const {id}=useParams();

const navigate = useNavigate();


const [job,setJob]=useState(null);

const [assignment,setAssignment]=useState([]);

const [services,setServices]=useState([]);

const [parts,setParts]=useState([]);

const [mechanics,setMechanics]=useState([]);

const [selectedMechanic,setSelectedMechanic]=useState("");

const [catalog,setCatalog]=useState([]);

const [selectedService,setSelectedService]=useState("");

const [serviceQuantity,setServiceQuantity]=useState(1);

const [error,setError]=useState("");

const [spareParts,setSpareParts]=useState([]);

const [selectedPart,setSelectedPart]=useState("");

const [partQuantity,setPartQuantity]=useState(1);

const [showEstimateModal,setShowEstimateModal]=useState(false);

useEffect(()=>{


const loadData=async()=>{


try{


const jobsRes =
await getServiceJobs();


const currentJob =
jobsRes.data.find(
j=>j.id===Number(id)
);


setJob(currentJob);




const assignmentRes =
await getJobAssignments(id);


setAssignment(
assignmentRes.data
);




const servicesRes =
await getJobServices(id);


setServices(
servicesRes.data
);


const partsCatalog =
await getSpareParts();


setSpareParts(
partsCatalog.data.data || partsCatalog.data
);





const partsRes =
await getJobParts(id);


setParts(
partsRes.data
);





const mechanicsRes =
await getMechanics();


setMechanics(
mechanicsRes.data
);

const catalogRes =
await getServiceCatalog();


setCatalog(
catalogRes.data
);



}catch(error){

console.log(error);

}


}


loadData();


},[id]);







const handleAssignMechanic = async()=>{


try{


await assignMechanic({

job_id:id,

mechanic_id:selectedMechanic

});



const res =
await getJobAssignments(id);



setAssignment(
res.data
);



setSelectedMechanic("");



}catch(err){

console.log(err);

setError(
err.response?.data?.message ||
"Failed assigning mechanic"
);

}


}








if(!job){


return (

<div className="p-6">

Loading job...

</div>

)

}







const serviceTotal =
services.reduce(

(total,item)=>

total +
Number(item.price || 0) *
Number(item.quantity || 1)

,0);




const partsTotal =
parts.reduce(

(total,item)=>
total + Number(item.total_price || 0)

,0);



const grandTotal =
serviceTotal + partsTotal;


const handleAddService = async()=>{


const exists =
services.find(
s=>s.service_id===Number(selectedService)
);


if(exists){

alert("Service already added");

return;

}


try{


const service =
catalog.find(
s=>s.id===Number(selectedService)
);


await addJobService({

job_id:id,

service_id:selectedService,

quantity:serviceQuantity,

price:service.price

});


const res =
await getJobServices(id);


setServices(res.data);



setSelectedService("");

setServiceQuantity(1);


}catch(err){

console.log(err);

}


}


const handleDeleteService=async(serviceId)=>{


try{


await deleteJobService(serviceId);


const res =
await getJobServices(id);


setServices(res.data);



}catch(err){

console.log(err);

}


}


const handleAddPart = async()=>{


try{


const part =
spareParts.find(
p=>p.id===Number(selectedPart)
);



await addJobPart({

job_id:id,

sparepart_id:selectedPart,

quantity:partQuantity,

unit_price:part.selling_price

});



const res =
await getJobParts(id);


setParts(res.data);


setSelectedPart("");

setPartQuantity(1);



}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed adding part"
);

}


}

const handleCreateEstimate = async(data)=>{


try{


const res =
await createServiceEstimate(data);



navigate(
`/admin/services/estimates/${res.data.estimate.id}`
);



}catch(err){


console.log(err.response?.data || err);


alert(
"Failed creating estimate"
);


}


}



return (


<div>





<div className="flex justify-between mb-6">


<div>

<h1 className="text-2xl font-bold">

Job {job.job_number}

</h1>


<p className="text-slate-500">

Created:

{
new Date(job.created_at)
.toLocaleDateString()

}

</p>


</div>



<span

className="
px-4
py-2
rounded-full
bg-blue-100
text-blue-600
"

>

{job.status}

</span>

<button

onClick={()=>setShowEstimateModal(true)}

className="
bg-green-600
text-white
px-4
py-2
rounded-lg
"

>

Generate Estimate

</button>



</div>









<div className="grid md:grid-cols-3 gap-5">







<div className="bg-white p-5 rounded-xl shadow border">


<div className="flex items-center gap-3 mb-3">


<FaCar className="text-blue-500"/>


<h2 className="font-bold">

Vehicle

</h2>


</div>



<p>

Vehicle:

<b>
{job.make} {job.model}
</b>

</p>



<p>

Registration:

<b>
{job.registration_number}

</b>

</p>



<p>

Customer:

<b>
{job.customer_name}

</b>

</p>

</div>









<div className="bg-white p-5 rounded-xl shadow border">


<div className="flex items-center gap-3 mb-3">


<FaUserCog className="text-green-500"/>


<h2 className="font-bold">

Assigned Mechanic

</h2>


</div>





{


assignment.length > 0 ?



assignment.map(a=>(


<div key={a.id}>


<p className="font-semibold">

{a.name}

</p>


<p className="text-sm text-slate-500">

{a.phone}

</p>


</div>


))



:


<p>

Not Assigned

</p>



}







<div className="mt-4">


<select

value={selectedMechanic}

onChange={(e)=>
setSelectedMechanic(e.target.value)
}


className="
border
rounded-lg
p-2
w-full
"


>


<option value="">

Select Mechanic

</option>




{

mechanics.map(mechanic=>(


<option

key={mechanic.id}

value={mechanic.id}

>


{mechanic.name}

-

{mechanic.specialization}


</option>



))

}



</select>





<button


onClick={handleAssignMechanic}


disabled={!selectedMechanic}


className="
mt-3
bg-blue-600
text-white
px-4
py-2
rounded-lg
"


>


Assign Mechanic


</button>

{
error &&
<p className="text-red-500 mt-2 text-sm">
{error}
</p>
}



</div>





</div>









<div className="bg-white p-5 rounded-xl shadow border">


<div className="flex items-center gap-3 mb-3">


<FaTools className="text-orange-500"/>


<h2 className="font-bold">

Complaint

</h2>


</div>



<p>

{job.complaint || "No complaint"}

</p>



</div>





</div>








<div className="grid md:grid-cols-2 gap-5 mt-6">



{/* SERVICES */}

<div className="bg-white rounded-xl shadow border p-5">


<h2 className="font-bold text-lg mb-4">

Services

</h2>



<div className="grid md:grid-cols-2 gap-3">


<select

value={selectedService}

onChange={(e)=>
setSelectedService(e.target.value)
}


className="
border
rounded-lg
p-2
"

>


<option value="">

Select Service

</option>


{

catalog.map(service=>(


<option

key={service.id}

value={service.id}

>


{service.name}
-
KES {service.price}


</option>


))

}


</select>




<input

type="number"

min="1"

value={serviceQuantity}

onChange={(e)=>
setServiceQuantity(e.target.value)
}


className="
border
rounded-lg
p-2
"

placeholder="Quantity"

/>



</div>





<button

onClick={handleAddService}

disabled={!selectedService}


className="
mt-3
bg-blue-600
text-white
px-4
py-2
rounded-lg

"


>

Add Service

</button>





<hr className="my-5"/>





{

services.length===0 ?


<p>

No services added

</p>



:


services.map(service=>(


<div

key={service.id}

className="
border
rounded-xl
p-4
mb-3
flex
justify-between
items-center
bg-slate-50
"


>


<div>


<h3 className="font-semibold text-lg">

{service.service_name}

</h3>


<p className="text-sm text-gray-500">

Quantity:
{service.quantity}

</p>


<p className="text-sm text-gray-500">

Unit:
KES {service.price}

</p>


</div>



<div className="text-right">


<p className="font-bold text-blue-600">

KES {

Number(service.price)
*
Number(service.quantity)

}

</p>



<button

onClick={()=>handleDeleteService(service.id)}

className="
text-red-500
text-sm
mt-2
"

>

Remove

</button>


</div>



</div>


))

}




</div>






{/* SPARE PARTS */}



<div className="bg-white rounded-xl shadow border p-5">


<h2 className="font-bold mb-4">

Spare Parts

</h2>


<div className="grid md:grid-cols-2 gap-3">


<select

value={selectedPart}

onChange={(e)=>
setSelectedPart(e.target.value)
}

className="border rounded-lg p-2"

>


<option value="">

Select Part

</option>


{

spareParts.map(part=>(


<option

key={part.id}

value={part.id}

>


{part.name}

-

KES {part.selling_price}

(stock {part.quantity})


</option>


))

}


</select>



<input

type="number"

min="1"

value={partQuantity}

onChange={(e)=>
setPartQuantity(e.target.value)
}

className="border rounded-lg p-2"

/>


</div>



<button

onClick={handleAddPart}

disabled={!selectedPart}

className="
mt-3
bg-green-600
text-white
px-4
py-2
rounded-lg
"

>

Add Part

</button>




<hr className="my-5"/>



{

parts.map(part=>(


<div

key={part.id}

className="
border rounded-xl p-4 mb-3
flex justify-between
"


>


<div>

<p className="font-semibold">

{part.name}

</p>


<p className="text-sm text-gray-500">

Qty: {part.quantity}

</p>

{
part.quantity > part.available_stock &&

<p className="text-red-500 text-sm">

Shortage:
{part.quantity - part.available_stock}

items

</p>

}


</div>


<div>


<p className="font-bold">

KES {part.total_price}

</p>


</div>



</div>


))


}



</div>






</div>









<div className="mt-6 bg-slate-900 text-white rounded-xl p-6">


<h2 className="text-xl font-bold">

Job Total

</h2>



<p className="text-3xl font-bold mt-2">

KES {grandTotal}

</p>


</div>

{
showEstimateModal &&

<CreateEstimateModal

jobId={id}


onSubmit={handleCreateEstimate}


onClose={()=>
setShowEstimateModal(false)
}

/>

}



</div>


)



}



export default JobDetails;