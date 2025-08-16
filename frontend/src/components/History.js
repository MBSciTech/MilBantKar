import { useEffect, useState } from "react";

function History() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState('');

  useEffect(() => {
    // ✅ get current user from localStorage
    const username = localStorage.getItem("username");
    setUser(username);

    if (username) {
      fetch("http://localhost:5000/api/expense")
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter(
            (exp) => exp.paidBy.username === username || exp.paidTo.username === username
          );
          setExpenses(filtered);
        })
        .catch((err) => console.error("❌ Error fetching expenses:", err));
    }
  }, []);

  // ✅ toggle settle/pending locally (and also call API if you have update route)
  const toggleStatus = (id) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp._id === id
          ? { ...exp, status: exp.status === "settled" ? "pending" : "settled" }
          : exp
      )
    );
    // Backend call example:
    // fetch(`/api/expense/${id}/status`, {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ status: newStatus })
    // });
  };

  const sendReminder = (exp) => {
    alert(`⏰ Reminder sent to ${exp.paidTo.username}`);
    // Optionally call backend to send notification/email
  };

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-body">
          <h2 className="card-title">📝 Transaction History</h2>
          <p className="card-text">
            View all your past transactions and expenses.
          </p>
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Paid By</th>
                  <th>Paid To</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp._id}>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td>{exp.description}</td>
                      <td>{exp.paidBy.username}</td>
                      <td>{exp.paidTo.username}</td>
                      <td>₹{exp.amount}</td>
                      <td>
                        <span
                          className={`badge ${
                            exp.status === "settled"
                              ? "bg-success"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {exp.status || "pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={() => toggleStatus(exp._id)}
                        >
                          {exp.status === "settled" ? "Mark Pending" : "Settle"}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => sendReminder(exp)}
                        >
                          ⏰ Reminder
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;
