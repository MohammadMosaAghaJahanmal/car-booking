import { Navigate } from "react-router-dom";
function ProtectedRoute({ children, adminOnly = false, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  if (!token) return <Navigate to="/login" />;
  const requiredRole = role || (adminOnly ? "admin" : null);
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" />;
  return children;
}
export default ProtectedRoute;