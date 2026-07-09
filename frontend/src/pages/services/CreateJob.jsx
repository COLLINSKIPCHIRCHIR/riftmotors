import React,{useEffect,useState} from "react";
import {useSearchParams,useNavigate} from "react-router-dom";

import {
getVehicleDetails,
createServiceJob
} from "../../api/serviceApi";


const CreateJob=()=>{


const [searchParams]=useSearchParams();

const navigate=useNavigate();


const vehicleId =
searchParams.get("vehicle");



const [vehicle,setVehicle]=useState(null);



const [form,setForm]=useState({

complaint:""

});





useEffect(()=>{


loadVehicle();


},[])





const loadVehicle=async()=>{


try{


const res =
await getVehicleDetails(vehicleId);


setVehicle(res.data);



}catch(err){

console.log(err)

}


}







const handleChange=(e)=>{


setForm({

...form,

[e.target.name]:e.target.value

})


}








const saveJob=async()=>{


try{


const data={

vehicle_id:vehicle.id,

customer_id:vehicle.customer_id,

complaint:form.complaint,

notes:"",

created_by:1

};



const res =
await createServiceJob(data);




navigate(
`/admin/services/jobs/${res.data.id}`
);



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








return (

<div>



<h1 className="text-2xl font-bold mb-6">

Create Service Job

</h1>






<div className="bg-white rounded-xl shadow border p-6 max-w-xl">





<h2 className="font-bold mb-4">

Vehicle

</h2>




<p>

{vehicle.make} {vehicle.model}

</p>


<p className="text-slate-500">

{vehicle.registration_number}

</p>






<div className="mt-6">


<label className="block mb-2 font-semibold">

Customer Complaint

</label>



<textarea

name="complaint"

value={form.complaint}

onChange={handleChange}

placeholder="Describe customer complaint..."

className="
border
w-full
p-3
rounded-lg
"

rows="5"

/>



</div>







<button


onClick={saveJob}


className="
mt-6
bg-blue-600
text-white
px-5
py-3
rounded-lg
"


>


Create Job


</button>







</div>




</div>

)


}



export default CreateJob;