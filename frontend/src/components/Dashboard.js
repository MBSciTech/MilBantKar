import React, { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Activity, AlertCircle, CheckCircle, Clock, Zap, Target, Eye, Settings, Bell, Plus, CreditCard } from "lucide-react";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30days');
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    // Get current user from localStorage (using demo fallback for artifact)
    const username = typeof window !== 'undefined' && window.localStorage ? 
      localStorage.getItem("username") : 'demo_user';
    setCurrentUser(username || 'demo_user');
    
    fetchAllData(username || 'demo_user');
  }, []);

  const fetchAllData = async (username) => {
    try {
      setIsLoading(true);
      
      // Fetch expenses
      const expenseRes = await fetch("https://milbantkar-1.onrender.com/api/expense");
      const expenseData = await expenseRes.json();
      
      // Filter expenses for current user
      const userExpenses = expenseData.filter(
        (exp) => exp.paidBy.username === username || exp.paidTo.username === username
      );
      
      setExpenses(userExpenses);
      setFilteredExpenses(userExpenses);

      // Fetch users
      const usersRes = await fetch("https://milbantkar-1.onrender.com/api/users");
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch user events
      const userRes = await fetch(`https://milbantkar-1.onrender.com/api/user/${username}`);
      const userData = await userRes.json();
      if (userData.length > 0) {
        const eventsRes = await fetch(`https://milbantkar-1.onrender.com/api/events/user/${userData[0]._id}`);
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      // Fetch alerts
      const alertsRes = await fetch("https://milbantkar-1.onrender.com/api/alerts");
      const alertsData = await alertsRes.json();
      setAlerts(alertsData);

    } catch (error) {
      console.error("❌ Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const stats = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const settledAmount = filteredExpenses.filter(exp => exp.status).reduce((sum, exp) => sum + exp.amount, 0);
    const pendingAmount = filteredExpenses.filter(exp => !exp.status).reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate amounts owed to user vs amounts user owes
    const owedToUser = filteredExpenses
      .filter(exp => exp.paidBy.username !== currentUser && !exp.status)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const userOwes = filteredExpenses
      .filter(exp => exp.paidBy.username === currentUser && !exp.status)
      .reduce((sum, exp) => sum + exp.amount, 0);

    return {
      totalTransactions: filteredExpenses.length,
      totalAmount,
      settledAmount,
      pendingAmount,
      owedToUser,
      userOwes,
      netBalance: owedToUser - userOwes,
      settlementRate: totalAmount > 0 ? (settledAmount / totalAmount) * 100 : 0
    };
  }, [filteredExpenses, currentUser]);

  // Data for different chart types
  const monthlyData = useMemo(() => {
    const months = {};
    filteredExpenses.forEach(exp => {
      const month = new Date(exp.date).toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (!months[month]) {
        months[month] = { month, settled: 0, pending: 0, total: 0 };
      }
      months[month].total += exp.amount;
      if (exp.status) {
        months[month].settled += exp.amount;
      } else {
        months[month].pending += exp.amount;
      }
    });
    return Object.values(months).slice(-6);
  }, [filteredExpenses]);

  const weeklyData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayExpenses = filteredExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.toDateString() === date.toDateString();
      });
      
      last7Days.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        date: date.toLocaleDateString('en', { day: 'numeric' }),
        settled: dayExpenses.filter(exp => exp.status).reduce((sum, exp) => sum + exp.amount, 0),
        pending: dayExpenses.filter(exp => !exp.status).reduce((sum, exp) => sum + exp.amount, 0),
        total: dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      });
    }
    return last7Days;
  }, [filteredExpenses]);

  const pieData = [
    { name: 'Settled', value: stats.settledAmount, color: '#28a745' },
    { name: 'Pending', value: stats.pendingAmount, color: '#dc3545' }
  ];

  const balanceData = [
    { name: 'You Owe', value: Math.abs(stats.userOwes), fill: '#dc3545' },
    { name: 'Owed to You', value: Math.abs(stats.owedToUser), fill: '#28a745' }
  ];

  const categoryData = useMemo(() => {
    const categories = {};
    filteredExpenses.forEach(exp => {
      const category = exp.description.toLowerCase().includes('food') || exp.description.toLowerCase().includes('dinner') || exp.description.toLowerCase().includes('lunch') ? 'Food' :
                      exp.description.toLowerCase().includes('movie') || exp.description.toLowerCase().includes('entertainment') ? 'Entertainment' :
                      exp.description.toLowerCase().includes('uber') || exp.description.toLowerCase().includes('transport') ? 'Transport' :
                      exp.description.toLowerCase().includes('grocery') || exp.description.toLowerCase().includes('shopping') ? 'Shopping' :
                      'Others';
      
      if (!categories[category]) {
        categories[category] = { name: category, value: 0, count: 0 };
      }
      categories[category].value += exp.amount;
      categories[category].count += 1;
    });
    return Object.values(categories);
  }, [filteredExpenses]);

  const topUsers = useMemo(() => {
    const userStats = {};
    filteredExpenses.forEach(exp => {
      const otherUser = exp.paidBy.username === currentUser ? exp.paidTo.username : exp.paidBy.username;
      if (!userStats[otherUser]) {
        userStats[otherUser] = { name: otherUser, amount: 0, transactions: 0 };
      }
      userStats[otherUser].amount += exp.amount;
      userStats[otherUser].transactions += 1;
    });
    return Object.values(userStats).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filteredExpenses, currentUser]);

  if (isLoading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-primary mb-2">Loading Dashboard</h4>
          <p className="text-white">Fetching your expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark text-light min-vh-100">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4 mt-5">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <h1 className="display-4 fw-bold text-primary mb-1">
                  <Activity className="me-3" size={48} />
                  Expense Dashboard
                </h1>
                <p className="lead text-white">Welcome back, <span className="text-info">{currentUser}</span></p>
              </div>
              <div className="d-flex gap-2">
                
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
            <div className="card bg-primary text-white h-100 border-0 shadow">
              <div className="card-body text-center">
                <Activity size={32} className="mb-2" />
                <h3 className="fw-bold">{stats.totalTransactions}</h3>
                <small className="opacity-75">Total Transactions</small>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
            <div className="card bg-info text-white h-100 border-0 shadow">
              <div className="card-body text-center">
                <CreditCard size={24}></CreditCard>
                <h3 className="fw-bold">{formatCurrency(stats.totalAmount)}</h3>
                <small className="opacity-75">Total Amount</small>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
            <div className="card bg-success text-white h-100 border-0 shadow">
              <div className="card-body text-center">
                <CheckCircle size={32} className="mb-2" />
                <h3 className="fw-bold">{formatCurrency(stats.settledAmount)}</h3>
                <small className="opacity-75">Settled</small>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
            <div className="card bg-warning text-dark h-100 border-0 shadow">
              <div className="card-body text-center">
                <Clock size={32} className="mb-2" />
                <h3 className="fw-bold">{formatCurrency(stats.pendingAmount)}</h3>
                <small className="opacity-75">Pending</small>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
            <div className={`card ${stats.netBalance >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100 border-0 shadow`}>
              <div className="card-body text-center">
                {stats.netBalance >= 0 ? <TrendingUp size={32} className="mb-2" /> : <TrendingDown size={32} className="mb-2" />}
                <h3 className="fw-bold">{formatCurrency(Math.abs(stats.netBalance))}</h3>
                <small className="opacity-75">{stats.netBalance >= 0 ? 'Net Credit' : 'Net Debt'}</small>
              </div>
            </div>
          </div>
          
          <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
            <div className="card bg-secondary text-white h-100 border-0 shadow">
              <div className="card-body text-center">
                <Target size={32} className="mb-2" />
                <h3 className="fw-bold">{stats.settlementRate.toFixed(1)}%</h3>
                <small className="opacity-75">Settlement Rate</small>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="row mb-4">
          {/* Weekly Trend - Area Chart */}
          <div className="col-lg-8 mb-4">
            <div className="card bg-dark border-primary h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <TrendingUp className="me-2" size={20} />
                  Weekly Expense Trend
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorSettled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#28a745" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc3545" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#dc3545" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="day" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#343a40', 
                        border: '1px solid #007bff',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [formatCurrency(value), '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="settled" 
                      stackId="1"
                      stroke="#28a745" 
                      fillOpacity={1} 
                      fill="url(#colorSettled)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pending" 
                      stackId="1"
                      stroke="#dc3545" 
                      fillOpacity={1} 
                      fill="url(#colorPending)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Settlement Status - Pie Chart */}
          <div className="col-lg-4 mb-4">
            <div className="card bg-dark border-success h-100">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <CheckCircle className="me-2" size={20} />
                  Settlement Status
                </h5>
              </div>
              <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                {/* ✅ Put defs INSIDE PieChart */}
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{ filter: "url(#glow)" }} // ✅ Apply glow here
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => [formatCurrency(value), ""]} />
              </PieChart>
            </ResponsiveContainer>

                <div className="d-flex justify-content-center mt-3">
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{width: '12px', height: '12px'}}></div>
                      <small style={{color:'white'}}>Settled</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-danger rounded-circle me-2" style={{width: '12px', height: '12px'}}></div>
                      <small style={{color:'white'}}>Pending</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="row mb-4">
          {/* Monthly Overview - Bar Chart */}
          <div className="col-lg-6 mb-4">
            <div className="card bg-dark border-info h-100">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <BarChart className="me-2" size={20} />
                  Monthly Overview
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#343a40', 
                        border: '1px solid #17a2b8',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Bar dataKey="settled" stackId="a" fill="#28a745" name="Settled" />
                    <Bar dataKey="pending" stackId="a" fill="#dc3545" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Breakdown - Radial Bar Chart */}
          <div className="col-lg-6 mb-4">
            <div className="card bg-dark border-warning h-100">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <Target className="me-2" size={20} />
                  Expense Categories
                </h5>
              </div>
              <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                {/* Define the glow filter */}
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${index * 60}, 70%, 50%)`}
                      style={{ filter: "url(#glow)" }} // 👈 Apply glow here
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => [formatCurrency(value), "Amount"]} />
              </PieChart>
            </ResponsiveContainer>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="row">
          {/* Recent Transactions */}
          <div className="col-lg-8 mb-4">
            <div className="card bg-dark border-light">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">
                  <Activity className="me-2" size={20} />
                  Recent Transactions
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0">
                    <thead className="table-primary">
                      <tr>
                        <th>Description</th>
                        <th>From → To</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.slice(0, 8).map((expense) => (
                        <tr key={expense._id}>
                          <td>{expense.description}</td>
                          <td>
                            <small className="text-white">
                              {expense.paidBy.username} → {expense.paidTo.username}
                            </small>
                          </td>
                          <td className="fw-bold">{formatCurrency(expense.amount)}</td>
                          <td>
                            <small className="text-white">
                              {new Date(expense.date).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <span className={`badge ${expense.status ? 'bg-success' : 'bg-warning'}`}>
                              {expense.status ? 'Settled' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Top Users & Quick Stats */}
          <div className="col-lg-4">
            {/* Balance Overview */}
            <div className="card bg-dark border-primary mb-4">
              <div className="card-header bg-primary text-white">
                <h6 className="mb-0">Balance Overview</h6>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={balanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" stroke="#ccc" />
                    <YAxis dataKey="name" type="category" stroke="#ccc" />
                    <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Users */}
            <div className="card bg-dark border-info">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">
                  <Users className="me-2" size={16} />
                  Top Users
                </h6>
              </div>
              <div className="card-body">
                {topUsers.map((user, index) => (
                  <div key={user.name} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <span className="fw-bold text-white">{user.name}</span>
                      <br />
                      <small className="text-white">{user.transactions} transactions</small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-primary">{formatCurrency(user.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;