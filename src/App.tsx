import AdminApp from "./admin/AdminApp";
import Portal from "./portal/Portal";

// Customers land on "/" (your router's captive-portal redirect should point here, ideally with ?mac=...).
// Staff use "/admin".
export default function App() {
  return window.location.pathname.startsWith("/admin") ? <AdminApp /> : <Portal />;
}
