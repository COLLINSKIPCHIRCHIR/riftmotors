import React,{useEffect,useState,useRef} from "react";
import {useParams, useNavigate} from "react-router-dom";
import API from "../../api/api";
import {
 getServiceJob,
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
setJobServiceCompletion,
updateJobService,
  updateJobPart,
  updateServiceJob,

} from "../../api/serviceApi";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import CreateEstimateModal from "./CreateEstimateModal";
import SparePartSearchSelect from "./SparePartSearchSelect";
import JobCardTerms from "./JobCardTerms";

import {
 FaUserCog,
 FaCar,
 FaTools,
 FaIdCard,
 FaClipboardList,
 FaFileInvoiceDollar,

} from "react-icons/fa";

// Letterhead details for the printed job card. Edit to match the real
// workshop's details - these are only used for the header/print output.
const WORKSHOP = {

 name: "RIFT MOTORS LTD",

 addressLine: "KFA Show Ground Road, P.O. Box 18962-20100 Nakuru - Kenya",

 tel: "0790-406996",

 email: "info@riftmotors.com",

 email2: "riftmotorsltd@gmail.com",

 // Served straight from the CRA/Vite "public" folder, so the file itself
 // lives at frontend/public/rmotologo.jpg on disk but is requested at
 // this root-relative path in the browser.
 logo: "/rmotologo.jpg",

}

// Simple generic car outline diagrams used on the printed job card so a
// technician/customer can mark damage locations, matching the paper job
// card. Purely decorative/print-only - no data binding.
const CarSideDiagram = ({flip=false}) => (
 <svg
  viewBox="0 0 120 50"
  className="w-16 h-8"
  style={flip ? {transform:"scaleX(-1)"} : undefined}
 >
  <path
   d="M10 38 Q10 28 22 26 L34 14 Q40 8 52 8 L74 8 Q84 8 90 16 L100 26 Q112 28 112 38 L112 40 L104 40 Q104 46 98 46 Q92 46 92 40 L34 40 Q34 46 28 46 Q22 46 22 40 L10 40 Z"
   fill="none"
   stroke="#94a3b8"
   strokeWidth="2"
  />
  <circle cx="28" cy="40" r="6" fill="none" stroke="#94a3b8" strokeWidth="2"/>
  <circle cx="98" cy="40" r="6" fill="none" stroke="#94a3b8" strokeWidth="2"/>
 </svg>
)

const CarFrontDiagram = () => (
 <svg viewBox="0 0 80 50" className="w-12 h-8">
  <rect x="15" y="10" width="50" height="28" rx="6" fill="none" stroke="#94a3b8" strokeWidth="2"/>
  <line x1="40" y1="10" x2="40" y2="38" stroke="#94a3b8" strokeWidth="2"/>
  <circle cx="22" cy="42" r="4" fill="none" stroke="#94a3b8" strokeWidth="2"/>
  <circle cx="58" cy="42" r="4" fill="none" stroke="#94a3b8" strokeWidth="2"/>
 </svg>
)

const JobDetails =()=>{


const {id}=useParams();

const navigate = useNavigate();

const printRef = useRef();

// cardRef wraps the print-only job-card replica (page 1 of the printed
// output). termsRef wraps the terms & conditions sheet (page 2+). Kept
// separate from printRef so the "Download PDF" flow can rasterize and
// paginate each of them independently - see generatePdfBlob below.
const cardRef = useRef();

const termsRef = useRef();


const [job,setJob]=useState(null);

const [assignment,setAssignment]=useState([]);

const [services,setServices]=useState([]);

const [parts,setParts]=useState([]);

// NOTE: kept the name "mechanics" for the underlying data/API (matches
// the backend's mechanics table + assignMechanic/getMechanics
// endpoints) - only the on-screen wording says "Technician".
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

// Freeform technician findings, written straight onto the job card -
// same purpose as the pen-and-paper "Cause" / "Remedy" boxes on the
// physical card. These are editable divs so a technician can type them
// in, and they're captured into the PDF/print output along with
// everything else in printRef.
// TODO: these are UI-only right now - wire them up to job.cause /
// job.remedy (or similar columns) once the backend has somewhere to
// save them, and load/save on blur the same way the rest of the form
// talks to the API.
const [causeNotes,setCauseNotes]=useState("");

const [remedyNotes,setRemedyNotes]=useState("");

// Edit-in-place state — separate from add-new state so editing an
// existing row never clobbers what's half-typed in the "add" form.
const [editingServiceId, setEditingServiceId] = useState(null);
const [editServiceQty, setEditServiceQty] = useState("");
const [editServicePrice, setEditServicePrice] = useState("");
const [editServiceName, setEditServiceName] = useState("");

const [editingPartId, setEditingPartId] = useState(null);
const [editPartQty, setEditPartQty] = useState("");
const [editPartPrice, setEditPartPrice] = useState("");

const [customers, setCustomers] = useState([]);
const [showBillToModal, setShowBillToModal] = useState(false);
const [billToCustomerId, setBillToCustomerId] = useState("");
const [billToName, setBillToName] = useState("");
const [billToKraPin, setBillToKraPin] = useState("");
const [savingBillTo, setSavingBillTo] = useState(false);


const user = JSON.parse(localStorage.getItem("user") || "{}");

useEffect(()=>{


const loadData=async()=>{


try{


const jobRes =
await getServiceJob(id);


const currentJob =
jobRes.data;


setJob(currentJob);


setBillToCustomerId(currentJob.bill_to_customer_id || "");
setBillToName(currentJob.bill_to_name || "");
setBillToKraPin(currentJob.bill_to_kra_pin || "");



setCauseNotes(currentJob?.cause_notes || "");

setRemedyNotes(currentJob?.remedy_notes || "");




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

const customersRes = await API.get("/customers");
setCustomers(customersRes.data);

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
"Failed assigning technician"
);

}


}


const handleOpenBillToModal = () => {
  setBillToCustomerId(job.bill_to_customer_id || "");
  setBillToName(job.bill_to_name || "");
  setBillToKraPin(job.bill_to_kra_pin || "");
  setShowBillToModal(true);
};

const handleBillToCustomerSelect = (e) => {
  const selectedId = e.target.value;
  const selected = customers.find(c => c.id == selectedId);
  setBillToCustomerId(selectedId);
  if (selected) {
    setBillToName(selected.name);
    setBillToKraPin(selected.kra_pin || "");
  }
};

const handleSaveBillTo = async () => {
  setSavingBillTo(true);
  try {
    const res = await updateServiceJob(id, {
      bill_to_customer_id: billToCustomerId || null,
      bill_to_name: billToName.trim() || null,
      bill_to_kra_pin: billToKraPin.trim() || null,
    });
    setJob(res.data);
    setShowBillToModal(false);
  } catch (err) {
    alert(err.response?.data?.message || "Failed updating billing details");
  } finally {
    setSavingBillTo(false);
  }
};


// Shared html2canvas options for both capture passes below.
// `onclone` runs against a CLONED document before html2canvas draws it,
// so we use it to swap which layout is visible in the exported image:
//  - `.capture-hide`  -> dashboard-only controls/sections, forced hidden
//  - `.capture-show`  -> the print-only replica, forced visible
// (these elements are normally hidden on screen via Tailwind's `hidden`
// class and only shown for native printing via `print:block`, but
// html2canvas doesn't apply @media print, so we force it here too.)
// `print:hidden` covers the native browser Print button separately.
const CAPTURE_OPTIONS = {
  scale: 2,
  onclone: (clonedDoc) => {
    clonedDoc.querySelectorAll(".capture-hide").forEach((el) => {
      el.style.display = "none";
    });
    clonedDoc.querySelectorAll(".capture-show").forEach((el) => {
      el.style.display = el.getAttribute("data-capture-display") || "block";
    });
  },
};

// Slices a (possibly very tall) canvas into real A4-height chunks and
// adds each chunk as its own PDF page. This is what actually makes
// pagination work - a single addImage() call with a height taller than
// one page just gets clipped by jsPDF instead of flowing onto new pages.
// `startOnNewPage` forces a fresh page before the very first slice too,
// which is how we guarantee the terms sheet never shares a page with
// the job card, no matter how many pages the job card itself took up.
const addCanvasAsPages = (pdf, canvas, { startOnNewPage }) => {
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pageWidthMm;
  const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);

  let renderedPx = 0;
  let isFirstSlice = true;

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    sliceCanvas
      .getContext("2d")
      .drawImage(
        canvas,
        0, renderedPx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );

    if (!isFirstSlice || startOnNewPage) {
      pdf.addPage();
    }

    pdf.addImage(
      sliceCanvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      pageWidthMm,
      sliceHeightPx / pxPerMm
    );

    renderedPx += sliceHeightPx;
    isFirstSlice = false;
  }
};

// Renders the job card and the terms sheet as two independent captures
// and assembles them into a paginated PDF: job card first (page 1, or
// more if it overflows), then the terms & conditions always starting on
// a clean new page.
const generatePdfBlob = async () => {
  const pdf = new jsPDF("p", "mm", "a4");

  const cardCanvas = await html2canvas(cardRef.current, CAPTURE_OPTIONS);
  addCanvasAsPages(pdf, cardCanvas, { startOnNewPage: false });

  const termsCanvas = await html2canvas(termsRef.current, CAPTURE_OPTIONS);
  addCanvasAsPages(pdf, termsCanvas, { startOnNewPage: true });

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







const startEditService = (service) => {
  if (isCompleted) return;
  setEditingServiceId(service.id);
  setEditServiceQty(service.quantity);
  setEditServicePrice(service.price);
  setEditServiceName(service.is_custom ? service.service_name : "");
};

const cancelEditService = () => {
  setEditingServiceId(null);
  setEditServiceQty("");
  setEditServicePrice("");
  setEditServiceName("");
};

const handleSaveEditService = async (service) => {
  try {
    await updateJobService(service.id, {
      quantity: editServiceQty,
      price: editServicePrice,
      custom_name: service.is_custom ? editServiceName : undefined,
    });

    const res = await getJobServices(id);
    setServices(res.data);
    setEditingServiceId(null);
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed updating service");
  }
};

const startEditPart = (part) => {
  if (isCompleted) return;
  setEditingPartId(part.id);
  setEditPartQty(part.quantity);
  setEditPartPrice(part.unit_price ?? "");
};

const cancelEditPart = () => {
  setEditingPartId(null);
};

const handleSaveEditPart = async (part) => {
  try {
    await updateJobPart(part.id, {
      quantity: editPartQty,
      unit_price: part.customer_supplied ? undefined : editPartPrice,
    });

    const res = await getJobParts(id);
    setParts(res.data);
    setEditingPartId(null);
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed updating part");
  }
};


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


const handleToggleServiceCompletion = async (service) => {

  if (isCompleted) return;

  try {

    await setJobServiceCompletion(service.id, !service.is_completed);

    const res = await getJobServices(id);

    setServices(res.data);

  } catch (err) {

    console.log(err);

    alert(
      err.response?.data?.message ||
      "Failed updating service status"
    );

  }

};


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



const handleUpdateComplaint = async (text) => {

  if (isCompleted || text === job.complaint) return;

  try {

    const res = await updateServiceJob(id, { complaint: text });

    setJob(res.data);

  } catch (err) {

    console.log(err);

    alert(err.response?.data?.message || "Failed updating complaint");

  }

};


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
  (partUnitPrice !== "" &&
    (Number(partUnitPrice) <= 0 ||
      Number(partUnitPrice) < Number(selectedPart.buying_price)));


const isCustomPartInvalid =
  !customPartName.trim() ||
  (customPartPrice !== "" && Number(customPartPrice) <= 0);


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

if (customPartPrice !== "" && Number(customPartPrice) <= 0) {
    alert("Price must be greater than 0");
    return;
  }

try{

await addJobPart({

job_id:id,

is_custom:true,

part_name:customPartName.trim(),

part_number:customPartNumber.trim() || null,

unit_price: customPartPrice === "" ? undefined : customPartPrice,

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
if (!selectedPart) return;

if (partUnitPrice !== "") {
  if (Number(partUnitPrice) <= 0) {
    alert("Enter a valid selling price for this part");
    return;
  }
  if (Number(partUnitPrice) < Number(selectedPart.buying_price)) {
    alert(`Selling price cannot be below buying price (KES ${selectedPart.buying_price})`);
    return;
  }
}

try{


await addJobPart({

job_id:id,

sparepart_id:selectedPart.id,

quantity:partQuantity,

unit_price: partUnitPrice === "" ? undefined : partUnitPrice

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


// Small helper for the vehicle/customer detail grid below (screen view) -
// renders a label over a value, falling back to a dash when the backend
// hasn't sent that field. Keeps the job-card grid markup readable.
const DetailField = ({label,value})=>(

<div className="border-b border-slate-300 pb-1">

<p className="text-[10px] uppercase tracking-wide text-slate-400">

{label}

</p>

<p className="text-sm font-medium text-slate-800">

{value || "—"}

</p>

</div>

)


// Same idea as DetailField, but styled as a compact bordered row for the
// print-only job-card replica (label + value side by side, like the
// pre-printed paper form).
const PrintCell = ({label,value,last})=>(

<div className={`px-2 py-1 flex justify-between gap-2 ${last ? "" : "border-b border-black"}`}>

<span className="uppercase text-[9px] text-slate-600">

{label}

</span>

<span className="font-medium">

{value || ""}

</span>

</div>

)


return (


<div ref={printRef} className="bg-white print-root">


{/* Tighter print margins for the native browser Print button. Has no
    effect on the "Download PDF" flow (jsPDF places the full-bleed
    canvas image itself).
    The html/body/#root reset below matters more than it looks: if the
    dashboard's outer layout wrapper (sidebar shell, scroll container,
    etc.) has a fixed height with overflow-y:auto - very common in admin
    layouts - the browser will otherwise only print whatever fit in that
    fixed height, i.e. just page 1, and silently drop everything below
    it. This forces height back to auto and overflow back to visible
    for print so the full multi-page content can flow. If your app's
    root layout uses a different id/class for that scroll container,
    add the same "height: auto; overflow: visible;" override for it
    here too. */}
<style>{`
@media print {
  @page { margin: 10mm; }
  html, body, #root {
    height: auto !important;
    overflow: visible !important;
  }
}
`}</style>


{/* LETTERHEAD */}

<div className="border-b-4 border-slate-900 pb-2 print:border-black doc-header">

<div className="flex justify-between items-start">

<div className="flex items-center gap-3">

<img
  src={WORKSHOP.logo}
  alt={`${WORKSHOP.name} logo`}
  className="h-20 w-auto object-contain print:h-16"
/>

<div>
  <p className="text-xs text-slate-500">{WORKSHOP.addressLine}</p>
  <p className="text-xs text-slate-500">
    Tel: {WORKSHOP.tel} · Email: {WORKSHOP.email}, {WORKSHOP.email2}
  </p>
</div>

</div>

{/* Status pill is a dashboard-only affordance - not part of the
    physical job card, so it's dropped from print/PDF output. */}
<span
  className="
  inline-block
  px-3
  py-1
  rounded-full
  text-xs
  font-semibold
  bg-blue-100
  text-blue-600
  print:hidden
  capture-hide
  "
>
  {job.status}
</span>

</div>

</div>

{/* JOB NUMBER — sits where the estimate's centered "SERVICE ESTIMATE"
    title sits, but left-aligned as requested. */}
<div className="text-left py-2 border-b-2 border-slate-900 print:border-black mb-4">
  <p className="text-[10px] text-slate-400 uppercase print:text-black">Job Number</p>
  <h2 className="text-xl font-extrabold tracking-[3px] text-slate-900">
    {job.job_number}
  </h2>
</div>

<div className="flex gap-2 print:hidden capture-hide mb-4">

<button
  onClick={()=>setShowEstimateModal(true)}
  className="bg-green-600 text-white px-4 py-2 rounded-lg"
>
  Generate Estimate
</button>

<button
  onClick={()=>window.print()}
  className="bg-gray-800 text-white px-4 py-2 rounded-lg"
>
  Print
</button>

<button
  onClick={handleDownloadPdf}
  className="bg-blue-800 text-white px-4 py-2 rounded-lg"
>
  Download PDF
</button>

</div>


{/* PRINT-ONLY JOB CARD - mirrors the physical Rift Motors job card.
    Hidden on screen (Tailwind `hidden`), shown for native printing via
    `print:block`, and forced visible for the "Download PDF" export via
    the `.capture-show` handling in generatePdfBlob's onclone above. */}
<div

ref={cardRef}

className="hidden print:block capture-show text-black"

data-capture-display="block"

>


{/* Customer detail / Deliver to */}

<div className="grid grid-cols-[1fr_260px] border border-black text-xs">


<div className="border-r border-black p-2">

<p className="font-bold uppercase text-[11px] mb-2">

Customer Detail/Contact Address

</p>

<p className="mb-1">{job.customer_name || "—"}</p>

<p className="mb-1">{job.customer_address || ""}</p>

<p>{job.customer_phone || ""}</p>

</div>


<div className="p-2">

<p className="font-bold uppercase text-[11px] mb-2">

Deliver To

</p>

<p className="mb-1">

{job.deliver_to || job.customer_name || "—"}

</p>

<p>

{job.deliver_to_contact || job.customer_phone || ""}

</p>

</div>


</div>

<div className="bg-white p-5 rounded-xl shadow border mb-5 print:hidden capture-hide">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      <FaFileInvoiceDollar className="text-emerald-600" />
      <h2 className="font-bold">Billing</h2>
    </div>
    <button onClick={handleOpenBillToModal} className="text-blue-600 text-sm font-medium">
      {job.bill_to_name ? "Edit" : "Bill to someone else"}
    </button>
  </div>

  {job.bill_to_name ? (
    <div>
      <p className="text-sm font-medium text-slate-800">{job.bill_to_name}</p>
      {job.bill_to_kra_pin && <p className="text-xs text-slate-500">KRA PIN: {job.bill_to_kra_pin}</p>}
      {job.bill_to_customer_id && (
        <p className="text-xs text-emerald-600 mt-1">
          Linked to a customer record — invoices for this job land on their statement.
        </p>
      )}
    </div>
  ) : (
    <p className="text-sm text-slate-500">Billed to {job.customer_name} (the vehicle owner).</p>
  )}
</div>


{/* Registration / vehicle / job meta - 3 columns x 5 rows, same order
    as the pre-printed form. */}

<div className="grid grid-cols-3 border border-t-0 border-black text-xs">


<div className="border-r border-black">

<PrintCell label="Registration No" value={job.registration_number}/>

<PrintCell label="Model" value={`${job.make || ""} ${job.model || ""}`.trim()}/>

<PrintCell label="VIN Number" value={job.vin_no}/>

<PrintCell label="Engine Number" value={job.engine_number}/>

<PrintCell

label="Kilometres"

value={job.mileage != null ? Number(job.mileage).toLocaleString("en-KE") : null}

last

/>

</div>


<div className="border-r border-black">
  <PrintCell label="Date of 1st Reg" value={job.date_of_first_registration}/>
  <PrintCell label="Selling Dealer" value={job.selling_dealer}/>
  <PrintCell label="Contact Person" value={job.driver_name || job.customer_name}/>
  <PrintCell label="Telephone Number" value={job.driver_phone || job.customer_phone}/>
  <PrintCell label="Time Promised" value={job.time_promised} last/>
</div>


<div>

<PrintCell label="Job Number" value={job.job_number}/>

<PrintCell label="Date" value={new Date(job.created_at).toLocaleDateString()}/>

<PrintCell label="Service Advisor" value={job.service_advisor}  value={user?.username}/>

<PrintCell label="Order Number" value={job.order_number}/>

<PrintCell
  label="Technician Assigned"
  value={assignment.length > 0 ? assignment.map(a=>a.name).join(", ") : ""}
  last
/>

</div>


</div>


{/* Type of work table, with damage-marking car diagrams like the
    paper form.
    NOTE: min-h trimmed from 180px -> 130px on these four cells so the
    whole page-1 job card (letterhead through signatures) fits within
    one A4 page after print margins - see the "Solutions" and
    "Comments/Findings" blocks below for the matching trims. */}

<div className="grid grid-cols-[50px_1fr_90px_90px] border border-t-0 border-black text-xs">


<div className="border-r border-black border-b border-black p-1 font-bold uppercase text-[10px]">

Item

</div>

<div className="border-r border-black border-b border-black p-1 font-bold uppercase text-[10px]">

Type of Work

</div>

<div className="border-r border-black border-b border-black p-1 font-bold uppercase text-[10px]">

Flat Rate

</div>

<div className="border-b border-black p-1 font-bold uppercase text-[10px]">

Time Used

</div>


<div className="border-r border-black min-h-[130px]"></div>

<div className="border-r border-black min-h-[130px] p-2 flex flex-col justify-between">

<p className="whitespace-pre-wrap">

{job.complaint || ""}

</p>

<div className="flex gap-3 justify-center mt-4">

<CarSideDiagram/>

<CarFrontDiagram/>

<CarSideDiagram flip/>

<CarFrontDiagram/>

</div>

</div>

<div className="border-r border-black min-h-[130px]"></div>

<div className="min-h-[130px]"></div>


</div>


{/* Tool check box */}

<div className="border border-t-0 border-black p-2 text-xs">

<p className="font-bold uppercase text-[11px] mb-2">

Tool Check Box

</p>

<div className="grid grid-cols-4 gap-2">

{

[
"Jack","W/SP","Tow/R","Jumpers",
"Reflectors","F/A Kit","Fire Ext.","Rubber Mats",
].map(tool=>(

<label key={tool} className="flex items-center gap-2">

<span className="w-3 h-3 border border-black inline-block"></span>

{tool}

</label>

))

}

{

[0,1,2,3].map(blank=>(

<span key={blank} className="w-3 h-3 border border-black inline-block"></span>

))

}

</div>

</div>


{/* Comments / Findings, with the parts-kept declaration alongside it.
    min-h trimmed from 90px -> 60px (see note above the Type of Work
    table). */}

<div className="grid grid-cols-[1fr_220px] border border-t-0 border-black text-xs">


<div

className="border-r border-black p-2 min-h-[60px]"

style={{

backgroundImage:
"repeating-linear-gradient(to bottom, transparent, transparent 17px, #cbd5e1 18px)",

backgroundAttachment:"local",

}}

>

<p className="font-bold uppercase text-[11px] mb-1">

Comments / Findings

</p>

</div>


<div className="p-2">

<p className="mb-2">

The Client wished to keep the replaced parts

</p>

<div className="flex gap-4">

<label className="flex items-center gap-1">

<span className="w-3 h-3 border border-black inline-block"></span>

Yes

</label>

<label className="flex items-center gap-1">

<span className="w-3 h-3 border border-black inline-block"></span>

No

</label>

</div>

</div>


</div>


{/* Solutions - blank ruled space for the technician to write up the
    work done / remedy by hand before the card is filed or handed back
    to the customer. min-h trimmed from 150px -> 110px (see note above
    the Type of Work table) - this is the biggest single contributor to
    reclaiming page-1 space for the signatures. */}

<div className="border border-t-0 border-black p-2 text-xs">

<p className="font-bold uppercase text-[11px] mb-2">

Solutions

</p>

<div

className="min-h-[110px]"

style={{

backgroundImage:
"repeating-linear-gradient(to bottom, transparent, transparent 17px, #cbd5e1 18px)",

backgroundAttachment:"local",

}}

>

</div>

</div>


{/* Authorization line - sits directly above the signatures it refers to. */}

<p className="text-[9px] leading-tight mt-3 border-t border-black pt-2">

I have read and agreed to the terms of business listed overleaf and authorised you to work
accordingly. I acknowledge that cheques can only be accepted by prior arrangement. My attention
is specifically drawn to the notice at reception under the Disposal of Uncollected Goods Act.

</p>


{/* SIGN-OFF - closes out page 1 of the job card, same as the physical
    form. This is the print/PDF version; a separate on-screen-only copy
    further down mirrors it for the dashboard view.
    `avoid-break` (defined in index.css) keeps this block from ever
    being split across a page boundary - if it doesn't fully fit on
    page 1 it will move to page 2 as a whole instead of being cut
    mid-block, but with the min-h trims above it should now fit on
    page 1. */}

<div className="grid grid-cols-3 gap-6 mt-6 pt-4 border-t border-black text-xs avoid-break">

<div>

<div className="border-b border-black h-10"></div>

<p className="text-[9px] uppercase text-slate-600 mt-1">

Customer Signature

</p>

</div>

<div>

<div className="border-b border-black h-10"></div>

<p className="text-[9px] uppercase text-slate-600 mt-1">

Advisor's Signature

</p>

</div>

<div>

<div className="border-b border-black h-10"></div>

<p className="text-[9px] uppercase text-slate-600 mt-1">

Time

</p>

</div>

</div>


</div>


{/* Back of the job card sheet - a big block of static legal text with
    nothing to do with this component's state, so it lives in its own
    file. JobCardTerms manages its own hidden/print:block/capture-show
    visibility and its own break-before-page - termsRef is forwarded
    straight into its root element (see JobCardTerms.jsx) so there's no
    extra wrapper div sitting between the ref and the element that
    actually needs to start on a fresh page. */}
<JobCardTerms ref={termsRef}/>


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
print:hidden
capture-hide
">

This job is marked completed. Services, spare parts and technician
assignment can no longer be modified.

</div>

}



{/* CUSTOMER / DELIVERY / JOB META - dashboard view. The print-only
    replica above covers this content for print/PDF output. */}

<div className="grid md:grid-cols-3 gap-5 mb-5 print:hidden capture-hide">


<div className="bg-white p-5 rounded-xl shadow border">

<div className="flex items-center gap-3 mb-3">

<FaIdCard className="text-slate-500"/>

<h2 className="font-bold">

Customer Detail / Contact Address

</h2>

</div>

<div className="space-y-2">

<DetailField label="Name" value={job.customer_name}/>

<DetailField label="Address" value={job.customer_address}/>

<DetailField label="Telephone Number" value={job.customer_phone}/>

</div>

</div>


<div className="bg-white p-5 rounded-xl shadow border">

<div className="flex items-center gap-3 mb-3">

<FaClipboardList className="text-slate-500"/>

<h2 className="font-bold">

Deliver To

</h2>

</div>

<div className="space-y-2">

<DetailField label="Deliver To" value={job.deliver_to || job.customer_name}/>

<DetailField label="Contact" value={job.deliver_to_contact || job.customer_phone}/>

</div>

</div>


<div className="bg-white p-5 rounded-xl shadow border">

<div className="flex items-center gap-3 mb-3">

<FaClipboardList className="text-slate-500"/>

<h2 className="font-bold">

Job Info

</h2>

</div>

<div className="space-y-2">

<DetailField

label="Date"

value={new Date(job.created_at).toLocaleDateString()}

/>

<DetailField label="Service Advisor" value={job.service_advisor}  value={user?.username}/>

<DetailField label="Order Number" value={job.order_number}/>

<DetailField label="Time Promised" value={job.time_promised}/>

</div>

</div>


</div>



{/* VEHICLE + TECHNICIAN + COMPLAINT - dashboard view. The print-only
    replica above covers vehicle + type-of-work content for print/PDF;
    the "Assigned Technician" panel itself doesn't appear on the
    physical card, so it's dashboard-only. */}

<div className="grid md:grid-cols-3 gap-5 print:hidden capture-hide">


<div className="bg-white p-5 rounded-xl shadow border md:col-span-2">

<div className="flex items-center gap-3 mb-3">

<FaCar className="text-blue-500"/>

<h2 className="font-bold">

Vehicle

</h2>

</div>

<div className="grid md:grid-cols-3 gap-4">

<DetailField label="Make / Model" value={`${job.make || ""} ${job.model || ""}`.trim()}/>

<DetailField label="Registration No" value={job.registration_number}/>

<DetailField label="Date of 1st Reg" value={job.date_of_first_registration}/>

<DetailField label="Selling Dealer" value={job.selling_dealer}/>

<DetailField label="VIN Number" value={job.vin_no}/>

<DetailField label="Engine Number" value={job.engine_number}/>

<DetailField label="Mileage" value={job.mileage != null ? Number(job.mileage).toLocaleString("en-KE") : null}/>

</div>

</div>



<div className="bg-white p-5 rounded-xl shadow border">


<div className="flex items-center gap-3 mb-3">


<FaUserCog className="text-green-500"/>


<h2 className="font-bold">

Assigned Technician

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

Select Technician

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


Assign Technician


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


</div>



{/* TYPE OF WORK / COMPLAINT - dashboard view, covered by the print-only
    Type of Work table above. */}

<div className="bg-white p-5 rounded-xl shadow border mt-5 print:hidden capture-hide">


<div className="flex items-center gap-3 mb-3">


<FaTools className="text-orange-500"/>


<h2 className="font-bold">

Type of Work / Complaint

</h2>


</div>



<div
  contentEditable={!isCompleted}
  suppressContentEditableWarning
  onBlur={(e) => handleUpdateComplaint(e.currentTarget.textContent)}
  className="whitespace-pre-wrap p-2 rounded-lg border border-slate-300 text-sm min-h-[40px]"
>
  {job.complaint || ""}
</div>



</div>



{/* CAUSE / REMEDY - technician's handwritten (or typed) findings.
    These don't appear on the physical job card, so they're dropped
    from print/PDF output, but remain fully editable on screen. */}

<div className="grid md:grid-cols-2 gap-5 mt-5 print:hidden capture-hide">


<div className="bg-white rounded-xl shadow border p-5">

<h2 className="font-bold mb-2">

Cause

</h2>

<p className="text-xs text-slate-400 mb-2 print:hidden capture-hide">

Technician: write the diagnosed cause here.

</p>

<div

contentEditable={!isCompleted}

suppressContentEditableWarning

onBlur={(e)=>setCauseNotes(e.currentTarget.textContent)}

className="
min-h-[120px]
p-3
rounded-lg
border
border-slate-300
text-sm
leading-8
whitespace-pre-wrap
"

style={{

backgroundImage:
"repeating-linear-gradient(to bottom, transparent, transparent 31px, #e2e8f0 32px)",

backgroundAttachment:"local",

}}

>

{causeNotes}

</div>

</div>


<div className="bg-white rounded-xl shadow border p-5">

<h2 className="font-bold mb-2">

Remedy

</h2>

<p className="text-xs text-slate-400 mb-2 print:hidden capture-hide">

Technician: write the work done / remedy here.

</p>

<div

contentEditable={!isCompleted}

suppressContentEditableWarning

onBlur={(e)=>setRemedyNotes(e.currentTarget.textContent)}

className="
min-h-[120px]
p-3
rounded-lg
border
border-slate-300
text-sm
leading-8
whitespace-pre-wrap
"

style={{

backgroundImage:
"repeating-linear-gradient(to bottom, transparent, transparent 31px, #e2e8f0 32px)",

backgroundAttachment:"local",

}}

>

{remedyNotes}

</div>

</div>


</div>








{/* Hidden from the printed/exported job card - this is billing detail
    for the office, not something that belongs on the technician's work
    order. Still fully visible and editable on screen. */}
<div className="grid md:grid-cols-2 gap-5 mt-6 print:hidden capture-hide">



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
  <div key={service.id} className="border rounded-xl p-4 mb-3 bg-slate-50">

    {editingServiceId === service.id ? (
      <div className="flex flex-col gap-2">
        {service.is_custom && (
          <input
            type="text"
            value={editServiceName}
            onChange={(e)=>setEditServiceName(e.target.value)}
            placeholder="Service name"
            className="border rounded-lg p-2"
          />
        )}
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={editServiceQty}
            disabled={service.pricing_type !== "unit" && !service.is_custom}
            onChange={(e)=>setEditServiceQty(e.target.value)}
            placeholder="Quantity"
            className="border rounded-lg p-2 w-1/2"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={editServicePrice}
            onChange={(e)=>setEditServicePrice(e.target.value)}
            placeholder="Price (KES)"
            className="border rounded-lg p-2 w-1/2"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={()=>handleSaveEditService(service)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">
            Save
          </button>
          <button onClick={cancelEditService} className="text-slate-500 text-sm">
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {service.service_name}
            {service.is_custom && <span className="italic text-gray-500 text-sm ml-1">(custom)</span>}
            {!service.is_completed && (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
            )}
            {service.price == null && (
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Awaiting price</span>
            )}
          </h3>

          {!isCompleted && (
            <label className="flex items-center gap-2 text-sm mt-1 text-slate-600 print:hidden capture-hide">
              <input type="checkbox" checked={service.is_completed} onChange={()=>handleToggleServiceCompletion(service)} />
              Marked as done
            </label>
          )}

          <p className="text-sm text-gray-500">Quantity: {service.quantity}</p>
          <p className="text-sm text-gray-500">
            {service.price == null ? "Price not yet set" :
              service.is_custom ? `Price: KES ${service.price}` :
              service.pricing_type === "unit" ? `KES ${service.price} per ${service.unit}` :
              service.pricing_type === "variable" ? `Assessed price: KES ${service.price}` :
              `Fixed price: KES ${service.price}`}
          </p>
        </div>

        <div className="text-right">
          <p className="font-bold text-blue-600">
            KES {service.price != null ? Number(service.price) * Number(service.quantity) : 0}
          </p>

          {!isCompleted && (
            <div className="flex gap-3 justify-end mt-2 print:hidden capture-hide">
              <button onClick={()=>startEditService(service)} className="text-blue-600 text-sm">Edit</button>
              <button onClick={()=>handleDeleteService(service.id)} className="text-red-500 text-sm">Remove</button>
            </div>
          )}
        </div>
      </div>
    )}
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
  <div key={part.id} className="border rounded-xl p-4 mb-3">

    {editingPartId === part.id ? (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={editPartQty}
            onChange={(e)=>setEditPartQty(e.target.value)}
            placeholder="Quantity"
            className="border rounded-lg p-2 w-1/2"
          />
          {!part.customer_supplied && (
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={editPartPrice}
              onChange={(e)=>setEditPartPrice(e.target.value)}
              placeholder="Unit price (KES)"
              className="border rounded-lg p-2 w-1/2"
            />
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>handleSaveEditPart(part)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm">
            Save
          </button>
          <button onClick={cancelEditPart} className="text-slate-500 text-sm">
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="flex justify-between">
        <div>
          <p className="font-semibold">
            {part.name}
            {part.part_number && <span className="text-xs text-gray-400 ml-1">({part.part_number})</span>}
            {part.customer_supplied && <span className="italic text-gray-500 text-sm ml-1">(customer supplied)</span>}
            {part.is_custom && <span className="italic text-gray-500 text-sm ml-1">(custom)</span>}
            {!part.customer_supplied && part.unit_price == null && (
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-1">Awaiting price</span>
            )}
          </p>
          <p className="text-sm text-gray-500">Qty: {part.quantity}</p>
          <p className="text-sm text-gray-500">
            {part.customer_supplied ? "No charge" :
              part.unit_price == null ? "Price not yet set" :
              `Unit price: KES ${part.unit_price}`}
          </p>
          {!part.customer_supplied && !part.is_custom && part.available_stock != null && part.quantity > part.available_stock && (
            <p className="text-red-500 text-sm">Shortage: {part.quantity - part.available_stock} items</p>
          )}
        </div>

        <div className="text-right">
          <p className="font-bold">KES {part.total_price}</p>
          {!isCompleted && (
            <div className="flex gap-3 justify-end mt-2 print:hidden capture-hide">
              <button onClick={()=>startEditPart(part)} className="text-blue-600 text-sm">Edit</button>
              <button onClick={()=>handleDeletePart(part.id)} className="text-red-500 text-sm">Remove</button>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
))


}



</div>






</div>



{/* TOOL CHECK BOX - dashboard view, replaced by the print-only version
    above for print/PDF. */}

<div className="bg-white rounded-xl shadow border p-5 mt-6 print:hidden capture-hide">

<h2 className="font-bold mb-3">

Tool Check Box

</h2>

<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">

{

[
"Jack","W/SP","Tow/R","Jumpers",
"Reflectors","F/A Kit","Fire Ext.","Rubber Mats",
].map(tool=>(

<label key={tool} className="flex items-center gap-2">

<input type="checkbox" disabled={isCompleted}/>

{tool}

</label>

))

}

</div>

</div>



{/* COMMENTS - dashboard view, replaced by the print-only version above
    for print/PDF. */}

<div className="bg-white rounded-xl shadow border p-5 mt-5 print:hidden capture-hide">

<h2 className="font-bold mb-2">

Comments

</h2>

<div

contentEditable={!isCompleted}

suppressContentEditableWarning

className="
min-h-[70px]
p-3
rounded-lg
border
border-slate-300
text-sm
"

>

</div>

</div>





<div className="mt-6 bg-slate-900 text-white rounded-xl p-6 print:hidden capture-hide">


<h2 className="text-xl font-bold">

Job Total

</h2>



<p className="text-3xl font-bold mt-2">

KES {grandTotal}

</p>


</div>



{/* SIGN-OFF - dashboard-only reference copy. The print-only job card
    page above now carries its own signature strip in the same spot it
    appears on the physical form, so this copy is dropped from print/PDF
    output to avoid signatures appearing twice. */}

<div className="grid md:grid-cols-3 gap-6 mt-6 pt-6 border-t print:hidden capture-hide text-sm">

<div>

<div className="border-b border-slate-400 print:border-black h-10"></div>

<p className="text-xs text-slate-400 mt-1">

Customer Signature

</p>

</div>

<div>

<div className="border-b border-slate-400 print:border-black h-10"></div>

<p className="text-xs text-slate-400 mt-1">

Advisor's Signature

</p>

</div>

<div>

<div className="border-b border-slate-400 print:border-black h-10"></div>

<p className="text-xs text-slate-400 mt-1">

Time

</p>

</div>

<div className="doc-logos-sm flex justify-center items-center gap-6 mt-4 hidden print:flex capture-show" data-capture-display="flex">
  <img src="/brands/nissan.png" alt="Nissan" className="h-6 object-contain" />
  <img src="/brands/ford.jpg" alt="Ford" className="h-6 object-contain" />
  <img src="/brands/subaru.jpg" alt="Subaru" className="h-6 object-contain" />
</div>

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

{showBillToModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 print:hidden capture-hide">
    <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-bold mb-2">Bill To</h2>
      <p className="text-sm text-slate-500 mb-4">
        Leave blank to bill {job.customer_name} directly. Otherwise pick who's actually
        paying — an insurer, employer, etc — so invoices for this job land on their
        statement instead.
      </p>

      <label className="text-sm">Existing Customer</label>
      <select value={billToCustomerId} onChange={handleBillToCustomerSelect} className="w-full border rounded-lg p-2 mb-2">
        <option value="">Type manually / not in system</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <label className="text-sm">Bill To Name</label>
      <input type="text" value={billToName} onChange={(e)=>setBillToName(e.target.value)}
        placeholder="Leave blank to bill the customer directly"
        className="w-full border rounded-lg p-2 mb-4" />

      <label className="text-sm">Bill To KRA Pin</label>
      <input type="text" value={billToKraPin} onChange={(e)=>setBillToKraPin(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4" />

      <div className="flex justify-end gap-3">
        <button onClick={()=>setShowBillToModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={handleSaveBillTo} disabled={savingBillTo}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          {savingBillTo ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}



</div>


)



}



export default JobDetails;