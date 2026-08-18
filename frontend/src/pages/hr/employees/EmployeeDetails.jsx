import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaPhoneAlt,
  FaBriefcase,
  FaIdCard,
  FaUniversity,
  FaEdit,
} from "react-icons/fa";

import EmployeeContacts from "./EmployeeContacts";
import EmployeeDocuments from "./EmployeeDocuments";
import EmployeeSkills from "./EmployeeSkills";
import EmployeeNotes from "./EmployeeNotes";
import EmployeeSalaryHistory from "../salary-history/EmployeeSalaryHistory";
import EmployeeAllowances from "../allowances/EmployeeAllowances";


import { getEmployee } from "../../../api/hrApi";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getEmployee(id);
        setEmployee(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load employee details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const badgeColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "On Probation":
        return "bg-yellow-100 text-yellow-700";
      case "Suspended":
        return "bg-orange-100 text-orange-700";
      case "Terminated":
        return "bg-red-100 text-red-700";
      case "Resigned":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const sectionClass = "bg-white border border-slate-200 rounded-2xl p-6 shadow-sm";

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-slate-800 font-medium">{value || "-"}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading employee details...
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-10 text-center text-red-500">
        {error || "Employee not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <FaArrowLeft /> Back
        </button>

        <button
          onClick={() => navigate(`/admin/hr/employees?edit=${employee.id}`)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <FaEdit /> Edit Employee
        </button>
      </div>

      {/* Profile summary card */}
      <div className={`${sectionClass} flex flex-col sm:flex-row items-center sm:items-start gap-6`}>
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          {employee.photo_url ? (
            <img
              src={
                employee.photo_url.startsWith("http")
                  ? employee.photo_url
                  : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5004"}${employee.photo_url}`
              }
              alt={`${employee.first_name} ${employee.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <FaUser className="text-4xl text-slate-300" />
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-slate-500">
            {employee.job_title || "-"} · {employee.department_name || "-"}
          </p>

          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor(
                employee.employment_status
              )}`}
            >
              {employee.employment_status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              #{employee.employee_number}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {employee.branch_name || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
            <FaUser />
          </div>
          <div>
            <h3 className="font-bold text-lg">Personal Information</h3>
            <p className="text-sm text-slate-500">Basic employee information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="First Name" value={employee.first_name} />
          <Field label="Last Name" value={employee.last_name} />
          <Field label="Gender" value={employee.gender} />
          <Field
            label="Date of Birth"
            value={
              employee.date_of_birth
                ? new Date(employee.date_of_birth).toLocaleDateString()
                : null
            }
          />
          <Field label="National ID" value={employee.national_id} />
        </div>
      </div>

      {/* Contact Information */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
            <FaPhoneAlt />
          </div>
          <div>
            <h3 className="font-bold text-lg">Contact Information</h3>
            <p className="text-sm text-slate-500">Employee contact details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="Phone" value={employee.phone} />
          <Field label="Email" value={employee.email} />
          <Field label="County" value={employee.county} />
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Address" value={employee.address} />
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
            <FaBriefcase />
          </div>
          <div>
            <h3 className="font-bold text-lg">Employment Information</h3>
            <p className="text-sm text-slate-500">Branch, department and employment details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="Branch" value={employee.branch_name} />
          <Field label="Department" value={employee.department_name} />
          <Field label="Job Title" value={employee.job_title} />
          <Field label="Employment Type" value={employee.employment_type} />
          <Field
            label="Employment Date"
            value={
              employee.employment_date
                ? new Date(employee.employment_date).toLocaleDateString()
                : null
            }
          />
          <Field
            label="Probation End"
            value={
              employee.probation_end_date
                ? new Date(employee.probation_end_date).toLocaleDateString()
                : null
            }
          />
          <Field label="Employment Status" value={employee.employment_status} />
          <Field label="Payment Frequency" value={employee.payment_frequency} />
        </div>
      </div>

      {/* Government Details */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
            <FaIdCard />
          </div>
          <div>
            <h3 className="font-bold text-lg">Government Information</h3>
            <p className="text-sm text-slate-500">Kenya statutory information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="KRA PIN" value={employee.kra_pin} />
          <Field label="NSSF Number" value={employee.nssf_number} />
          <Field label="SHIF Number" value={employee.shif_number} />
        </div>
      </div>

      {/* Bank Details */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <FaUniversity />
          </div>
          <div>
            <h3 className="font-bold text-lg">Banking Information</h3>
            <p className="text-sm text-slate-500">Salary payment details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Bank Name" value={employee.bank_name} />
          <Field label="Account Number" value={employee.bank_account_number} />
        </div>
      </div>

      <EmployeeContacts employeeId={employee.id} />

      <EmployeeDocuments
            employeeId={employee.id}
        />

        <EmployeeSkills
        employeeId={employee.id}
        />

        <EmployeeNotes employeeId={employee.id} />
        <EmployeeSalaryHistory
          employeeId={employee.id}
        />

        <EmployeeAllowances
          employeeId={employee.id}
        />
    </div>
  );
}