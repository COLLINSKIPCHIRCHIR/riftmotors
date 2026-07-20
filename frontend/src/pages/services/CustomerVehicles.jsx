import React,{useEffect,useState} from "react";

import {
getCustomerVehicles,
createCustomerVehicle
} from "../../api/serviceApi";

import {getCustomers} from "../../api/CustomerApi";

import {
FaCar,
FaEye,
FaTools
} from "react-icons/fa";

import {Link} from "react-router-dom";



const CustomerVehicles=()=>{


const [vehicles,setVehicles]=useState([]);

const [customers,setCustomers]=useState([]);

const [showModal,setShowModal]=useState(false);



const [search,setSearch]=useState("");

const [fuel,setFuel]=useState("");

const [transmission,setTransmission]=useState("");



const [form,setForm]=useState({

customer_id:"",
registration_number:"",
make:"",
model:"",
year:"",
mileage:"",
color:"",
fuel_type:"",
transmission:"",
vin_no:"",
engine_number:""

});






useEffect(()=>{

loadVehicles();

loadCustomers();


},[])






const loadVehicles=async()=>{


try{


const res=await getCustomerVehicles();

setVehicles(res.data);


}catch(err){

console.log(err)

}


}





const loadCustomers=async()=>{


try{


const res=await getCustomers();

setCustomers(res.data);


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







const saveVehicle=async()=>{


try{


if(!form.customer_id){

alert("Select customer");

return;

}




const cleanedForm={

...form,

mileage:form.mileage.replace(/,/g,"")

};




await createCustomerVehicle(cleanedForm);



setShowModal(false);



setForm({

customer_id:"",
registration_number:"",
make:"",
model:"",
year:"",
mileage:"",
color:"",
fuel_type:"",
transmission:"",
vin_no:"",
engine_number:""

});



loadVehicles();



}catch(err){

console.log(err)

}



}








const filteredVehicles = vehicles.filter(vehicle=>{


const text = `

${vehicle.make}

${vehicle.model}

${vehicle.registration_number}

${vehicle.name}

`
.toLowerCase();



return (

text.includes(search.toLowerCase())

&&

(fuel==="" || vehicle.fuel_type===fuel)

&&

(transmission==="" || vehicle.transmission===transmission)

)



});









return (

<div>



<div className="flex justify-between items-center mb-6">


<h1 className="text-2xl font-bold">

Customer Vehicles

</h1>



<button

onClick={()=>setShowModal(true)}

className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
"

>

+ Add Vehicle

</button>



</div>







<div className="flex gap-3 mb-5">



<input

placeholder="Search vehicle, owner, registration..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

className="
border
p-3
rounded-lg
flex-1
"

/>





<select

value={fuel}

onChange={(e)=>setFuel(e.target.value)}

className="border rounded p-3"

>

<option value="">

Fuel

</option>


<option value="Petrol">

Petrol

</option>


<option value="Diesel">

Diesel

</option>


</select>







<select

value={transmission}

onChange={(e)=>setTransmission(e.target.value)}

className="border rounded p-3"

>

<option value="">

Transmission

</option>


<option value="Automatic">

Automatic

</option>


<option value="Manual">

Manual

</option>


</select>



</div>









<div className="bg-white border rounded-xl shadow overflow-hidden">



<table className="w-full">



<thead className="bg-slate-100">


<tr>


<th className="p-4 text-left">
Vehicle
</th>


<th>
Registration
</th>


<th>
Owner
</th>


<th>
Fuel
</th>


<th>
Mileage
</th>


<th>
Actions
</th>



</tr>


</thead>






<tbody>



{

filteredVehicles.map(vehicle=>(



<tr

key={vehicle.id}

className="border-t"

>



<td className="p-4">


<div className="flex gap-3 items-center">


<FaCar className="text-blue-600"/>


<div>


<p className="font-bold">

{vehicle.make} {vehicle.model}

</p>


<p className="text-sm text-slate-500">

{vehicle.year}

</p>


</div>



</div>



</td>





<td>

{vehicle.registration_number}

</td>




<td>


<p>

{vehicle.name}

</p>

<p className="text-sm text-slate-500">

{vehicle.phone}

</p>


</td>






<td>

{vehicle.fuel_type}

</td>






<td>

{vehicle.mileage} KM

</td>






<td>


<div className="flex gap-3">



<Link

to={`/admin/services/vehicles/${vehicle.id}`}

className="
text-blue-600
flex
items-center
gap-1
"

>


<FaEye/>

View

</Link>





<button

className="
text-green-600
flex
items-center
gap-1
"

>

<FaTools/>

Job

</button>



</div>


</td>





</tr>



))

}



</tbody>




</table>




</div>









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
rounded-xl
p-6
w-full
max-w-xl
"

>


<h2 className="text-xl font-bold mb-5">

Add Vehicle

</h2>






<div className="grid grid-cols-2 gap-3">



<select

name="customer_id"

value={form.customer_id}

onChange={handleChange}

className="border p-2 rounded"

>


<option value="">

Select Customer

</option>



{

customers.map(c=>(


<option

key={c.id}

value={c.id}

>


{c.name} - {c.phone}


</option>


))


}



</select>






{
[
"registration_number",
"make",
"model",
"year",
"mileage",
"color",
"fuel_type",
"transmission",
"vin_no",
"engine_number"

].map(field=>(


<input

key={field}

name={field}

placeholder={field.replace("_"," ")}

value={form[field]}

onChange={handleChange}

className="border p-2 rounded"

/>


))

}



</div>








<div className="flex justify-end gap-3 mt-5">



<button

onClick={()=>setShowModal(false)}

className="border px-4 py-2 rounded"

>

Cancel

</button>




<button

onClick={saveVehicle}

className="
bg-blue-600
text-white
px-4
py-2
rounded
"

>

Save

</button>



</div>





</div>


</div>



)

}





</div>


)


}


export default CustomerVehicles;