function Dashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Total Students</h2>
          <p>250</p>
        </div>

        <div className="card">
          <h2>High Risk Students</h2>
          <p>15</p>
        </div>

        <div className="card">
          <h2>Attendance Rate</h2>
          <p>78%</p>
        </div>

        <div className="card">
          <h2>Assignments Submitted</h2>
          <p>85%</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;