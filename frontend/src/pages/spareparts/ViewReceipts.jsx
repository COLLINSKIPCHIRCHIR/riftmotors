import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/api";

export default function ViewReceipt() {

  const { id } = useParams();

  const [sale, setSale] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");


  useEffect(() => {

    const loadReceipt = async () => {

      try {

        const res = await API.get(`/spare-sales/${id}/receipt`);

        setSale(res.data);

      } catch(err){

        console.error(err);

      }

    };


    loadReceipt();


  },[id]);




  if(!sale)

  return (

    <div className="p-6">
      Loading receipt...
    </div>

  );





  const money = (value)=>{

    return Number(value || 0)
    .toLocaleString(
      "en-KE",
      {
        minimumFractionDigits:2
      }
    );

  };




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





{/* ACTIONS */}

<div className="
flex
justify-end
gap-3
mb-6
print:hidden
">


<button

onClick={()=>window.history.back()}

className="
bg-gray-600
text-white
px-5
py-2
rounded
"

>

Back

</button>



<button

onClick={()=>window.print()}

className="
bg-blue-600
text-white
px-5
py-2
rounded
"

>

Print Receipt

</button>



</div>







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

className="
w-44
h-32
object-contain
"

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



<h2

className="
text-3xl
font-bold
text-blue-700
"

>

RECEIPT

</h2>



<p className="mt-3">

Receipt No:

<b>
 {sale.receipt_number}
</b>

</p>




<p>

Date:

{
new Date(
sale.sale_date
)
.toLocaleDateString()

}

</p>



<p>

Payment:

<b className="capitalize">

 {sale.payment_method}

</b>


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
{sale.customer_name}
</p>


<p>
{sale.customer_phone}
</p>



</div>





<div className="text-right">


<h3 className="font-bold">

Served By

</h3>


<p>

{user?.username || "Staff"}

</p>


<p>

{user?.role || "cashier"}

</p>


</div>



</div>









{/* ITEMS */}


<table className="
w-full
border
mt-8
">


<thead className="bg-gray-100">


<tr>


<th className="p-3 text-left">

Item

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
sale.items.map(
(item,index)=>(


<tr
key={index}
className="border-t"
>



<td className="p-3">

{item.name}

</td>




<td className="text-center">

{item.quantity}

</td>




<td className="text-right">

Ksh {money(item.unit_price)}

</td>





<td className="text-right font-bold">

Ksh {money(item.total_price)}

</td>




</tr>


)

)

}



</tbody>



</table>









{/* TOTALS */}



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


<span>

Ksh {money(sale.subtotal)}

</span>


</div>





<div className="flex justify-between">


<span>

Discount

</span>


<span>

Ksh {money(sale.discount)}

</span>


</div>







<div className="flex justify-between">


<span>

VAT ({sale.tax_rate || 0}%)

</span>


<span>

Ksh {money(sale.tax_amount)}

</span>



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

Ksh {money(sale.total)}

</span>



</div>



</div>



</div>









{/* FOOTER */}



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


<style>

{`

@media print {

body{

background:white;

}


.print:hidden{

display:none;

}


}

`}


</style>



</div>



);


}