const PrintDocument = ({
title,
number,
customer,
children,
totals
})=>{


return (

<div className="print-container">


<div className="
print-document
">


<div className="text-center">


<img
src="/rmotologo.jpg"
className="
w-40
mx-auto
mb-3
"
/>



<p>
Rift Motors, Nakuru, Kenya
</p>

<p>
+254 712 345 678
</p>


<p>
info@riftmotors.com
</p>


</div>



<hr/>




<h1 className="text-center font-bold">

{title}

</h1>


<p>
No: {number}
</p>


<p>
Customer: {customer}
</p>



{children}



{totals}



<p className="
text-center
text-sm
mt-5
">

Thank you for choosing Rift Motors

</p>



</div>


</div>

)


}


export default PrintDocument;