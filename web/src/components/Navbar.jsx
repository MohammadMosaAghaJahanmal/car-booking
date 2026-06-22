import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">
        CarBooking
      </Link>

      <div className="flex gap-5 items-center">
        <Link to="/">Home</Link>
        <Link to="/my-bookings">My Bookings</Link>

        {user?.role === "admin" && <Link to="/admin">Admin</Link>}

        {user ? (
          <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">
            Logout
          </button>
        ) : (
          <Link to="/login" className="bg-blue-500 px-4 py-2 rounded">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default Navbar;