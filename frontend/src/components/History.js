function History() {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">📝 Transaction History</h2>
            <p className="card-text">View all your past transactions and expenses.</p>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2024-01-15</td>
                    <td>Grocery Shopping</td>
                    <td><span className="badge bg-primary">Food</span></td>
                    <td>$85.50</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                      <button className="btn btn-sm btn-outline-danger">Delete</button>
                    </td>
                  </tr>
                  <tr>
                    <td>2024-01-14</td>
                    <td>Gas Station</td>
                    <td><span className="badge bg-warning">Transport</span></td>
                    <td>$45.00</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                      <button className="btn btn-sm btn-outline-danger">Delete</button>
                    </td>
                  </tr>
                  <tr>
                    <td>2024-01-13</td>
                    <td>Netflix Subscription</td>
                    <td><span className="badge bg-info">Entertainment</span></td>
                    <td>$15.99</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                      <button className="btn btn-sm btn-outline-danger">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

export default History;