import React,{useEffect,useState,useRef} from "react";

import {
getCustomerVehicles,
createCustomerVehicle,
updateCustomerVehicle
} from "../../api/serviceApi";

import {getCustomers} from "../../api/CustomerApi";

import {
FaCar,
FaEye,
FaTools,
FaEdit,
FaSearch,
FaChevronDown
} from "react-icons/fa";

import {Link} from "react-router-dom";



const CustomerVehicles=()=>{


const [vehicles,setVehicles]=useState([]);

const [customers,setCustomers]=useState([]);

const [showModal,setShowModal]=useState(false);

const [editingId,setEditingId]=useState(null);



const [search,setSearch]=useState("");

const [fuel,setFuel]=useState("");

const [transmission,setTransmission]=useState("");



// --- searchable customer dropdown state ---
const [customerQuery,setCustomerQuery]=useState("");
const [customerDropdownOpen,setCustomerDropdownOpen]=useState(false);
const customerBoxRef=useRef(null);



const emptyForm = {

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

};



const [form,setForm]=useState(emptyForm);






useEffect(()=>{

loadVehicles();

loadCustomers();


},[])



// close the customer dropdown when clicking outside of it
useEffect(()=>{

const handleClickOutside=(e)=>{

if(customerBoxRef.current && !customerBoxRef.current.contains(e.target)){

setCustomerDropdownOpen(false);

}

}

document.addEventListener("mousedown",handleClickOutside);

return ()=> document.removeEventListener("mousedown",handleClickOutside);

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



const selectCustomer=(customer)=>{

setForm({

...form,

customer_id: customer.id

});

setCustomerQuery(`${customer.name} - ${customer.phone}`);

setCustomerDropdownOpen(false);

}



const selectedCustomerLabel=()=>{

const c = customers.find(c=> String(c.id) === String(form.customer_id));

return c ? `${c.name} - ${c.phone}` : "";

}



const filteredCustomers = customers.filter(c=>{

const text = `${c.name} ${c.phone}`.toLowerCase();

return text.includes(customerQuery.toLowerCase());

});



// Opens the modal pre-filled with an existing vehicle's data. Keeping
// customer_id in the form even though it's not editable here so the
// modal still shows who owns it.
const startEditVehicle = (vehicle)=>{

setEditingId(vehicle.id);

setForm({

customer_id: vehicle.customer_id || "",
registration_number: vehicle.registration_number || "",
make: vehicle.make || "",
model: vehicle.model || "",
year: vehicle.year || "",
mileage: vehicle.mileage != null ? String(vehicle.mileage) : "",
color: vehicle.color || "",
fuel_type: vehicle.fuel_type || "",
transmission: vehicle.transmission || "",
vin_no: vehicle.vin_no || "",
engine_number: vehicle.engine_number || ""

});

setCustomerQuery(vehicle.name ? `${vehicle.name} - ${vehicle.phone || ""}` : "");

setShowModal(true);

}



const openAddModal = ()=>{

setEditingId(null);

setForm(emptyForm);

setCustomerQuery("");

setCustomerDropdownOpen(false);

setShowModal(true);

}



const closeModal = ()=>{

setShowModal(false);

setEditingId(null);

setForm(emptyForm);

setCustomerQuery("");

setCustomerDropdownOpen(false);

}







const saveVehicle=async()=>{


try{


if(!editingId && !form.customer_id){

alert("Select customer");

return;

}




const cleanedForm={

...form,

mileage:form.mileage.replace(/,/g,"")

};




if(editingId){

await updateCustomerVehicle(editingId, cleanedForm);

}else{

await createCustomerVehicle(cleanedForm);

}



closeModal();



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

onClick={openAddModal}

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



<table className="w-full table-fixed">



<thead className="bg-slate-100">


<tr>


<th className="p-4 text-left w-1/4">
Vehicle
</th>


<th className="p-4 text-left w-1/6">
Registration
</th>


<th className="p-4 text-left w-1/4">
Owner
</th>


<th className="p-4 text-left w-1/12">
Fuel
</th>


<th className="p-4 text-left w-1/6">
Mileage
</th>


<th className="p-4 text-left w-1/6">
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





<td className="p-4">

{vehicle.registration_number}

</td>




<td className="p-4">


<p>

{vehicle.name}

</p>

<p className="text-sm text-slate-500">

{vehicle.phone}

</p>


</td>






<td className="p-4">

{vehicle.fuel_type}

</td>






<td className="p-4">

{vehicle.mileage} KM

</td>






<td className="p-4">


<div className="flex gap-3 items-center flex-wrap">



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

onClick={()=>startEditVehicle(vehicle)}

className="
text-amber-600
flex
items-center
gap-1
"

>

<FaEdit/>

Edit

</button>




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

{editingId ? "Edit Vehicle" : "Add Vehicle"}

</h2>






<div className="grid grid-cols-2 gap-3">



{/* Searchable customer picker (replaces the old plain <select>) */}

<div className="relative col-span-2" ref={customerBoxRef}>


{
editingId ? (

// Locked once editing an existing vehicle - shown as read-only text
<div className="border p-2 rounded bg-slate-100 text-slate-500">

{selectedCustomerLabel() || "Customer"}

</div>

) : (

<>

<div className="relative">

<FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/>

<input

type="text"

placeholder="Search customer by name or phone..."

value={customerQuery}

onChange={(e)=>{

setCustomerQuery(e.target.value);

setCustomerDropdownOpen(true);

// typing again means the previous selection no longer matches
if(form.customer_id){

setForm({...form, customer_id:""});

}

}}

onFocus={()=>setCustomerDropdownOpen(true)}

className="border p-2 pl-9 pr-8 rounded w-full"

/>

<FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"/>

</div>



{
customerDropdownOpen && (

<div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border rounded-lg shadow-lg">


{
filteredCustomers.length === 0 ? (

<div className="p-3 text-sm text-slate-400">

No customers found

</div>

) : (

filteredCustomers.map(c=>(

<button

type="button"

key={c.id}

onClick={()=>selectCustomer(c)}

className={`
w-full
text-left
p-3
hover:bg-blue-50
${String(form.customer_id)===String(c.id) ? "bg-blue-50" : ""}
`}

>

<p className="font-medium">{c.name}</p>

<p className="text-sm text-slate-500">{c.phone}</p>

</button>

))

)

}


</div>

)

}

</>

)

}


</div>






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

onClick={closeModal}

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

{editingId ? "Save Changes" : "Save"}

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