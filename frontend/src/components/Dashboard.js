function Dashboard(){
    return(
        <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">📊 Dashboard</h2>
              <p className="card-text">Welcome to your expense dashboard! Here you can view your financial overview.</p>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center">
                      <h5>Total Expenses</h5>
                      <h3>$2,450.50</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center">
                      <h5>This Month</h5>
                      <h3>$845.20</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body text-center">
                      <h5>Budget Left</h5>
                      <h3>$154.80</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card bg-info text-white">
                    <div className="card-body text-center">
                      <h5>Categories</h5>
                      <h3>8</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
}

export default Dashboard