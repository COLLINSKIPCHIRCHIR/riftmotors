import React, { useEffect, useState } from "react";
import {
  FaTools,
  FaCar,
  FaCheckCircle,
  FaClock
} from "react-icons/fa";

import {
  getServiceJobs,
  getCustomerVehicles
} from "../../api/serviceApi";


const ServiceDashboard = () => {

  const [jobs,setJobs] = useState([]);
  const [vehicles,setVehicles] = useState([]);


  useEffect(()=>{

    const loadData = async()=>{

      try{

        const jobsRes = await getServiceJobs();
        const vehiclesRes = await getCustomerVehicles();


        setJobs(jobsRes.data);
        setVehicles(vehiclesRes.data);


      }catch(error){

        console.log(error);

      }

    }


    loadData();

  },[]);



  const pending =
    jobs.filter(j=>j.status==="Pending").length;


  const completed =
    jobs.filter(j=>j.status==="Completed").length;



return (

<div>


<h1 className="text-2xl font-bold text-slate-800 mb-6">
Workshop Dashboard
</h1>



<div className="grid grid-cols-1 md:grid-cols-4 gap-5">


<div className="bg-white p-5 rounded-xl shadow border">

<div className="flex justify-between">

<div>

<p className="text-sm text-slate-500">
Total Jobs
</p>

<h2 className="text-3xl font-bold">
{jobs.length}
</h2>

</div>

<FaTools className="text-blue-500 text-3xl"/>

</div>

</div>




<div className="bg-white p-5 rounded-xl shadow border">

<p className="text-sm text-slate-500">
Pending Jobs
</p>

<h2 className="text-3xl font-bold">
{pending}
</h2>


<FaClock className="text-yellow-500 text-2xl mt-3"/>


</div>





<div className="bg-white p-5 rounded-xl shadow border">


<p className="text-sm text-slate-500">
Completed
</p>

<h2 className="text-3xl font-bold">
{completed}
</h2>


<FaCheckCircle className="text-green-500 text-2xl mt-3"/>


</div>





<div className="bg-white p-5 rounded-xl shadow border">


<p className="text-sm text-slate-500">
Customer Vehicles
</p>


<h2 className="text-3xl font-bold">
{vehicles.length}
</h2>


<FaCar className="text-purple-500 text-2xl mt-3"/>


</div>


</div>





<div className="mt-8 bg-white rounded-xl shadow border p-5">


<h2 className="font-bold mb-4">
Recent Jobs
</h2>


<table className="w-full text-sm">


<thead>

<tr className="border-b">

<th className="text-left py-3">
Job
</th>

<th>
Status
</th>

<th>
Date
</th>


</tr>

</thead>



<tbody>


{
jobs.slice(0,5).map(job=>(

<tr key={job.id} className="border-b">


<td className="py-3">

{job.job_number}

</td>


<td>

<span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600">

{job.status}

</span>

</td>


<td>
{new Date(job.created_at).toLocaleDateString()}
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


export default ServiceDashboard;