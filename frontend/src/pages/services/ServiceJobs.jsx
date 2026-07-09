import React,{useEffect,useState} from "react";
import {
getServiceJobs,
getCustomerVehicles,
createServiceJob
} from "../../api/serviceApi";

import {Link} from "react-router-dom";



const ServiceJobs=()=>{


const [jobs,setJobs]=useState([]);

const [vehicles,setVehicles]=useState([]);


const [showModal,setShowModal]=useState(false);



const [form,setForm]=useState({

vehicle_id:"",
complaint:"",
notes:""

});





useEffect(()=>{

loadJobs();
loadVehicles();

},[])




const loadJobs=async()=>{

try{

const res=await getServiceJobs();

setJobs(res.data);


}catch(err){

console.log(err);

}

}




const loadVehicles=async()=>{

try{

const res=await getCustomerVehicles();

setVehicles(res.data);


}catch(err){

console.log(err);

}

}





const handleChange=(e)=>{


setForm({

...form,

[e.target.name]:e.target.value

})


}





const submitJob=async()=>{


try{


const data={


job_number:
"JOB-"+Date.now(),


customer_id:
vehicles.find(v=>v.id==form.vehicle_id)?.customer_id,


vehicle_id:
form.vehicle_id,


complaint:
form.complaint,


notes:
form.notes,


status:"Pending",


created_by:
1


};



await createServiceJob(data);



setShowModal(false);



setForm({

vehicle_id:"",
complaint:"",
notes:""

});



loadJobs();



}catch(err){

console.log(err);

}



}





return (


<div>



<div className="flex justify-between mb-6">


<h1 className="text-2xl font-bold text-slate-800">

Service Jobs

</h1>



<button

onClick={()=>setShowModal(true)}

className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
hover:bg-blue-700
"

>

+ New Job

</button>



</div>







<div className="
bg-white
rounded-xl
shadow
border
overflow-hidden
">



<table className="w-full text-sm">


<thead className="bg-slate-50 border-b">


<tr>


<th className="p-4 text-left">
Job Number
</th>


<th>
Vehicle
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
jobs.map(job=>(


<tr
key={job.id}
className="border-b hover:bg-slate-50"
>


<td className="p-4 font-medium">

{job.job_number}

</td>




<td>


{job.make}
{" "}
{job.model}


</td>





<td>


<span
className="
px-3
py-1
rounded-full
text-xs
bg-yellow-100
text-yellow-700
"
>


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

className="
text-blue-600
font-medium
"

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








{/* CREATE JOB MODAL */}


{
showModal && (


<div
className="
fixed inset-0
bg-black/40
flex
items-center
justify-center
z-50
"
>


<div
className="
bg-white
w-full
max-w-lg
rounded-xl
p-6
shadow-xl
"
>


<h2 className="text-xl font-bold mb-5">

Create Service Job

</h2>






<label className="text-sm">

Customer Vehicle

</label>



<select

name="vehicle_id"

value={form.vehicle_id}

onChange={handleChange}

className="
w-full
border
rounded-lg
p-2
mb-4
"

>


<option value="">

Select Vehicle

</option>



{
vehicles.map(v=>(


<option
key={v.id}
value={v.id}
>


{v.registration_number}
-
{v.make}
{" "}
{v.model}


</option>


))

}


</select>








<label className="text-sm">

Customer Complaint

</label>



<textarea

name="complaint"

value={form.complaint}

onChange={handleChange}

className="
w-full
border
rounded-lg
p-2
mb-4
"

placeholder="Customer complaint"

 />







<label className="text-sm">

Notes

</label>



<textarea

name="notes"

value={form.notes}

onChange={handleChange}

className="
w-full
border
rounded-lg
p-2
mb-4
"

/>







<div className="flex justify-end gap-3">


<button

onClick={()=>setShowModal(false)}

className="
px-4
py-2
border
rounded-lg
"

>

Cancel

</button>




<button

onClick={submitJob}

className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
"

>

Create Job

</button>


</div>




</div>


</div>


)

}





</div>


)


}



export default ServiceJobs;