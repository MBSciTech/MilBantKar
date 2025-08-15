function Events() {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">📅 Expense Events</h2>
            <p className="card-text">Manage recurring expenses and scheduled payments.</p>
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h5 className="card-title text-primary">Upcoming Events</h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>🏠 Rent Payment</span>
                        <span className="text-muted">Jan 31</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>💡 Electricity Bill</span>
                        <span className="text-muted">Feb 5</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>📱 Phone Bill</span>
                        <span className="text-muted">Feb 10</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <h5 className="card-title text-success">Recurring Expenses</h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>🎬 Netflix</span>
                        <span className="text-muted">Monthly</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>🎵 Spotify</span>
                        <span className="text-muted">Monthly</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>☁️ Cloud Storage</span>
                        <span className="text-muted">Monthly</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

export default Events