import React,{useEffect,useState} from "react";
import {
getServiceJobs,
getCustomerVehicles,
createServiceJob
} from "../../api/serviceApi";
import API from "../../api/api";

import {Link} from "react-router-dom";



const ServiceJobs=()=>{


const [jobs,setJobs]=useState([]);

const [vehicles,setVehicles]=useState([]);

const [vehicleSearch,setVehicleSearch]=useState("");

const [showVehicleDropdown,setShowVehicleDropdown]=useState(false);

const [customers,setCustomers]=useState([]);


const [showModal,setShowModal]=useState(false);


const [error,setError]=useState("");

const [saving,setSaving]=useState(false);

const [search,setSearch]=useState("");

const [loadingJobs,setLoadingJobs]=useState(false);



const [form,setForm]=useState({
  job_number:"",
  vehicle_id:"",
  driver_name:"",
  driver_phone:"",
  bill_to_customer_id:"",
  bill_to_name:"",
  bill_to_kra_pin:"",
  complaint:"",
  notes:""
});




useEffect(()=>{

loadJobs();
loadVehicles();
loadCustomers();

},[])



// DEBOUNCED SEARCH - refetch from backend 350ms after typing stops
useEffect(()=>{

const timer = setTimeout(()=>{

loadJobs(search);

},350);

return ()=>clearTimeout(timer);

// eslint-disable-next-line react-hooks/exhaustive-deps
},[search])





const loadJobs=async(searchTerm)=>{

setLoadingJobs(true);

try{

const res=await getServiceJobs(searchTerm);

setJobs(res.data);


}catch(err){

console.log(err);

}finally{

setLoadingJobs(false);

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

const filteredVehicles = vehicles.filter(v => {

  const searchTerm = vehicleSearch.toLowerCase().trim();

  if(!searchTerm) return true;

  return (
    (v.registration_number || "").toLowerCase().includes(searchTerm) ||
    (v.make || "").toLowerCase().includes(searchTerm) ||
    (v.model || "").toLowerCase().includes(searchTerm)
  );

});

const loadCustomers=async()=>{

try{

const res=await API.get("/customers");

setCustomers(res.data);

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

// Selecting an existing customer as the bill-to party auto-fills the
// text fields (what the invoice will actually print) but leaves them
// editable — the link (bill_to_customer_id) is what drives statements/360,
// the text is just what shows on paper. Clearing the dropdown back to
// "Type manually / none" drops the link but keeps whatever text was
// typed, for one-off payers who aren't in the system yet.
const handleBillToCustomerSelect=(e)=>{

  const selectedId = e.target.value;
  const selected = customers.find(c=>c.id==selectedId);

  setForm({
    ...form,
    bill_to_customer_id: selectedId,
    bill_to_name: selected ? selected.name : form.bill_to_name,
    bill_to_kra_pin: selected ? (selected.kra_pin || "") : form.bill_to_kra_pin
  });

}





const submitJob=async()=>{


if(!form.job_number.trim()){

setError("Job number is required");

return;

}


if(!form.vehicle_id){

setError("Select a vehicle");

return;

}


setError("");

setSaving(true);


try{


const data={
  job_number: form.job_number.trim(),
  customer_id: vehicles.find(v=>v.id==form.vehicle_id)?.customer_id,
  vehicle_id: form.vehicle_id,
  driver_name: form.driver_name.trim() || null,
  driver_phone: form.driver_phone.trim() || null,
  bill_to_customer_id: form.bill_to_customer_id || null,
  bill_to_name: form.bill_to_name.trim() || null,
  bill_to_kra_pin: form.bill_to_kra_pin.trim() || null,
  complaint: form.complaint,
  notes: form.notes,
  status:"Pending",
  created_by: 1
};



await createServiceJob(data);



setShowModal(false);



setForm({
  job_number:"",
  vehicle_id:"",
  driver_name:"",
  driver_phone:"",
  bill_to_customer_id:"",
  bill_to_name:"",
  bill_to_kra_pin:"",
  complaint:"",
  notes:""
});



loadJobs(search);



}catch(err){

console.log(err);

setError(

err.response?.data?.message ||

"Failed creating job"

);


}finally{

setSaving(false);

}



}





return (


<div>



<div className="flex justify-between items-center mb-6">


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



{/* SEARCH BAR */}

<div className="mb-4">

<input

type="text"

value={search}

onChange={(e)=>setSearch(e.target.value)}

placeholder="Search by job number, registration, or customer..."

className="
w-full
max-w-md
border
rounded-lg
p-2
text-sm
"

/>

</div>







<div className="
bg-white
rounded-xl
shadow
border
overflow-hidden
">



<table className="w-full text-sm table-fixed">


<thead className="bg-slate-50 border-b">


<tr>


<th className="p-4 text-left w-1/5">
Job Number
</th>


<th className="p-4 text-left w-1/5">
Registration
</th>


<th className="p-4 text-left w-1/4">
Vehicle
</th>


<th className="p-4 text-left w-1/6">
Status
</th>


<th className="p-4 text-left w-1/6">
Date
</th>


<th className="p-4 text-left w-1/6">
Action
</th>


</tr>


</thead>





<tbody>


{
loadingJobs && (

<tr>

<td colSpan="6" className="p-6 text-center text-slate-400">

Loading...

</td>

</tr>

)

}



{
!loadingJobs && jobs.map(job=>(


<tr
key={job.id}
className="border-b hover:bg-slate-50"
>


<td className="p-4 font-medium">

{job.job_number}

</td>




<td className="p-4">

{job.registration_number}

</td>




<td className="p-4 text-slate-500">


{job.make}
{" "}
{job.model}


</td>





<td className="p-4">


<span
className="
px-3
py-1
rounded-full
text-xs
bg-yellow-100
text-yellow-700
whitespace-nowrap
"
>


{job.status}


</span>


</td>





<td className="p-4">

{
new Date(job.created_at)
.toLocaleDateString()

}


</td>





<td className="p-4">


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



{
!loadingJobs && jobs.length === 0 && (

<tr>

<td colSpan="6" className="p-6 text-center text-slate-400">

No jobs found

</td>

</tr>

)

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
  max-h-[90vh]
  overflow-y-auto
  "
>


<h2 className="text-xl font-bold mb-5">

Create Service Job

</h2>




<label className="text-sm">

Job Number

</label>



<input

type="text"

name="job_number"

value={form.job_number}

onChange={handleChange}

placeholder="e.g. JOB-2026-014"

className="
w-full
border
rounded-lg
p-2
mb-4
"

/>






<label className="text-sm">
  Customer Vehicle
</label>

<div className="relative mb-4">

  {/* Search / selected vehicle input */}
  <input
    type="text"
    value={
      form.vehicle_id
        ? (() => {
            const selectedVehicle = vehicles.find(
              v => v.id == form.vehicle_id
            );

            return selectedVehicle
              ? `${selectedVehicle.registration_number} - ${selectedVehicle.make} ${selectedVehicle.model}`
              : "";
          })()
        : vehicleSearch
    }
    onChange={(e) => {

      setVehicleSearch(e.target.value);
      setShowVehicleDropdown(true);

      // Clear selected vehicle when user starts searching
      if(form.vehicle_id){

        setForm({
          ...form,
          vehicle_id:""
        });

      }

    }}
    onFocus={() => setShowVehicleDropdown(true)}
    placeholder="Search registration, make or model..."
    className="
      w-full
      border
      rounded-lg
      p-2
      pr-10
    "
  />

  {/* Clear selected vehicle */}
  {form.vehicle_id && (

    <button
      type="button"
      onClick={() => {

        setForm({
          ...form,
          vehicle_id:""
        });

        setVehicleSearch("");
        setShowVehicleDropdown(true);

      }}
      className="
        absolute
        right-3
        top-2
        text-slate-400
        hover:text-red-500
        text-lg
      "
    >
      ×
    </button>

  )}

  {/* Vehicle dropdown */}
  {showVehicleDropdown && !form.vehicle_id && (

    <div
      className="
        absolute
        z-50
        left-0
        right-0
        mt-1
        bg-white
        border
        rounded-lg
        shadow-lg
        max-h-60
        overflow-y-auto
      "
    >

      {filteredVehicles.length > 0 ? (

        filteredVehicles.map(v => (

          <button
            type="button"
            key={v.id}
            onClick={() => {

              setForm({
                ...form,
                vehicle_id:v.id
              });

              setVehicleSearch("");
              setShowVehicleDropdown(false);

            }}
            className="
              w-full
              text-left
              px-3
              py-2
              hover:bg-slate-100
              border-b
              last:border-b-0
            "
          >

            <div className="font-medium text-slate-800">
              {v.registration_number}
            </div>

            <div className="text-xs text-slate-500">
              {v.make} {v.model}
            </div>

          </button>

        ))

      ) : (

        <div className="p-3 text-sm text-slate-400">
          No vehicles found
        </div>

      )}

    </div>

  )}

</div>


<label className="text-sm">
  Driver Name (if different from billing customer)
</label>
<input
  type="text"
  name="driver_name"
  value={form.driver_name}
  onChange={handleChange}
  placeholder="e.g. John Mwangi"
  className="w-full border rounded-lg p-2 mb-4"
/>

<label className="text-sm">
  Driver Phone
</label>
<input
  type="text"
  name="driver_phone"
  value={form.driver_phone}
  onChange={handleChange}
  placeholder="e.g. 0712345678"
  className="w-full border rounded-lg p-2 mb-4"
/>


<label className="text-sm">
  Bill To (only if someone else is paying — e.g. an insurer or company)
</label>
<select
  value={form.bill_to_customer_id}
  onChange={handleBillToCustomerSelect}
  className="w-full border rounded-lg p-2 mb-2"
>
  <option value="">Type manually / not in system</option>
  {customers.map(c=>(
    <option key={c.id} value={c.id}>{c.name}</option>
  ))}
</select>
<p className="text-xs text-slate-400 mb-2">
  Picking a customer here links this job's invoices to their statement.
  Leave as "Type manually" if the payer isn't registered as a customer —
  the text below still prints on the invoice either way.
</p>
<input
  type="text"
  name="bill_to_name"
  value={form.bill_to_name}
  onChange={handleChange}
  placeholder="e.g. Fidelity Insurance"
  className="w-full border rounded-lg p-2 mb-4"
/>

<label className="text-sm">
  Bill To KRA Pin
</label>
<input
  type="text"
  name="bill_to_kra_pin"
  value={form.bill_to_kra_pin}
  onChange={handleChange}
  placeholder="e.g. P051234567X"
  className="w-full border rounded-lg p-2 mb-4"
/>




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



{

error &&

<p className="text-red-500 text-sm mb-4">

{error}

</p>

}





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

disabled={saving}

className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
disabled:opacity-50
"

>

{saving ? "Creating..." : "Create Job"}

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