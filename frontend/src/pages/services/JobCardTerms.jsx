import React from "react";

// Printed "Terms of Business" page - mirrors the back side of the
// physical Rift Motors job card sheet. This is rendered inside the same
// printRef container as JobDetails so it's captured by both the native
// browser Print button and the "Download PDF" export, but it never
// shows up on screen (`hidden print:block`) and always starts on a
// fresh page (`break-before-page`) so it lands on the back of the job
// card rather than directly underneath it.
//
// Kept in its own file on purpose - this is a big static block of text
// that has nothing to do with JobDetails' state/logic, so it doesn't
// belong bloating that file.

const WORKSHOP = {
 name: "RIFT MOTORS LIMITED",
 addressLine: "KFA Showground Road P.O. Box 18962-20100 Nakuru - Kenya",
 tel: "0790406996",
 email: "info@riftmotors.com",
 email2: "riftmotorsltd@gmail.com",
};

const TERMS = [
 `Estimate are based on the current costs to the company of labour, materials and spare parts. In the event of any increase in such costs the company reserves the right to charge such increases to the customer. Any such increase exceeding 10% of the original estimate will be notified to the customer.`,
 `Only the work described overleaf and any work reasonably incidental thereto will be done. Any additional work will only be carried out on the express instructions of the customer and will be charged in addition to any estimate given and on the terms and conditions here set out.`,
 `The company is entitled to charge its usual storage fees for any period during which a vehicle is on the company's premises, though where a vehicle is collected within 3 days of notice that the vehicle is ready no charge for garaging will be made.`,
 `The company will use its best endeavours to complete work within the time agreed but it is not liable for any loss or damage howsoever arising, occasioned directly or indirectly by delay.`,
 `All work carried out must be paid for in cash against delivery unless otherwise agreed in writing by the company, but the company reserves the right to demand a deposit before commencing or continuing any work.`,
 `The company is not liable for any loss or damage howsoever arising to the vehicle or its contents whilst in the custody of the company.`,
 `When any servant or agent of the company drives a customer's vehicle, he does so only as agent of the customer and the customer is deemed to have authorised the vehicle to be so driven. Under no circumstances is such servant or agent permitted to drive a customer's vehicle otherwise than as his agent.`,
 `The company assigns to the customer all rights in any warranty given by the manufacturer of any spare parts used, and the company is under no further or other obligation to the customer except as set out in these terms and conditions.`,
 `The company will only sub-contract any work as agent for the customer and accepts no liability whatsoever for such sub-contracted work.`,
 `The company may cancel all or any part of the work to be done if it is prevented by reason of strike, riot, accident, fire, earthquake, war, government restrictions or licences, quotas, exchange control restriction, or any other circumstance beyond the control of the company.`,
 `Any part replaced by the company in the course of repairs shall, wherever possible, be returned at the time of delivery of the vehicle, but in any case where not claimed by the customer within 14 days after such delivery it shall become the company's absolute property.`,
 `Unless otherwise agreed in writing by the company, these terms and conditions override any other terms and conditions expressed or implied, whether in any negotiations or in any statute, common law or otherwise, and such other terms and conditions are hereby excluded and negated.`,
 `If the customer's indebtedness to the company is not satisfied within the time provided, the company may - having submitted notice in writing to the last known address - dispose of the vehicle and its contents as provided for under the terms of the Disposal of Uncollected Goods Act, 1987.`,
];

const JobCardTerms = React.forwardRef((props, ref) => (

<div

ref={ref}

className="hidden print:block capture-show break-before-page text-black"

data-capture-display="block"

// Tailwind's break-before-page sets the modern `break-before: page`,
// but some print engines/preview modes still only honour the legacy
// `page-break-before`. Setting both here (rather than relying on the
// class alone) is what actually makes this reliably start on its own
// page instead of trailing onto the bottom of page 1.
style={{ breakBefore: "page", pageBreakBefore: "always" }}

>

<div className="text-center mb-4" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>

<h2 className="font-bold text-sm uppercase tracking-wide">

Terms of Business

</h2>

<p className="text-xs mt-1">

{WORKSHOP.name}, {WORKSHOP.addressLine}

</p>

<p className="text-xs">

Tel: {WORKSHOP.tel} Email: {WORKSHOP.email}, {WORKSHOP.email2}

</p>

</div>

<ol className="text-[10px] leading-snug space-y-2 list-decimal list-outside pl-4">

{TERMS.map((clause, index) => (

<li key={index}>

{clause}

</li>

))}

</ol>

</div>

))

JobCardTerms.displayName = "JobCardTerms";

export default JobCardTerms;