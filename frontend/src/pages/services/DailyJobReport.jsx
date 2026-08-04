import React, { useEffect, useState, useRef } from "react";
import { getDailyJobReport } from "../../api/serviceApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-KE");

const statusLabel = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed"
};

const DailyJobReport = () => {

  const today = new Date().toISOString().split("T")[0];

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getDailyJobReport(from, to);
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleDownloadPdf = async () => {
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("l", "mm", "a4"); // landscape - wide table
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`Daily-Job-Report-${from}-to-${to}.pdf`);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  return (
    <div className="print-container p-6 bg-gray-100 min-h-screen">

      {/* FILTER BAR */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-800 text-white px-5 py-2 rounded-xl text-sm font-medium"
          >
            Print
          </button>
          <button
            onClick={handleDownloadPdf}
            className="bg-blue-800 text-white px-5 py-2 rounded-xl text-sm font-medium"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* PRINTABLE AREA */}
      <div ref={printRef} className="max-w-7xl mx-auto bg-white print-document border border-black p-3 text-[9px] leading-[12px]">

        <div className="border-2 border-black p-3">

          {/* HEADER */}
          <div className="flex justify-center items-center gap-4 pb-2">
            <img src="/rmotologo.jpg" className="h-14 w-auto object-contain" alt="Rift Motors Limited" />
            <div className="border-l-2 border-black self-stretch"></div>
            <div className="flex flex-col justify-center text-left text-[9px] leading-[13px] text-gray-700">
              <p>P.O. Box 18952 - 20100</p>
              <p>KFA - Show Ground Road, Nakuru</p>
              <p>+254 790 406 996</p>
            </div>
          </div>

          <hr className="border-black border-t-2" />

          <div className="text-center py-1">
            <h2 className="text-sm font-extrabold tracking-[3px] uppercase text-gray-900">
              Daily Job Report
            </h2>
            <p className="text-[10px] text-gray-600">
              {from === to ? from : `${from} to ${to}`}
            </p>
          </div>

          {/* TABLE */}
          <table className="w-full border border-black text-[9px] leading-tight mt-2">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-1 border border-black">Date Received</th>
                <th className="p-1 border border-black">Mileage (KM)</th>
                <th className="p-1 border border-black">Contact</th>
                <th className="p-1 border border-black">Customer Name</th>
                <th className="p-1 border border-black">Reg No</th>
                <th className="p-1 border border-black">Model</th>
                <th className="p-1 border border-black">Technician Assigned</th>
                <th className="p-1 border border-black">Job Description</th>
                <th className="p-1 border border-black">Status</th>
                <th className="p-1 border border-black">Parts Required</th>
                <th className="p-1 border border-black">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const description = [job.complaint, job.diagnosis, job.services]
                  .filter(Boolean)
                  .join(" - ");


                const remarks = job.pending_work
                    ? [job.notes, `PENDING: ${job.pending_work}`].filter(Boolean).join(" | ")
                    : field(job.notes);


                return (
                  <tr key={job.id}>
                    <td className="p-1 border border-black align-top">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-1 border border-black align-top text-center">
                      {formatNumber(job.mileage)}
                    </td>
                    <td className="p-1 border border-black align-top">{field(job.customer_phone)}</td>
                    <td className="p-1 border border-black align-top font-semibold">{field(job.customer_name)}</td>
                    <td className="p-1 border border-black align-top">{field(job.registration_number)}</td>
                    <td className="p-1 border border-black align-top">{field(job.make)} {field(job.model)}</td>
                    <td className="p-1 border border-black align-top">{field(job.technicians)}</td>
                    <td className="p-1 border border-black align-top">{field(description)}</td>
                    <td className="p-1 border border-black align-top text-center capitalize">
                      {statusLabel[job.status] || job.status}
                    </td>
                    <td className="p-1 border border-black align-top">{field(job.parts_required)}</td>
                    <td className="p-1 border border-black align-top">{remarks}</td>
                  </tr>
                );
              })}

              {jobs.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-3 border border-black text-center text-gray-500">
                    No jobs received in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-1 flex justify-between text-[9px] text-gray-500">
            <p>Printed By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DailyJobReport;