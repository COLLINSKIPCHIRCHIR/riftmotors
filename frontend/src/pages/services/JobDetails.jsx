import React,{useEffect,useState,useRef} from "react";
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
 addJobPart,
 deleteJobPart, 
 createServiceEstimate,


} from "../../api/serviceApi";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import CreateEstimateModal from "./CreateEstimateModal";
import SparePartSearchSelect from "./SparePartSearchSelect";

import {
 FaUserCog,
 FaCar,
 FaTools

} from "react-icons/fa";



const JobDetails =()=>{


const {id}=useParams();

const navigate = useNavigate();

const printRef = useRef();


const [job,setJob]=useState(null);

const [assignment,setAssignment]=useState([]);

const [services,setServices]=useState([]);

const [parts,setParts]=useState([]);

const [mechanics,setMechanics]=useState([]);

const [selectedMechanic,setSelectedMechanic]=useState("");

const [catalog,setCatalog]=useState([]);

const [selectedService,setSelectedService]=useState("");

const [serviceQuantity,setServiceQuantity]=useState(1);

const [variablePrice,setVariablePrice]=useState("");

const [error,setError]=useState("");

// "catalog" = pick from service_catalog (existing flow).
// "custom"  = service not in the system at all - typed name + price,
// billed as-is, no catalog row, no min/max guardrails.
const [serviceMode,setServiceMode]=useState("catalog");

const [customServiceName,setCustomServiceName]=useState("");

const [customServicePrice,setCustomServicePrice]=useState("");

const [customServiceQuantity,setCustomServiceQuantity]=useState(1);

// NOTE: spareParts (the full 2000-row list) is gone. SparePartSearchSelect
// fetches matches from the backend as the user types instead.

const [selectedPart,setSelectedPart]=useState(null);

const [partQuantity,setPartQuantity]=useState(1);

// Manually entered selling price for the job. Pre-filled with the
// catalog selling_price as a suggestion when a part is picked, but the
// user can override it per-job. The buying_price is the hard floor —
// enforced here for instant feedback and again on the backend as the
// real rule.
const [partUnitPrice,setPartUnitPrice]=useState("");

const [partPriceError,setPartPriceError]=useState("");

// Three ways a part can end up on a job:
// "inventory" - linked to a spareparts row, priced with a buying-price floor
// "customer"  - customer brought their own, free, no inventory link
// "custom"    - not in inventory at all, but still billable (bought
//               elsewhere for this job) - typed name/number/price
const [partMode,setPartMode]=useState("inventory");

const [customerPartName,setCustomerPartName]=useState("");

const [customPartName,setCustomPartName]=useState("");

const [customPartNumber,setCustomPartNumber]=useState("");

const [customPartPrice,setCustomPartPrice]=useState("");

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


const isCompleted = job?.status === "completed";


const handleAssignMechanic = async()=>{

if(isCompleted) return;

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


// Renders the printable area into a PDF and returns it as a Blob.
// `onclone` strips anything marked `.capture-hide` (dropdowns, inputs,
// add/remove/assign buttons) from the CLONED document before
// html2canvas draws it, so the exported file only ever shows the job
// card content — never the editing controls. `print:hidden` covers the
// native browser Print button separately.
const generatePdfBlob = async () => {
  const canvas = await html2canvas(printRef.current, {
    scale: 2,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll(".capture-hide").forEach((el) => {
        el.style.display = "none";
      });
    },
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = (canvas.height * pageWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  return pdf.output("blob");
};

const handleDownloadPdf = async () => {
  try {
    const blob = await generatePdfBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${job.job_number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.log(err);
    alert("Could not generate PDF");
  }
};




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


const selectedCatalogService =
catalog.find(
s=>s.id===Number(selectedService)
);


const isSelectedServiceUnitBased =
selectedCatalogService?.pricing_type === "unit";


const isSelectedServiceVariable =
selectedCatalogService?.pricing_type === "variable";


const handleServiceSelect = (value)=>{

setSelectedService(value);

const chosen = catalog.find(
s=>s.id===Number(value)
);

// fixed and variable-priced services are always quantity 1
if(chosen && chosen.pricing_type !== "unit"){

setServiceQuantity(1);

}

setVariablePrice("");

}


// Switching between catalog/custom clears out whatever was picked/typed
// for the other mode so stale state never leaks across.
const handleServiceModeChange = (mode)=>{

setServiceMode(mode);

setSelectedService("");

setServiceQuantity(1);

setVariablePrice("");

setCustomServiceName("");

setCustomServicePrice("");

setCustomServiceQuantity(1);

}


const handleAddService = async()=>{

if(isCompleted) return;

// --- CUSTOM / NOT-IN-CATALOG SERVICE ---
if(serviceMode==="custom"){

if(!customServiceName.trim()){

alert("Enter the service name");

return;

}

if(!customServicePrice || Number(customServicePrice) <= 0){

alert("Enter a price for this service");

return;

}

try{

await addJobService({

job_id:id,

is_custom:true,

custom_name:customServiceName.trim(),

price:customServicePrice,

quantity:customServiceQuantity || 1

});

const res =
await getJobServices(id);

setServices(res.data);

setCustomServiceName("");

setCustomServicePrice("");

setCustomServiceQuantity(1);

}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed adding service"
);

}

return;

}

// --- CATALOG SERVICE (existing flow) ---
const exists =
services.find(
s=>s.service_id===Number(selectedService)
);


if(exists){

alert("Service already added");

return;

}


if(isSelectedServiceVariable && !variablePrice){

alert("Enter the assessed price for this service before adding it");

return;

}


try{


const service =
catalog.find(
s=>s.id===Number(selectedService)
);


const quantityToSend =
service.pricing_type === "unit"
? serviceQuantity
: 1;


const priceToSend =
service.pricing_type === "variable"
? variablePrice
: service.price;


await addJobService({

job_id:id,

service_id:selectedService,

quantity:quantityToSend,

price:priceToSend

});


const res =
await getJobServices(id);


setServices(res.data);



setSelectedService("");

setServiceQuantity(1);

setVariablePrice("");


}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed adding service"
);

}


}


const handleDeleteService=async(serviceId)=>{

if(isCompleted) return;

try{


await deleteJobService(serviceId);


const res =
await getJobServices(id);


setServices(res.data);



}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed removing service"
);

}


}


// Called by SparePartSearchSelect when a part is picked (or cleared).
// Pre-fills the manual price field with the suggested selling_price,
// and resets any stale validation error from a previous part.
const handleSelectPart = (part)=>{

setSelectedPart(part);

setPartUnitPrice(
part ? part.selling_price : ""
);

setPartPriceError("");

}


const handlePartPriceChange = (value)=>{

setPartUnitPrice(value);

if(
selectedPart &&
value !== "" &&
Number(value) < Number(selectedPart.buying_price)
){

setPartPriceError(
`Price cannot be below buying price (KES ${selectedPart.buying_price})`
);

}else{

setPartPriceError("");

}

}


// Switching between inventory/customer/custom clears out whatever was
// picked/typed for the other modes, so switching back and forth never
// leaves stale state behind (e.g. a selected inventory part with a
// customer-supplied name still sitting in state).
const handlePartModeChange = (mode)=>{

setPartMode(mode);

setSelectedPart(null);

setPartUnitPrice("");

setPartPriceError("");

setCustomerPartName("");

setCustomPartName("");

setCustomPartNumber("");

setCustomPartPrice("");

}


const isInventoryPriceInvalid =
!selectedPart ||
partUnitPrice === "" ||
Number(partUnitPrice) <= 0 ||
Number(partUnitPrice) < Number(selectedPart.buying_price);


const isCustomPartInvalid =
!customPartName.trim() ||
!customPartPrice ||
Number(customPartPrice) <= 0;


const isAddPartDisabled =
partMode === "inventory" ? isInventoryPriceInvalid :
partMode === "custom" ? isCustomPartInvalid :
false;


const handleAddPart = async()=>{

if(isCompleted) return;

// --- CUSTOMER SUPPLIED ---
if(partMode==="customer"){

if(!customerPartName.trim()){

alert("Enter the part name");

return;

}

try{


await addJobPart({

job_id:id,

customer_supplied:true,

part_name:customerPartName.trim(),

quantity:partQuantity

});


const res =
await getJobParts(id);


setParts(res.data);


setCustomerPartName("");

setPartQuantity(1);


}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed adding part"
);

}

return;

}

// --- CUSTOM / NOT-IN-INVENTORY, STILL BILLABLE ---
if(partMode==="custom"){

if(!customPartName.trim()){

alert("Enter the part name");

return;

}

if(!customPartPrice || Number(customPartPrice) <= 0){

alert("Enter a selling price for this part");

return;

}

try{

await addJobPart({

job_id:id,

is_custom:true,

part_name:customPartName.trim(),

part_number:customPartNumber.trim() || null,

unit_price:customPartPrice,

quantity:partQuantity

});

const res =
await getJobParts(id);

setParts(res.data);

setCustomPartName("");

setCustomPartNumber("");

setCustomPartPrice("");

setPartQuantity(1);

}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed adding part"
);

}

return;

}

// --- INVENTORY-LINKED (existing flow) ---
if(!selectedPart) return;

if(!partUnitPrice || Number(partUnitPrice) <= 0){

alert("Enter a selling price for this part");

return;

}

if(Number(partUnitPrice) < Number(selectedPart.buying_price)){

alert(
`Selling price cannot be below buying price (KES ${selectedPart.buying_price})`
);

return;

}

try{


await addJobPart({

job_id:id,

sparepart_id:selectedPart.id,

quantity:partQuantity,

unit_price:partUnitPrice

});



const res =
await getJobParts(id);


setParts(res.data);


setSelectedPart(null);

setPartQuantity(1);

setPartUnitPrice("");

setPartPriceError("");



}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed adding part"
);

}


}


const handleDeletePart = async(partId)=>{

if(isCompleted) return;

try{

await deleteJobPart(partId);

const res =
await getJobParts(id);

setParts(res.data);

}catch(err){

console.log(err);

alert(
err.response?.data?.message ||
"Failed removing part"
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


<div ref={printRef}>





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

<div className="flex gap-2 print:hidden capture-hide">

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

<button

onClick={()=>window.print()}

className="
bg-gray-800
text-white
px-4
py-2
rounded-lg
"

>

Print

</button>

<button

onClick={handleDownloadPdf}

className="
bg-blue-800
text-white
px-4
py-2
rounded-lg
"

>

Download PDF

</button>

</div>



</div>



{

isCompleted &&

<div className="
mb-6
bg-amber-50
border
border-amber-300
text-amber-800
rounded-xl
p-4
">

This job is marked completed. Services, spare parts and mechanic
assignment can no longer be modified.

</div>

}









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





{

!isCompleted &&

<div className="mt-4 print:hidden capture-hide">


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

}





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



{

!isCompleted &&

<div className="print:hidden capture-hide">

<div className="flex gap-4 text-sm mb-3">

<label className="flex items-center gap-1">

<input

type="radio"

checked={serviceMode==="catalog"}

onChange={()=>handleServiceModeChange("catalog")}

/>

From catalog

</label>

<label className="flex items-center gap-1">

<input

type="radio"

checked={serviceMode==="custom"}

onChange={()=>handleServiceModeChange("custom")}

/>

Not in system (bill it)

</label>

</div>


{

serviceMode==="catalog" ?

<>

<div className="grid md:grid-cols-2 gap-3">


<select

value={selectedService}

onChange={(e)=>
handleServiceSelect(e.target.value)
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
{
service.pricing_type === "variable"
? " - Quote on inspection"
: ` - KES ${service.price}${
service.pricing_type === "unit"
? ` per ${service.unit}`
: ""
}`
}


</option>


))

}


</select>




<input

type="number"

min="0.01"

step="0.01"

value={serviceQuantity}

disabled={!isSelectedServiceUnitBased}

onChange={(e)=>
setServiceQuantity(e.target.value)
}


className="
border
rounded-lg
p-2
disabled:bg-slate-100
disabled:text-slate-400
"

placeholder={
isSelectedServiceUnitBased
? `Quantity (${selectedCatalogService.unit})`
: "Quantity (fixed = 1)"
}

/>



</div>



{

isSelectedServiceVariable &&

<div className="mt-3">

<label className="text-sm font-semibold text-slate-600">

Assessed price for this job

</label>


{

selectedCatalogService.min_price && selectedCatalogService.max_price &&

<p className="text-xs text-slate-500 mb-1">

Suggested range: KES {selectedCatalogService.min_price} - {selectedCatalogService.max_price}

</p>

}


<input

type="number"

min="0"

value={variablePrice}

onChange={(e)=>
setVariablePrice(e.target.value)
}

placeholder="Enter price after inspection"

className="
border
rounded-lg
p-2
w-full
mt-1
"

/>

</div>

}

</>

:

<div className="grid md:grid-cols-3 gap-3">

<input

type="text"

placeholder="Service name"

value={customServiceName}

onChange={(e)=>
setCustomServiceName(e.target.value)
}

className="border rounded-lg p-2"

/>

<input

type="number"

min="1"

value={customServiceQuantity}

onChange={(e)=>
setCustomServiceQuantity(e.target.value)
}

placeholder="Quantity"

className="border rounded-lg p-2"

/>

<input

type="number"

min="0.01"

step="0.01"

value={customServicePrice}

onChange={(e)=>
setCustomServicePrice(e.target.value)
}

placeholder="Price (KES)"

className="border rounded-lg p-2"

/>

</div>

}




<button

onClick={handleAddService}

disabled={
serviceMode==="catalog"
? !selectedService
: (!customServiceName.trim() || !customServicePrice || Number(customServicePrice) <= 0)
}


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

</div>

}





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
{
service.is_custom &&
<span className="italic text-gray-500 text-sm ml-1">
(custom)
</span>
}

</h3>


<p className="text-sm text-gray-500">

Quantity:
{service.quantity}

</p>


<p className="text-sm text-gray-500">

{
service.is_custom
? `Price: KES ${service.price}`
: service.pricing_type === "unit"
? `KES ${service.price} per ${service.unit}`
: service.pricing_type === "variable"
? `Assessed price: KES ${service.price}`
: `Fixed price: KES ${service.price}`
}

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


{

!isCompleted &&

<button

onClick={()=>handleDeleteService(service.id)}

className="
text-red-500
text-sm
mt-2
print:hidden
capture-hide
"

>

Remove

</button>

}


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


{

!isCompleted &&

<div className="print:hidden capture-hide">

<div className="flex gap-4 text-sm mb-3">

<label className="flex items-center gap-1">

<input

type="radio"

checked={partMode==="inventory"}

onChange={()=>handlePartModeChange("inventory")}

/>

From inventory

</label>

<label className="flex items-center gap-1">

<input

type="radio"

checked={partMode==="customer"}

onChange={()=>handlePartModeChange("customer")}

/>

Customer supplied

</label>

<label className="flex items-center gap-1">

<input

type="radio"

checked={partMode==="custom"}

onChange={()=>handlePartModeChange("custom")}

/>

Not in system (bill it)

</label>

</div>


<div className="grid md:grid-cols-2 gap-3">


{

partMode==="inventory" &&

<SparePartSearchSelect

onSelect={handleSelectPart}

/>

}


{

partMode==="customer" &&

<input

type="text"

placeholder="Part name"

value={customerPartName}

onChange={(e)=>
setCustomerPartName(e.target.value)
}

className="border rounded-lg p-2"

/>

}


{

partMode==="custom" &&

<>

<input

type="text"

placeholder="Part name"

value={customPartName}

onChange={(e)=>
setCustomPartName(e.target.value)
}

className="border rounded-lg p-2"

/>

<input

type="text"

placeholder="Part number (optional)"

value={customPartNumber}

onChange={(e)=>
setCustomPartNumber(e.target.value)
}

className="border rounded-lg p-2"

/>

</>

}



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



{

partMode==="custom" &&

<div className="mt-3">

<label className="text-sm font-semibold text-slate-600">

Selling price (KES)

</label>

<input

type="number"

min="0.01"

step="0.01"

value={customPartPrice}

onChange={(e)=>
setCustomPartPrice(e.target.value)
}

placeholder="Enter the price to charge for this job"

className="
border
rounded-lg
p-2
w-full
mt-1
"

/>

</div>

}



{

partMode==="inventory" && selectedPart &&

<div className="mt-3">

<label className="text-sm font-semibold text-slate-600">

Selling price (KES)

</label>


<p className="text-xs text-slate-500 mb-1">

Suggested: KES {selectedPart.selling_price}
{" "}·{" "}
Buying price: KES {selectedPart.buying_price} (minimum allowed)

</p>


<input

type="number"

min={selectedPart.buying_price}

step="0.01"

value={partUnitPrice}

onChange={(e)=>
handlePartPriceChange(e.target.value)
}

placeholder="Enter the price to charge for this job"

className="
border
rounded-lg
p-2
w-full
"

/>


{

partPriceError &&

<p className="text-red-500 text-sm mt-1">

{partPriceError}

</p>

}

</div>

}


{

partMode==="customer" &&

<p className="text-xs text-slate-500 mt-3">

No charge will be added for this part on the estimate/invoice —
only labour and any other services will be billed.

</p>

}



<button

onClick={handleAddPart}

disabled={isAddPartDisabled}

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

</div>

}




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
{
part.part_number &&
<span className="text-xs text-gray-400 ml-1">
({part.part_number})
</span>
}
{
part.customer_supplied &&
<span className="italic text-gray-500 text-sm ml-1">
(customer supplied)
</span>
}
{
part.is_custom &&
<span className="italic text-gray-500 text-sm ml-1">
(custom)
</span>
}

</p>


<p className="text-sm text-gray-500">

Qty: {part.quantity}

</p>


<p className="text-sm text-gray-500">

{
part.customer_supplied
? "No charge"
: `Unit price: KES ${part.unit_price}`
}

</p>

{
!part.customer_supplied &&
!part.is_custom &&
part.available_stock != null &&
part.quantity > part.available_stock &&

<p className="text-red-500 text-sm">

Shortage:
{part.quantity - part.available_stock}

items

</p>

}


</div>


<div className="text-right">


<p className="font-bold">

KES {part.total_price}

</p>


{

!isCompleted &&

<button

onClick={()=>handleDeletePart(part.id)}

className="
text-red-500
text-sm
mt-2
print:hidden
capture-hide
"

>

Remove

</button>

}


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