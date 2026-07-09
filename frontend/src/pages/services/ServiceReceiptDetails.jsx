import React,{useEffect,useState} from "react";

import {
useParams
}
from "react-router-dom";


import {
getServiceReceipt
}
from "../../api/serviceApi";





const ServiceReceiptDetails=()=>{


const {id}=useParams();


const [receipt,setReceipt]=useState(null);




useEffect(()=>{


const load=async()=>{


try{


const res =
await getServiceReceipt(id);


setReceipt(res.data);


}catch(err){

console.log(err);

}


};



load();


},[id]);







if(!receipt)

return (

<div className="p-6">

Loading receipt...

</div>

)








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
rounded-xl
shadow-lg
p-10
print-document
">






{/* HEADER */}


<div className="
flex
justify-between
items-start
border-b
pb-6
">





<div className="flex flex-col">



<img

src="/rmotologo.jpg"

className="
w-44
h-32
object-contain
mb-3
"

/>




<div className="
text-sm
text-gray-600
leading-6
">


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



<h2 className="
text-3xl
font-bold
text-blue-700
">

SERVICE RECEIPT

</h2>




<p className="mt-3">

Receipt No:

<b>

{receipt.receipt_number}

</b>

</p>



<p>

Date:

{
new Date(
receipt.created_at
).toLocaleDateString()
}

</p>




</div>





</div>









{/* CUSTOMER DETAILS */}


<div className="
mt-8
grid
grid-cols-2
gap-6
">





<div>



<h3 className="
font-bold
mb-2
">

Received From

</h3>



<p>

{receipt.customer_name}

</p>



<p>

{receipt.customer_phone}

</p>



</div>







<div className="text-right">



<h3 className="
font-bold
mb-2
">

Payment Method

</h3>




<span className="
px-3
py-1
rounded-full
bg-green-100
text-green-700
">


{receipt.payment_method}


</span>



</div>






</div>









{/* PRINT BUTTON */}


<div className="
flex
justify-end
my-6
print:hidden
">



<button


onClick={()=>window.print()}


className="
bg-gray-800
text-white
px-5
py-2
rounded-lg
"


>


Print


</button>



</div>









{/* ITEMS TABLE */}



<table className="
w-full
border
">



<thead className="bg-gray-100">


<tr>



<th className="
p-3
text-left
">


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


receipt.items?.map(item=>(


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





<td>

<div>
Original:
KES {item.original_price}
</div>


{
item.adjustment > 0 &&
<div>
Reduction:
KES {item.adjustment}
</div>
}


{
item.discount_value > 0 &&
<div>

Discount:

{
item.discount_type==="percentage"
?
`${item.discount_value}%`
:
`KES ${item.discount_value}`
}

</div>

}


<b>
Final:
KES {item.total_price}
</b>


</td>





</tr>



))


}




</tbody>




</table>









{/* TOTALS */}



<div className="
flex
justify-end
mt-8
">





<div className="w-64">





<div className="
flex
justify-between
">


<span>

Subtotal

</span>



<b>

KES {receipt.subtotal}

</b>



</div>








<div className="
flex
justify-between
">


{/*<div className="flex justify-between">

<span>
Discount
</span>

<b>

{
receipt.discount_type==="percentage"
?
`${receipt.discount_value}%`
:
`KES ${receipt.discount_value}`
}

</b>

</div>*/}


{/*<div className="flex justify-between">

<span>
Discount Amount
</span>

<b>
KES {receipt.discount}
</b>

</div>*/}



</div>

<div className="
flex
justify-between
">

<span>
VAT ({receipt.tax_rate}%)
</span>

<b>
KES {receipt.tax_amount}
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



<b>

KES {receipt.total}

</b>



</div>







</div>






</div>









{/* FOOTER */}



<div className="
mt-10
border-t
pt-4
text-center
text-sm
text-gray-500
">



Thank you for choosing Rift Motors.



<br/>


Payment received successfully.



</div>








</div>





</div>



)



}




export default ServiceReceiptDetails;