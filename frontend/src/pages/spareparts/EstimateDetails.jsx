import React,{useEffect,useState} from "react";
import {useParams,useNavigate} from "react-router-dom";
import API from "../../api/api";


export default function EstimateDetails(){


const {id}=useParams();

const navigate=useNavigate();


const [estimate,setEstimate]=useState(null);



useEffect(()=>{


const load=async()=>{

const res =
await API.get(`/estimates/${id}`);

setEstimate(res.data);

}


load();


},[id]);



if(!estimate)

return <div className="p-6">
Loading estimate...
</div>



const convertToInvoice=async()=>{


try{


const res =
await API.post(`/estimates/${id}/convert`);


navigate(
`/admin/spare-parts/invoices/${res.data.invoice.id}`
);


}catch(err){

alert(
err.response?.data?.error ||
"Conversion failed"
)

}


}





return (

<div className="
p-6
bg-gray-100
min-h-screen
print-container
">


<div className="
max-w-5xl
mx-auto
bg-white
shadow-xl
rounded-xl
p-10
print-document
">



{/* HEADER */}

<div className="
flex
justify-between
border-b
pb-6
">


<div>


<img

src="/rmotologo.jpg"

className="w-44 h-32 object-contain"

 />


<p>
Rift Motors
</p>


<p>
Nakuru, Kenya
</p>


<p>
Phone: +254712345678
</p>


</div>





<div className="text-right">


<h2 className="
text-3xl
font-bold
text-blue-700
">

ESTIMATE

</h2>


<p className="mt-3">

Estimate No:

<b>
EST-{estimate.id}
</b>

</p>


<p>

Date:

{
new Date(
estimate.created_at
).toLocaleDateString()

}

</p>


</div>



</div>






{/* CUSTOMER */}


<div className="
grid
grid-cols-2
mt-8
">


<div>


<h3 className="font-bold">

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


<h3 className="font-bold">

Status

</h3>


<span className="
bg-yellow-100
text-yellow-700
px-3
py-1
rounded-full
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

{
estimate.status==="pending" &&

<button

onClick={()=>navigate(
`/admin/spare-parts/estimates/${estimate.id}/edit`
)}

className="
bg-yellow-600
text-white
px-5
py-2
rounded
"

>

Edit

</button>

}


{
estimate.status==="pending" &&

<button

onClick={convertToInvoice}

className="
bg-green-600
text-white
px-5
py-2
rounded
"

>

Convert To Invoice

</button>

}


<button

onClick={()=>window.print()}

className="
bg-gray-800
text-white
px-5
py-2
rounded
"

>

Print

</button>



</div>







{/* ITEMS */}



<table className="
w-full
border
">


<thead className="bg-gray-100">


<tr>


<th className="p-3 text-left">
Part
</th>


<th className="p-3">
Part No
</th>


<th>
Qty
</th>


<th>
Price
</th>


<th>
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

{item.name}

</td>


<td>

{item.part_number}

</td>


<td>

{item.quantity}

</td>


<td>

KES {item.unit_price}

</td>


<td className="font-bold">

KES {item.total}

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


<div className="w-72">


<div className="flex justify-between">

<span>
Subtotal
</span>

<b>
KES {Number(estimate.subtotal).toFixed(2)}
</b>

</div>



<div className="flex justify-between">

<span>
Discount
</span>

<b>
KES {Number(estimate.discount).toFixed(2)}
</b>

</div>



<div className="flex justify-between">

<span>
VAT ({estimate.tax_rate}%)
</span>


<b>
KES {Number(estimate.tax_amount).toFixed(2)}
</b>


</div>



<hr className="my-3"/>



<div className="
flex
justify-between
text-xl
font-bold
">


<span>
TOTAL
</span>


<span>

KES {Number(estimate.total).toFixed(2)}

</span>


</div>


</div>


</div>







<div className="
mt-10
text-center
border-t
pt-4
text-sm
text-gray-500
">


Thank you for choosing Rift Motors.


</div>






</div>


</div>


)



}