import React,{useEffect,useState} from "react";

import {
getMechanics,
createMechanic,
updateMechanic,
deleteMechanic
} from "../../api/serviceApi";


import {
FaUserCog,
FaEdit,
FaTrash
} from "react-icons/fa";




const Mechanics=()=>{


const [mechanics,setMechanics]=useState([]);

const [search,setSearch]=useState("");


const [showModal,setShowModal]=useState(false);


const [editing,setEditing]=useState(null);



const [form,setForm]=useState({

name:"",
phone:"",
specialization:""

});







useEffect(()=>{

loadMechanics();

},[]);







const loadMechanics=async()=>{


try{


const res =
await getMechanics();


setMechanics(res.data);


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








const openAdd=()=>{


setEditing(null);


setForm({

name:"",
phone:"",
specialization:""

});


setShowModal(true);


}







const openEdit=(mechanic)=>{


setEditing(mechanic.id);


setForm({

name:mechanic.name,

phone:mechanic.phone,

specialization:mechanic.specialization


});


setShowModal(true);


}









const saveMechanic=async()=>{


try{


if(editing){


await updateMechanic(
editing,
form
);


}else{


await createMechanic(form);


}



setShowModal(false);


loadMechanics();



}catch(err){

console.log(err);

}


}









const removeMechanic=async(id)=>{


if(!window.confirm("Delete mechanic?"))
return;



try{


await deleteMechanic(id);


loadMechanics();



}catch(err){

console.log(err)

}


}









const filteredMechanics =
mechanics.filter(m=>

m.name
.toLowerCase()
.includes(search.toLowerCase())

||
m.phone
?.includes(search)


);










return (


<div>




<div className="flex justify-between mb-6">


<h1 className="text-2xl font-bold">

Mechanics

</h1>



<button

onClick={openAdd}

className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
"

>

+ Add Mechanic

</button>


</div>









<div className="bg-white border rounded-xl shadow overflow-hidden">





<div className="p-4">


<input

placeholder="Search mechanic..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

className="
border
rounded-lg
p-3
w-full
"

 />


</div>









<table className="w-full text-sm">



<thead className="bg-slate-100">


<tr>


<th className="p-4 text-left">

Name

</th>


<th>

Phone

</th>



<th>

Specialization

</th>


<th>

Status

</th>


<th>

Actions

</th>


</tr>


</thead>








<tbody>


{


filteredMechanics.length===0 ?



<tr>


<td

colSpan="5"

className="text-center p-5"

>

No mechanics found

</td>


</tr>




:


filteredMechanics.map(mechanic=>(



<tr

key={mechanic.id}

className="border-b"


>



<td className="p-4 flex items-center gap-3">


<FaUserCog className="text-blue-600"/>


{mechanic.name}


</td>





<td>

{mechanic.phone || "-"}

</td>






<td>

{mechanic.specialization || "General"}

</td>







<td>


<span

className="
px-3
py-1
rounded-full
text-xs
bg-green-100
text-green-700
"

>

Active

</span>


</td>








<td className="flex gap-3 p-4">



<button

onClick={()=>openEdit(mechanic)}

className="text-blue-600"

>

<FaEdit/>

</button>





<button

onClick={()=>removeMechanic(mechanic.id)}

className="text-red-600"

>

<FaTrash/>

</button>



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
fixed
inset-0
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
max-w-md
"


>


<h2 className="text-xl font-bold mb-5">


{
editing
?
"Edit Mechanic"
:
"Add Mechanic"

}


</h2>







<input

name="name"

placeholder="Name"

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






<input

name="phone"

placeholder="Phone"

value={form.phone}

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

name="specialization"

placeholder="Specialization"

value={form.specialization}

onChange={handleChange}

className="
border
p-3
rounded
w-full
mb-3
"

/>








<div className="flex justify-end gap-3">



<button

onClick={()=>setShowModal(false)}

className="
border
px-4
py-2
rounded
"

>

Cancel

</button>






<button

onClick={saveMechanic}

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



export default Mechanics;