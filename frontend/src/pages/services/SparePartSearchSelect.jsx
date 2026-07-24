import React, { useEffect, useRef, useState } from "react";
import { getSpareParts } from "../../api/serviceApi";

/*
  Type-to-search spare part picker.

  - Debounces keystrokes (300ms) so it doesn't hammer the API on every letter
  - Only fetches once the user has typed something (no 2000-row initial load)
  - Calls onSelect(part) with the full part object when the user picks one,
    or onSelect(null) when the selection is cleared
*/

const SparePartSearchSelect = ({ onSelect, disabled }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || selected) {
      setResults([]);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await getSpareParts({ search: query, limit: 20 });
        setResults(res.data.data || res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selected]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (part) => {
    setSelected(part);
    setQuery(`${part.name} - KES ${part.selling_price}`);
    setOpen(false);
    onSelect(part);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (selected) {
      setSelected(null);
      onSelect(null);
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => query && !selected && setOpen(true)}
        placeholder="Search spare part by name..."
        className="border rounded-lg p-2 w-full disabled:bg-slate-100 disabled:text-slate-400"
      />

      {selected && !disabled && (
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setQuery("");
            onSelect(null);
          }}
          className="absolute right-2 top-2.5 text-slate-400 text-sm"
        >
          ✕
        </button>
      )}

      {open && query.trim() && !selected && (
        <div className="absolute z-10 bg-white border rounded-lg mt-1 w-full max-h-64 overflow-y-auto shadow-lg">
          {loading && <p className="p-2 text-sm text-slate-400">Searching...</p>}

          {!loading && results.length === 0 && (
            <p className="p-2 text-sm text-slate-400">No parts found</p>
          )}

          {!loading &&
            results.map((part) => (
              <div
                key={part.id}
                onClick={() => handlePick(part)}
                className="p-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between gap-3"
              >
                <span>{part.name}</span>
                <span className="text-slate-500 whitespace-nowrap">
                  KES {part.selling_price} (stock {part.quantity})
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SparePartSearchSelect;