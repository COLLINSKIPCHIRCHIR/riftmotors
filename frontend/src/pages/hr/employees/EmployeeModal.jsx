import { useEffect, useState } from "react";
import {
  FaUser,
  FaPhoneAlt,
  FaBriefcase,
  FaUniversity,
  FaIdCard,
  FaTimes,
  FaCamera,
} from "react-icons/fa";

const initialState = {
  employee_number: "",
  user_id: "",

  branch_id: "",
  department_id: "",

  first_name: "",
  last_name: "",

  gender: "Male",

  date_of_birth: "",

  national_id: "",

  kra_pin: "",

  nssf_number: "",

  shif_number: "",

  phone: "",

  email: "",

  address: "",

  county: "",

  job_title: "",

  employment_type: "Permanent",

  employment_date: "",

  probation_end_date: "",

  termination_date: "",

  employment_status: "Active",

  payment_frequency: "Monthly",

  bank_name: "",

  bank_account_number: "",

  photo_url: "",
};

export default function EmployeeModal({
  employee,
  departments,
  branches,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(initialState);

  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (employee) {
      setForm({
        ...initialState,
        ...employee,
      });

      setPhotoPreview(employee.photo_url || "");
    } else {
      setForm(initialState);
      setPhotoPreview("");
    }
  }, [employee]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setForm({
      ...form,
      photo_url: file,
    });

    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = (e) => {
    e.preventDefault();

    onSave(form);
  };

  const inputClass =
    "w-full h-11 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const selectClass =
    "w-full h-11 rounded-xl border border-slate-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  const sectionClass =
    "bg-white border border-slate-200 rounded-2xl p-6 shadow-sm";

  const labelClass =
    "block mb-1 text-sm font-medium text-slate-700";

  const required = (
    <span className="text-red-500 ml-1">*</span>
  );

  const kenyaCounties = [
    "Baringo",
    "Bomet",
    "Bungoma",
    "Busia",
    "Elgeyo Marakwet",
    "Embu",
    "Garissa",
    "Homa Bay",
    "Isiolo",
    "Kajiado",
    "Kakamega",
    "Kericho",
    "Kiambu",
    "Kilifi",
    "Kirinyaga",
    "Kisii",
    "Kisumu",
    "Kitui",
    "Kwale",
    "Laikipia",
    "Lamu",
    "Machakos",
    "Makueni",
    "Mandera",
    "Marsabit",
    "Meru",
    "Migori",
    "Mombasa",
    "Murang'a",
    "Nairobi",
    "Nakuru",
    "Nandi",
    "Narok",
    "Nyamira",
    "Nyandarua",
    "Nyeri",
    "Samburu",
    "Siaya",
    "Taita Taveta",
    "Tana River",
    "Tharaka Nithi",
    "Trans Nzoia",
    "Turkana",
    "Uasin Gishu",
    "Vihiga",
    "Wajir",
    "West Pokot",
  ];


  return (
<div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">

<div className="min-h-screen flex items-start justify-center py-10 px-4">

<div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden">

{/* Header */}

<div className="bg-white border-b px-8 py-6 flex items-center justify-between">

<div>

<h2 className="text-3xl font-bold text-slate-800">
{employee ? "Edit Employee" : "Add New Employee"}
</h2>

<p className="text-slate-500 mt-1">
Manage employee personal and employment information.
</p>

</div>

<button
onClick={onClose}
className="w-10 h-10 rounded-full hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center"
>
<FaTimes />
</button>

</div>

<form onSubmit={submit}>

<div className="p-8 space-y-8">

{/* ===========================
PERSONAL INFORMATION
=========================== */}

<div className={sectionClass}>

<div className="flex items-center gap-3 mb-6">

<div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
<FaUser />
</div>

<div>

<h3 className="font-bold text-lg">
Personal Information
</h3>

<p className="text-sm text-slate-500">
Basic employee information
</p>

</div>

</div>

<div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

{/* PHOTO */}

<div className="lg:row-span-2 flex flex-col items-center">

<div className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center">

{photoPreview ? (

<img
src={photoPreview}
alt=""
className="w-full h-full object-cover"
/>

) : (

<div className="text-center">

<div className="text-5xl text-slate-400 mb-2 flex justify-center">
<FaCamera />
</div>

<p className="text-xs text-slate-500">
No Photo
</p>

</div>

)}

</div>

<label className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl cursor-pointer">

Upload Photo

<input
type="file"
hidden
accept="image/*"
onChange={handlePhoto}
/>

</label>

</div>

{/* Employee Number */}

<div>

<label className={labelClass}>
Employee Number {required}
</label>

<input
name="employee_number"
value={form.employee_number}
onChange={handleChange}
className={inputClass}
required
/>

</div>

{/* First Name */}

<div>

<label className={labelClass}>
First Name {required}
</label>

<input
name="first_name"
value={form.first_name}
onChange={handleChange}
className={inputClass}
required
/>

</div>

{/* Last Name */}

<div>

<label className={labelClass}>
Last Name {required}
</label>

<input
name="last_name"
value={form.last_name}
onChange={handleChange}
className={inputClass}
required
/>

</div>

{/* Gender */}

<div>

<label className={labelClass}>
Gender
</label>

<select
name="gender"
value={form.gender}
onChange={handleChange}
className={selectClass}
>

<option>Male</option>

<option>Female</option>

</select>

</div>

{/* DOB */}

<div>

<label className={labelClass}>
Date of Birth
</label>

<input
type="date"
name="date_of_birth"
value={form.date_of_birth || ""}
onChange={handleChange}
className={inputClass}
/>

</div>

{/* National ID */}

<div>

<label className={labelClass}>
National ID
</label>

<input
name="national_id"
value={form.national_id}
onChange={handleChange}
className={inputClass}
/>

</div>

</div>

</div>

{/* ===========================
CONTACT INFORMATION
=========================== */}

<div className={sectionClass}>

<div className="flex items-center gap-3 mb-6">

<div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
<FaPhoneAlt />
</div>

<div>

<h3 className="font-bold text-lg">
Contact Information
</h3>

<p className="text-sm text-slate-500">
Employee contact details
</p>

</div>

</div>

<div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

{/* Phone */}

<div>

<label className={labelClass}>
Phone
</label>

<input
name="phone"
value={form.phone}
onChange={handleChange}
className={inputClass}
/>

</div>

{/* Email */}

<div>

<label className={labelClass}>
Email
</label>

<input
type="email"
name="email"
value={form.email}
onChange={handleChange}
className={inputClass}
/>

</div>

{/* County */}

<div>

<label className={labelClass}>
County
</label>

<select
name="county"
value={form.county}
onChange={handleChange}
className={selectClass}
>

<option value="">
Select County
</option>

{kenyaCounties.map((county) => (

<option
key={county}
value={county}
>
{county}
</option>

))}

</select>

</div>

{/* Address */}

<div className="lg:col-span-4">

<label className={labelClass}>
Address
</label>

<textarea
rows={3}
name="address"
value={form.address}
onChange={handleChange}
className="w-full rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500"
/>

</div>

</div>

</div>


{/* ===========================
EMPLOYMENT INFORMATION
=========================== */}

<div className={sectionClass}>

  <div className="flex items-center gap-3 mb-6">

    <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
      <FaBriefcase />
    </div>

    <div>
      <h3 className="font-bold text-lg">
        Employment Information
      </h3>

      <p className="text-sm text-slate-500">
        Branch, department and employment details
      </p>
    </div>

  </div>

  <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

    {/* Branch */}

    <div>

      <label className={labelClass}>
        Branch {required}
      </label>

      <select
        name="branch_id"
        value={form.branch_id}
        onChange={handleChange}
        className={selectClass}
        required
      >
        <option value="">Select Branch</option>

        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}

      </select>

    </div>

    {/* Department */}

    <div>

      <label className={labelClass}>
        Department {required}
      </label>

      <select
        name="department_id"
        value={form.department_id}
        onChange={handleChange}
        className={selectClass}
        required
      >
        <option value="">Select Department</option>

        {departments.map((department) => (
          <option
            key={department.id}
            value={department.id}
          >
            {department.name}
          </option>
        ))}

      </select>

    </div>

    {/* Job Title */}

    <div>

      <label className={labelClass}>
        Job Title {required}
      </label>

      <input
        name="job_title"
        value={form.job_title}
        onChange={handleChange}
        className={inputClass}
        required
      />

    </div>

    {/* Employment Type */}

    <div>

      <label className={labelClass}>
        Employment Type
      </label>

      <select
        name="employment_type"
        value={form.employment_type}
        onChange={handleChange}
        className={selectClass}
      >
        <option>Permanent</option>
        <option>Contract</option>
        <option>Intern</option>
        <option>Part Time</option>
        <option>Casual</option>
        <option>Consultant</option>
      </select>

    </div>

    {/* Employment Date */}

    <div>

      <label className={labelClass}>
        Employment Date {required}
      </label>

      <input
        type="date"
        name="employment_date"
        value={form.employment_date || ""}
        onChange={handleChange}
        className={inputClass}
        required
      />

    </div>

    {/* Probation */}

    <div>

      <label className={labelClass}>
        Probation End
      </label>

      <input
        type="date"
        name="probation_end_date"
        value={form.probation_end_date || ""}
        onChange={handleChange}
        className={inputClass}
      />

    </div>

    {/* Status */}

    <div>

      <label className={labelClass}>
        Employment Status
      </label>

      <select
        name="employment_status"
        value={form.employment_status}
        onChange={handleChange}
        className={selectClass}
      >
        <option>Active</option>
        <option>On Probation</option>
        <option>Suspended</option>
        <option>Terminated</option>
        <option>Resigned</option>
      </select>

    </div>

    {/* Payment */}

    <div>

      <label className={labelClass}>
        Payment Frequency
      </label>

      <select
        name="payment_frequency"
        value={form.payment_frequency}
        onChange={handleChange}
        className={selectClass}
      >
        <option>Monthly</option>
        <option>Weekly</option>
        <option>Daily</option>
      </select>

    </div>

  </div>

</div>

{/* ===========================
GOVERNMENT DETAILS
=========================== */}

<div className={sectionClass}>

  <div className="flex items-center gap-3 mb-6">

    <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
      <FaIdCard />
    </div>

    <div>

      <h3 className="font-bold text-lg">
        Government Information
      </h3>

      <p className="text-sm text-slate-500">
        Kenya statutory information
      </p>

    </div>

  </div>

  <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

    <div>

      <label className={labelClass}>
        KRA PIN
      </label>

      <input
        name="kra_pin"
        value={form.kra_pin}
        onChange={handleChange}
        className={inputClass}
      />

    </div>

    <div>

      <label className={labelClass}>
        NSSF Number
      </label>

      <input
        name="nssf_number"
        value={form.nssf_number}
        onChange={handleChange}
        className={inputClass}
      />

    </div>

    <div>

      <label className={labelClass}>
        SHIF Number
      </label>

      <input
        name="shif_number"
        value={form.shif_number}
        onChange={handleChange}
        className={inputClass}
      />

    </div>

  </div>

</div>

{/* ===========================
BANK DETAILS
=========================== */}

<div className={sectionClass}>

  <div className="flex items-center gap-3 mb-6">

    <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
      <FaUniversity />
    </div>

    <div>

      <h3 className="font-bold text-lg">
        Banking Information
      </h3>

      <p className="text-sm text-slate-500">
        Salary payment details
      </p>

    </div>

  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

    <div>

      <label className={labelClass}>
        Bank Name
      </label>

      <input
        name="bank_name"
        value={form.bank_name}
        onChange={handleChange}
        className={inputClass}
      />

    </div>

    <div>

      <label className={labelClass}>
        Account Number
      </label>

      <input
        name="bank_account_number"
        value={form.bank_account_number}
        onChange={handleChange}
        className={inputClass}
      />

    </div>

  </div>

</div>

{/* Footer */}

<div className="sticky bottom-0 bg-white border-t px-8 py-5 flex justify-end gap-4 rounded-b-3xl">

  <button
    type="button"
    onClick={onClose}
    className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 font-medium"
  >
    Cancel
  </button>

  <button
    type="submit"
    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
  >
    {employee ? "Update Employee" : "Save Employee"}
  </button>

</div>

</div>

</form>

</div>

</div>

</div>
);

};