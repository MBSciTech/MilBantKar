function Budgets() {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">🎯 Budget Management</h2>
            <p className="card-text">Track and manage your spending budgets.</p>
            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Food & Dining</h5>
                    <div className="progress mb-2">
                      <div className="progress-bar bg-success" style={{width: '65%'}}></div>
                    </div>
                    <small className="text-muted">$650 of $1000 used</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Transportation</h5>
                    <div className="progress mb-2">
                      <div className="progress-bar bg-warning" style={{width: '85%'}}></div>
                    </div>
                    <small className="text-muted">$340 of $400 used</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Entertainment</h5>
                    <div className="progress mb-2">
                      <div className="progress-bar bg-danger" style={{width: '95%'}}></div>
                    </div>
                    <small className="text-muted">$190 of $200 used</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mt-4">
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">📈 Analytics & Reports</h2>
          <p className="card-text">Analyze your spending patterns and trends.</p>
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h5>Monthly Trend</h5>
                  <div className="bg-primary text-white p-4 rounded">
                    📊 Chart Placeholder
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h5>Category Breakdown</h5>
                  <div className="bg-success text-white p-4 rounded">
                    🥧 Pie Chart Placeholder
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
    );
  }

export default Budgets