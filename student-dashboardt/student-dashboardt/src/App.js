import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { FaHome, FaChartBar, FaCog, FaBell, FaUserGraduate, FaClipboardList } from "react-icons/fa";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Students from "./pages/Students";
import Notifications from "./pages/Notifications";
import Attendance from "./pages/Attendance";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <div className="sidebar">
          <h2>SEWS</h2>

          <Link to="/" className="menu-item">
            <FaHome />
            <span>Dashboard</span>
          </Link>

          <Link to="/students" className="menu-item">
            <FaUserGraduate />
            <span>Students</span>
          </Link>

          <Link to="/attendance" className="menu-item">
            <FaClipboardList />
            <span>Attendance</span>
          </Link>

          <Link to="/reports" className="menu-item">
            <FaChartBar />
            <span>Reports</span>
          </Link>

          <Link to="/notifications" className="menu-item">
            <FaBell />
            <span>Notifications</span>
          </Link>

          <Link to="/settings" className="menu-item">
            <FaCog />
            <span>Settings</span>
          </Link>
        </div>

        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;