import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data/esnext';
import './Visualise.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://milbantkar-1.onrender.com';
const API_FALLBACK = 'http://localhost:5000';

function Visualise() {
  const networkRef = useRef(null);
  const networkInstance = useRef(null);

  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const fetchJsonWithFallback = async (path) => {
    try {
      const primaryResponse = await fetch(`${API_BASE}${path}`);
      if (!primaryResponse.ok) throw new Error(`Primary API returned ${primaryResponse.status}`);
      return await primaryResponse.json();
    } catch {
      const fallbackResponse = await fetch(`${API_FALLBACK}${path}`);
      if (!fallbackResponse.ok) throw new Error(`Fallback API returned ${fallbackResponse.status}`);
      return await fallbackResponse.json();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setCurrentUserId(localStorage.getItem('userId') || '');

        const [usersData, expensesData] = await Promise.all([
          fetchJsonWithFallback('/api/users'),
          fetchJsonWithFallback('/api/expense'),
        ]);

        setUsers(Array.isArray(usersData) ? usersData : []);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load network data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const summary = useMemo(() => {
    const totalAmount = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const settledAmount = expenses
      .filter((exp) => Boolean(exp.status))
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    const uniquePairs = new Set(
      expenses
        .map((exp) => {
          const fromId = exp?.paidBy?._id || '';
          const toId = exp?.paidTo?._id || '';
          return fromId && toId ? `${fromId}->${toId}` : '';
        })
        .filter(Boolean)
    );

    return {
      peopleCount: users.length,
      transactionCount: expenses.length,
      connectionCount: uniquePairs.size,
      totalAmount,
      settledAmount,
      pendingAmount: totalAmount - settledAmount,
      settledPct: totalAmount > 0 ? Math.round((settledAmount / totalAmount) * 100) : 0,
    };
  }, [users, expenses]);

  useEffect(() => {
    if (!networkRef.current || users.length === 0) return;

    const nodes = new DataSet(
      users.map((user) => {
        const isCurrent = user._id === currentUserId;
        return {
          id: user._id,
          label: user.username,
          shape: 'circularImage',
          image:
            user.profilePic ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=0f172a&color=ffffff&size=128`,
          size: isCurrent ? 46 : 36,
          borderWidth: isCurrent ? 4 : 3,
          borderWidthSelected: 5,
          color: {
            border: isCurrent ? '#0ea5e9' : '#64748b',
            background: isCurrent ? '#e0f2fe' : '#e2e8f0',
            highlight: {
              border: '#0284c7',
              background: '#bae6fd',
            },
            hover: {
              border: '#0f172a',
              background: '#f1f5f9',
            },
          },
          font: {
            color: '#0f172a',
            size: isCurrent ? 16 : 14,
            face: 'Manrope, Segoe UI, sans-serif',
            strokeWidth: 5,
            strokeColor: '#f8fafc',
          },
          shadow: {
            enabled: true,
            color: 'rgba(15, 23, 42, 0.16)',
            size: 14,
            x: 0,
            y: 8,
          },
        };
      })
    );

    const edgeMap = new Map();

    expenses.forEach((expense) => {
      const fromId = expense?.paidBy?._id;
      const toId = expense?.paidTo?._id;
      if (!fromId || !toId) return;

      const key = `${fromId}-${toId}`;
      const current = edgeMap.get(key);
      if (current) {
        current.amount += Number(expense.amount) || 0;
        current.transactions.push(expense);
      } else {
        edgeMap.set(key, {
          from: fromId,
          to: toId,
          amount: Number(expense.amount) || 0,
          transactions: [expense],
        });
      }
    });

    const maxAmount = Math.max(...Array.from(edgeMap.values()).map((entry) => entry.amount), 0);

    const edges = new DataSet(
      Array.from(edgeMap.entries()).map(([key, entry]) => {
        const width = maxAmount > 0 ? 2 + (entry.amount / maxAmount) * 11 : 2;
        const isSettled = entry.transactions.every((txn) => txn.status);

        return {
          id: key,
          from: entry.from,
          to: entry.to,
          width,
          label: `Rs ${entry.amount.toLocaleString('en-IN')}`,
          color: {
            color: isSettled ? '#16a34a' : '#ea580c',
            highlight: isSettled ? '#15803d' : '#c2410c',
            hover: isSettled ? '#15803d' : '#c2410c',
            opacity: 0.92,
          },
          font: {
            color: '#0f172a',
            size: 12,
            face: 'Manrope, Segoe UI, sans-serif',
            background: 'rgba(248, 250, 252, 0.92)',
            strokeWidth: 0,
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.8,
            },
          },
          smooth: {
            enabled: true,
            type: 'dynamic',
          },
          shadow: {
            enabled: true,
            color: isSettled ? 'rgba(22, 163, 74, 0.25)' : 'rgba(234, 88, 12, 0.22)',
            size: 6,
            x: 0,
            y: 4,
          },
          transactions: entry.transactions,
        };
      })
    );

    const options = {
      autoResize: true,
      nodes: {
        shape: 'circularImage',
        scaling: {
          min: 28,
          max: 56,
          label: {
            enabled: true,
            min: 13,
            max: 18,
            maxVisible: 28,
            drawThreshold: 9,
          },
        },
      },
      edges: {
        scaling: {
          min: 1,
          max: 20,
        },
        selectionWidth: 2,
      },
      physics: {
        enabled: true,
        stabilization: {
          iterations: 130,
          updateInterval: 20,
        },
        barnesHut: {
          gravitationalConstant: -8600,
          centralGravity: 0.42,
          springLength: 180,
          springConstant: 0.038,
          damping: 0.28,
        },
      },
      layout: {
        improvedLayout: true,
      },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        zoomView: true,
        dragView: true,
      },
    };

    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    networkInstance.current = new Network(networkRef.current, { nodes, edges }, options);

    networkInstance.current.on('click', (params) => {
      if (!params.edges.length) return;
      const edge = edges.get(params.edges[0]);
      if (!edge || !edge.transactions) return;

      setSelectedTransaction({
        ...edge,
        fromUser: users.find((u) => u._id === edge.from)?.username || 'Unknown',
        toUser: users.find((u) => u._id === edge.to)?.username || 'Unknown',
      });
      setShowModal(true);
    });

    networkInstance.current.on('hoverEdge', () => {
      if (networkInstance.current?.canvas?.body?.container) {
        networkInstance.current.canvas.body.container.style.cursor = 'pointer';
      }
    });

    networkInstance.current.on('blurEdge', () => {
      if (networkInstance.current?.canvas?.body?.container) {
        networkInstance.current.canvas.body.container.style.cursor = 'default';
      }
    });

    networkInstance.current.fit({
      animation: {
        duration: 500,
        easingFunction: 'easeInOutQuad',
      },
    });

    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }
    };
  }, [users, expenses, currentUserId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalAmount = (transactions) =>
    transactions.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const getPaidAmount = (transactions) =>
    transactions
      .filter((transaction) => transaction.status)
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  if (loading) {
    return (
      <div className="viz-loading-wrap">
        <div className="viz-loading-card">
          <div className="viz-spinner" />
          <h3>Building Expense Network</h3>
          <p>Fetching users and transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viz-loading-wrap">
        <div className="viz-error-card">
          <h3>Unable To Load Visualisation</h3>
          <p>{error}</p>
          <button className="viz-btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="viz-page">
        <section className="viz-topbar">
          <div>
            <p className="viz-kicker">Flow Analytics</p>
            <h1>Expense Relationship Graph</h1>
            {/* <p className="viz-subtitle">See who paid whom, where settlements are pending, and how money moves across your group.</p> */}
          </div>

          <div className="viz-legend-compact">
            <span><i className="dot dot-user" />You</span>
            <span><i className="dot dot-paid" />Settled</span>
            <span><i className="dot dot-pending" />Pending</span>
          </div>
        </section>

        <section className="viz-stats-grid">
          {/* <article className="viz-stat-card">
            <p>People</p>
            <h4>{summary.peopleCount}</h4>
          </article>
          <article className="viz-stat-card">
            <p>Connections</p>
            <h4>{summary.connectionCount}</h4>
          </article>
          <article className="viz-stat-card">
            <p>Total Volume</p>
            <h4>Rs {summary.totalAmount.toLocaleString('en-IN')}</h4>
          </article>
          <article className="viz-stat-card">
            <p>Settlement Progress</p>
            <h4>{summary.settledPct}%</h4>
          </article> */}
        </section>

        <section className="viz-canvas-shell">
          <div className="viz-canvas-toolbar">
            <div className="viz-toolbar-title">Interactive Graph</div>
            <div className="viz-toolbar-actions">
              <span>Click edge for details</span>
              <span>Drag to reorganize</span>
              <span>Scroll to zoom</span>
            </div>
          </div>
          <div ref={networkRef} className="viz-network-canvas" />
        </section>
      </div>

      {selectedTransaction && showModal && (
        <div
          className="viz-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="viz-modal-card">
            <div className="viz-modal-header">
              <div>
                <p className="viz-kicker">Connection Details</p>
                <h3>{selectedTransaction.fromUser} {'->'} {selectedTransaction.toUser}</h3>
              </div>
              <button className="viz-btn-ghost" onClick={() => setShowModal(false)}>Close</button>
            </div>

            <div className="viz-modal-stats">
              <div>
                <label>Total</label>
                <strong>Rs {getTotalAmount(selectedTransaction.transactions).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <label>Settled</label>
                <strong>Rs {getPaidAmount(selectedTransaction.transactions).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <label>Pending</label>
                <strong>
                  Rs {(getTotalAmount(selectedTransaction.transactions) - getPaidAmount(selectedTransaction.transactions)).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="viz-table-wrap">
              <table className="viz-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransaction.transactions.map((transaction, index) => (
                    <tr key={`${transaction._id || index}-${index}`}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.description || 'No description'}</td>
                      <td>Rs {(Number(transaction.amount) || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`viz-chip ${transaction.status ? 'chip-paid' : 'chip-pending'}`}>
                          {transaction.status ? 'Settled' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Visualise;
