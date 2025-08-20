import { useEffect, useState } from "react";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const username = localStorage.getItem("username");

    if (username) {
      fetch("https://milbantkar-1.onrender.com/api/expense")
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter(
            (exp) =>
              exp.paidBy.username === username ||
              exp.paidTo.username === username
          );
          setExpenses(filtered);
          setFilteredExpenses(filtered);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("❌ Error fetching expenses:", err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // 🔹 Currency formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // 🔹 Summary stats
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const settledAmount = filteredExpenses
    .filter((exp) => exp.status)
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingAmount = filteredExpenses
    .filter((exp) => !exp.status)
    .reduce((sum, exp) => sum + exp.amount, 0);

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center p-5">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-3">Loading transactions...</h5>
        </div>
      </div>
    );
  }

  const s1 = {
    fontSize : '36px'
  }

  return (
    <div className="container mt-4">
      {/* Summary Cards */}
      <div style = {s1}>
        Welcome back {localStorage.getItem(`username`)}
      </div>
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center">
              <div className="fs-4 mb-1">📊</div>
              <h6 className="card-title">Total Transactions</h6>
              <h4>{filteredExpenses.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body text-center">
              <div className="fs-4 mb-1">💰</div>
              <h6 className="card-title">Total Amount</h6>
              <h4>{formatCurrency(totalAmount)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body text-center">
              <div className="fs-4 mb-1">✅</div>
              <h6 className="card-title">Settled</h6>
              <h4>{formatCurrency(settledAmount)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body text-center">
              <div className="fs-4 mb-1">⏳</div>
              <h6 className="card-title">Pending</h6>
              <h4>{formatCurrency(pendingAmount)}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
