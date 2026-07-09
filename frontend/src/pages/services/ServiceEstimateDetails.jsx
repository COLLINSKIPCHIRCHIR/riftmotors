import React,{useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {
getServiceEstimate,
convertServiceEstimate,
updateEstimateItem
} from "../../api/serviceApi";


const ServiceEstimateDetails =()=>{


const {id}=useParams();

const navigate = useNavigate();


const [estimate,setEstimate]=useState(null);

const [adjustments,setAdjustments]=useState({});


useEffect(()=>{


const load=async()=>{

try{

const res =
await getServiceEstimate(id);

setEstimate(res.data);


}catch(err){

console.log(err);

}

}


load();


},[id]);





if(!estimate)

return (
<div className="p-6">
Loading estimate...
</div>
)




const handleConvertInvoice = async()=>{


try{


const res =
await convertServiceEstimate(id);


alert(
"Estimate converted to invoice"
);


navigate(
`/admin/services/invoices/${res.data.invoice.id}`
);


}catch(err){


alert(
err.response?.data?.error ||
"Failed converting invoice"
);


}


}

const handleAdjustmentUpdate = async(itemId)=>{


await updateEstimateItem(

itemId,

adjustments[itemId]

);


const res =
await getServiceEstimate(id);


setEstimate(res.data);


}





return (


<div className="print-container p-6 bg-gray-100 min-h-screen">

<div className="
print-document
max-w-5xl 
mx-auto 
bg-white 
shadow-lg 
rounded-xl 
p-10
">


{/* HEADER */}

<div className="
flex 
justify-between 
items-start
border-b 
pb-6
">


<div className="flex flex-col items-start">


<img
src="/rmotologo.jpg"
className="w-44 h-32 object-contain mb-3"
/>


<div className="text-sm text-gray-600 leading-6">


<p>
Address: Rift Motors, Nakuru, Kenya
</p>


<p>
Phone: +254 712 345 678
</p>


<p>
Email: info@riftmotors.com
</p>


</div>


</div>



<div className="text-right">


<h2 className="text-3xl font-bold text-blue-700">

SERVICE ESTIMATE

</h2>


<p className="mt-2">

Estimate No:
<b>
EST-{estimate.id}
</b>

</p>


<p>

Date:
{new Date(
estimate.created_at
).toLocaleDateString()}

</p>



</div>



</div>







{/* CUSTOMER */}


<div className="mt-8 grid grid-cols-2 gap-6">


<div>


<h3 className="font-bold mb-2">

Bill To

</h3>


<p>
{estimate.customer_name}
</p>


<p>
{estimate.customer_phone}
</p>


</div>



<div className="text-right">


<h3 className="font-bold mb-2">

Status

</h3>


<span className="
px-3 py-1 
rounded-full 
bg-yellow-100 
text-yellow-700
">

{estimate.status}

</span>


</div>


</div>







{/* ACTIONS */}


<div className="
flex 
justify-end 
gap-3 
my-6 
print:hidden
">


<button

onClick={handleConvertInvoice}

disabled={
estimate.status !== "pending"
}

className="
bg-green-600
text-white
px-5
py-2
rounded-lg
disabled:bg-gray-400
">


Convert To Invoice


</button>



<button

onClick={()=>window.print()}

className="
bg-gray-800
text-white
px-5
py-2
rounded-lg
">


Print


</button>


</div>

{
estimate.status==="invoiced" && (

<div className="
bg-blue-100
text-blue-700
p-3
rounded
mb-5
">

This estimate has been converted to invoice and can no longer be edited.

</div>

)

}







{/* ITEMS */}


<table className="
w-full 
border
">


<thead className="bg-gray-100">


<tr>


<th className="p-3 text-left">

Description

</th>


<th className="p-3 text-left">

Type

</th>


<th className="p-3 text-left">

Qty

</th>


<th className="p-3 text-left">

Price

</th>


<th className="p-3 text-left">

Total

</th>


</tr>


</thead>



<tbody>


{
estimate.items?.map(item=>(


<tr 
key={item.id}
className="border-t"
>


<td className="p-3">

{item.description}

</td>


<td>

{item.item_type}

</td>


<td>

{item.quantity}

</td>


<td>

KES {item.unit_price}

</td>


<td className="p-3">


<div className="text-sm text-gray-500">

Original:
KES {item.original_price}

</div>



{
item.item_type==="service" && 
estimate.status==="pending" && (

<div className="mt-2">


<label className="text-xs text-gray-500">

Discount / Reduction

</label>


<div className="flex gap-2">


<input

type="number"

value={
adjustments[item.id]?.adjustment ??
item.adjustment ??
""
}


onChange={(e)=>

setAdjustments({

...adjustments,

[item.id]:{

...adjustments[item.id],

adjustment:Number(e.target.value)

}

})

}


className="
border
rounded
p-2
w-24
"

/>



<button

onClick={()=>
handleAdjustmentUpdate(item.id)
}

className="
bg-blue-600
text-white
rounded
px-3
"

>

Apply

</button>


</div>


</div>

)

}

{
item.item_type==="sparepart" &&
estimate.status==="pending" && (

<div>

<label>
Discount
</label>


<select
onChange={(e)=>

setAdjustments({

...adjustments,

[item.id]:{

...adjustments[item.id],

discount_type:e.target.value

}

})

}
>

<option value="amount">
KES
</option>

<option value="percentage">
%
</option>


</select>



<input

type="number"

value={
adjustments[item.id]?.discount_value ?? ""
}

onChange={(e)=>

setAdjustments({

...adjustments,

[item.id]:{

...adjustments[item.id],

discount_value:Number(e.target.value)

}

})

}

/>


<button

onClick={()=>handleAdjustmentUpdate(item.id)}

>

Apply

</button>


</div>


)

}



<p className="mt-2">

Adjustment:

KES {item.adjustment}

</p>



<p className="font-bold">

Final:

KES {item.total_price}

</p>



</td>


</tr>


))

}


</tbody>


</table>









{/* TOTAL */}


<div className="
flex 
justify-end 
mt-8
">


<div className="w-64">


<div className="flex justify-between">

<span>
Subtotal
</span>


<b>
KES {estimate.subtotal}
</b>

</div>



{/*<div className="flex justify-between">

<span>
Adjustments
</span>


<b>
KES {
estimate.items?.reduce(
(total,item)=>
total + Number(item.adjustment || 0),
0
)

}

</b>


</div>*/}

<div className="flex justify-between">

<span>
Tax ({estimate.tax_rate}%)
</span>


<b>
KES {estimate.tax_amount}
</b>

</div>



<hr className="my-3"/>


<div className="
flex 
justify-between 
text-xl
">


<span>
TOTAL
</span>


<b>

KES {estimate.total}

</b>


</div>



</div>


</div>








{/* FOOTER */}


<div className="
mt-10 
text-center 
text-sm 
text-gray-500
border-t
pt-4
">


Thank you for choosing Rift Motors.

<br/>

This estimate is valid before confirmation and invoice generation.


</div>



</div>



</div>


)


}


export default ServiceEstimateDetails;