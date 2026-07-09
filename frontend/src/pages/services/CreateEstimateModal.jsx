import React,{useState} from "react";


const CreateEstimateModal = ({
onClose,
onSubmit,
jobId
})=>{


const [taxRate,setTaxRate]=useState(16);



const handleSubmit=(e)=>{

e.preventDefault();


onSubmit({

job_id:jobId,

tax_rate:Number(taxRate)

});


}




return (

<div className="
fixed
inset-0
bg-black/50
flex
items-center
justify-center
z-50
">


<div className="
bg-white
rounded-xl
shadow-lg
p-6
w-96
">


<h2 className="text-xl font-bold mb-5">

Create Service Estimate

</h2>


<form onSubmit={handleSubmit}>


<label className="block mb-2">

Tax Rate (%)

</label>


<input

type="number"

value={taxRate}

onChange={(e)=>
setTaxRate(e.target.value)
}

className="
border
w-full
p-2
rounded
mb-5
"

/>



<div className="flex justify-end gap-3">


<button

type="button"

onClick={onClose}

className="px-4 py-2 bg-gray-300 rounded"

>

Cancel

</button>



<button

className="
px-4
py-2
bg-green-600
text-white
rounded
"

>

Create Estimate

</button>


</div>


</form>


</div>


</div>


)

}


export default CreateEstimateModal;