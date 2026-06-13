function Students() {
  return (
    <div className="page-box">
      <h1>Students</h1>

      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Risk Level</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Ahmed Mohamed</td>
            <td>202301</td>
            <td className="danger">High</td>
          </tr>

          <tr>
            <td>Sara Ali</td>
            <td>202302</td>
            <td className="warning">Medium</td>
          </tr>

          <tr>
            <td>Omar Hassan</td>
            <td>202303</td>
            <td className="safe">Low</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Students;