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
max_price:""

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


if(editing){


await updateService(
editing,
form
);


}else{


await createService(form);


}



setShowModal(false);


setEditing(null);


setForm({

name:"",
description:"",
price:"",
min_price:"",
max_price:""

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

max_price:service.max_price


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

onClick={()=>setShowModal(true)}

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

KES {service.price}

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





<input

name="price"

placeholder="Price"

value={form.price}

onChange={handleChange}

className="
border
p-3
rounded
w-full
"

/>


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
"

/>


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