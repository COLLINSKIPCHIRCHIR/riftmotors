// components/RequirePermission.jsx
import { Navigate } from "react-router-dom";
import { hasPermission } from "../utils/permissions";

export default function RequirePermission({ permission, children }) {
  // permission can be a single string or an array (any-match)
  const allowed = Array.isArray(permission)
    ? permission.some((p) => hasPermission(p))
    : hasPermission(permission);

  if (!allowed) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}