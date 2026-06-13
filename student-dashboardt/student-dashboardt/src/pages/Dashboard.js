function Dashboard() {
  return (
    <div className="dashboard-grid">
      <div className="card">
        <h2>Total Students</h2>
        <p>250</p>
      </div>

      <div className="card">
        <h2>High Risk</h2>
        <p>15</p>
      </div>

      <div className="card">
        <h2>Attendance Rate</h2>
        <p>78%</p>
      </div>

      <div className="card">
        <h2>Reports</h2>
        <p>12 New</p>
      </div>
    </div>
  );
}

export default Dashboard;