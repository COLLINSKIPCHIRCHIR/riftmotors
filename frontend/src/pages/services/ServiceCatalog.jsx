import React,{useEffect,useState} from "react";

import {
getServices,
createService,
updateService,
deleteService

} from "../../api/serviceApi";


import {FaTools} from "react-icons/fa";



const ServiceCatalog=()=>{


const [services,setServices]=useState([]);

const [showModal,setShowModal]=useState(false);


const [editing,setEditing]=useState(null);



const [form,setForm]=useState({

name:"",
description:"",
price:"",
min_price:"",
max_price:"",
pricing_type:"fixed",
unit:""

});





useEffect(()=>{

loadServices();

},[])




const loadServices=async()=>{


try{

const res=await getServices();

setServices(res.data);


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





const saveService=async()=>{


try{


const payload={

...form,

// don't send a stray unit if the service isn't unit-based
unit: form.pricing_type==="unit" ? form.unit : null,

// variable services get their price set per-job, not in the catalog
price: form.pricing_type==="variable" ? null : form.price

};


if(editing){


await updateService(
editing,
payload
);


}else{


await createService(payload);


}



setShowModal(false);


setEditing(null);


setForm({

name:"",
description:"",
price:"",
min_price:"",
max_price:"",
pricing_type:"fixed",
unit:""

});


loadServices();



}catch(err){

console.log(err)

}



}







const editService=(service)=>{


setEditing(service.id);


setForm({

name:service.name,

description:service.description,

price:service.price,

min_price:service.min_price,

max_price:service.max_price,

pricing_type:service.pricing_type || "fixed",

unit:service.unit || ""


});


setShowModal(true);


}







const removeService=async(id)=>{


if(!confirm("Delete this service?")) return;


await deleteService(id);


loadServices();


}





return (


<div>



<div className="flex justify-between mb-6">


<h1 className="text-2xl font-bold">

Service Catalog

</h1>



<button

onClick={()=>{

setEditing(null);

setForm({

name:"",
description:"",
price:"",
min_price:"",
max_price:"",
pricing_type:"fixed",
unit:""

});

setShowModal(true);

}}

className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
"

>

+ Add Service

</button>


</div>








<div className="grid md:grid-cols-3 gap-5">



{

services.map(service=>(


<div

key={service.id}

className="
bg-white
border
shadow
rounded-xl
p-5
"

>



<FaTools className="text-blue-600 text-2xl mb-3"/>



<h2 className="font-bold">

{service.name}

</h2>



<p className="text-sm text-slate-500">

{service.description}

</p>




<div className="mt-4 font-bold">

{
service.pricing_type==="variable" ? (

<>

{
service.min_price && service.max_price ? (

<span>

KES {service.min_price} - {service.max_price}

</span>

) : (

<span className="font-normal text-slate-500">

Quote on inspection

</span>

)

}

</>

) : (

<>

KES {service.price}

{
service.pricing_type==="unit" &&

<span className="text-sm font-normal text-slate-500">

{" "}per {service.unit}

</span>

}

</>

)

}

</div>


<div className="mt-1 text-xs">

<span

className={`
px-2
py-1
rounded-full
${
service.pricing_type==="unit"
? "bg-purple-100 text-purple-700"
: service.pricing_type==="variable"
? "bg-orange-100 text-orange-700"
: "bg-slate-100 text-slate-600"
}
`}

>

{
service.pricing_type==="unit"
? "Unit-based"
: service.pricing_type==="variable"
? "Variable"
: "Fixed price"
}

</span>

</div>




<div className="flex gap-3 mt-5">


<button

onClick={()=>editService(service)}

className="
bg-yellow-500
text-white
px-3
py-2
rounded
"

>

Edit

</button>



<button

onClick={()=>removeService(service.id)}

className="
bg-red-600
text-white
px-3
py-2
rounded
"

>

Delete

</button>


</div>




</div>


))

}



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
"

>


<div

className="
bg-white
p-6
rounded-xl
w-full
max-w-md
"

>


<h2 className="text-xl font-bold mb-5">


{
editing ?

"Edit Service"

:

"Add Service"

}


</h2>






<input

name="name"

placeholder="Service name"

value={form.name}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mb-3
"

/>





<textarea

name="description"

placeholder="Description"

value={form.description}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mb-3
"

/>




<label className="text-sm font-semibold text-slate-600">

Pricing Type

</label>


<select

name="pricing_type"

value={form.pricing_type}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mb-3
mt-1
"

>


<option value="fixed">

Fixed price

</option>


<option value="unit">

Priced per unit

</option>


<option value="variable">

Variable (quote on inspection)

</option>


</select>


{

form.pricing_type==="variable" &&

<p className="text-xs text-slate-500 mb-3">

The exact price will be entered by staff when this service is
added to a job, based on the actual scope of work. Use the
range below as a guide for quoting.

</p>

}




{

form.pricing_type==="unit" &&

<input

name="unit"

placeholder="Unit (e.g. meter, point, hour)"

value={form.unit}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mb-3
"

/>

}




{

form.pricing_type!=="variable" &&

<>

<label className="text-sm font-semibold text-slate-600">

{
form.pricing_type==="unit"
? "Price per unit"
: "Price"
}

</label>


<input

name="price"

placeholder={
form.pricing_type==="unit"
? "Price per unit"
: "Price"
}

value={form.price}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mt-1
mb-3
"

/>

</>

}


<label className="text-sm font-semibold text-slate-600">

{
form.pricing_type==="variable"
? "Estimated minimum (guide only)"
: "Minimum allowed price"
}

</label>


<input

name="min_price"

placeholder="Minimum allowed price"

value={form.min_price}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mb-3
mt-1
"

/>


<label className="text-sm font-semibold text-slate-600">

{
form.pricing_type==="variable"
? "Estimated maximum (guide only)"
: "Maximum allowed price"
}

</label>


<input

name="max_price"

placeholder="Maximum allowed price"

value={form.max_price}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mt-1
"

/>





<div className="flex justify-end gap-3 mt-5">


<button

onClick={()=>setShowModal(false)}

className="border px-4 py-2 rounded"

>

Cancel

</button>



<button

onClick={saveService}

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



export default ServiceCatalog;