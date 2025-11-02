import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data/esnext';

function Visualise() {
  const networkRef = useRef(null);
  const networkInstance = useRef(null);

  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setCurrentUserId(localStorage.getItem('userId'));

        const [usersResponse, expensesResponse] = await Promise.all([
          fetch('https://milbantkar-1.onrender.com/api/users'),
          fetch('https://milbantkar-1.onrender.com/api/expense'),
        ]);

        if (!usersResponse.ok || !expensesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const usersData = await usersResponse.json();
        const expensesData = await expensesResponse.json();

        setUsers(usersData);
        setExpenses(expensesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (users.length > 0 && expenses.length > 0 && networkRef.current) {
      createNetwork();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, expenses, currentUserId]);

  const createNetwork = () => {
    const nodes = new DataSet(
      users.map((user) => ({
        id: user._id,
        label: user.username,
        shape: 'circularImage',
        image: user.profilePic || 'https://via.placeholder.com/100/4ecdc4/ffffff?text=' + user.username.charAt(0),
        color: {
          border: user._id === currentUserId ? '#ff3366' : '#00d4ff',
          background: user._id === currentUserId ? 'rgba(255,51,102,0.2)' : 'rgba(0,212,255,0.2)',
          hover: {
            border: user._id === currentUserId ? '#ff3366' : '#00d4ff',
            background: user._id === currentUserId ? 'rgba(255,51,102,0.4)' : 'rgba(0,212,255,0.4)'
          }
        },
        size: user._id === currentUserId ? 50 : 40,
        font: {
          color: '#ffffff',
          size: user._id === currentUserId ? 16 : 14,
          face: 'Orbitron, monospace',
          strokeWidth: 2,
          strokeColor: '#000000'
        },
        borderWidth: 3,
        borderWidthSelected: 5,
        shadow: {
          enabled: true,
          color: user._id === currentUserId ? 'rgba(255,51,102,0.5)' : 'rgba(0,212,255,0.5)',
          size: 15,
          x: 3,
          y: 3
        },
      }))
    );

    const edgeMap = new Map();

    expenses.forEach((expense) => {
      const fromId = expense.paidBy._id;
      const toId = expense.paidTo._id;
      const key = `${fromId}-${toId}`;

      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key);
        existing.amount += expense.amount;
        existing.transactions.push(expense);
      } else {
        edgeMap.set(key, {
          from: fromId,
          to: toId,
          amount: expense.amount,
          transactions: [expense],
        });
      }
    });

    const maxAmount = Math.max(
      ...Array.from(edgeMap.values()).map((e) => e.amount)
    );
    const minWidth = 2;
    const maxWidth = 15;

    const edges = new DataSet(
      Array.from(edgeMap.entries()).map(([key, data]) => {
        const width = 2;
        const isPaid = data.transactions.every((t) => t.status);

        return {
          id: key,
          from: data.from,
          to: data.to,
          width: width,
          color: {
            color: isPaid ? '#00ff88' : '#ff3366',
            hover: isPaid ? '#00cc66' : '#cc0044',
            highlight: isPaid ? '#00aa44' : '#aa0022',
          },
          label: `₹${data.amount}`,
          font: {
            color: '#ffffff',
            size: 12,
            background: 'rgba(0,0,0,0.7)',
            strokeWidth: 1,
            strokeColor: '#000000',
            face: 'Orbitron, monospace'
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 1.2,
              type: 'arrow',
            },
          },
          smooth: {
            enabled: true,
            type: 'curvedCW',
            roundness: 0.2,
          },
          transactions: data.transactions,
          shadow: {
            enabled: true,
            color: isPaid ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)',
            size: 8,
            x: 2,
            y: 2,
          },
        };
      })
    );

    const options = {
      nodes: {
        shape: 'circularImage',
        scaling: {
          min: 30,
          max: 60,
          label: {
            enabled: true,
            min: 14,
            max: 16,
            maxVisible: 16,
            drawThreshold: 5
          }
        }
      },
      edges: {
        scaling: { min: 1, max: 20 },
        selectionWidth: 3,
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 100 },
        barnesHut: {
          gravitationalConstant: -10000,
          centralGravity: 0.5,
          springLength: 200,
          springConstant: 0.05,
          damping: 0.2,
        },
      },
      layout: { 
        improvedLayout: true,
        randomSeed: 0.5
      },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        zoomView: true,
        dragView: true,
        tooltipDelay: 200,
      },
    };

    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    networkInstance.current = new Network(
      networkRef.current,
      { nodes, edges },
      options
    );

    networkInstance.current.on('click', (params) => {
      if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edge = edges.get(edgeId);
        if (edge && edge.transactions) {
          setSelectedTransaction({
            ...edge,
            fromUser: users.find((u) => u._id === edge.from)?.username,
            toUser: users.find((u) => u._id === edge.to)?.username,
          });
          setShowModal(true);
        }
      }
    });

    networkInstance.current.on('hoverEdge', () => {
      networkInstance.current.canvas.body.container.style.cursor = 'pointer';
    });

    networkInstance.current.on('blurEdge', () => {
      networkInstance.current.canvas.body.container.style.cursor = 'default';
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalAmount = (transactions) => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const getPaidAmount = (transactions) => {
    return transactions
      .filter((t) => t.status)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ 
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        fontFamily: 'Orbitron, monospace'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ 
            color: '#00d4ff !important',
            width: '3rem', 
            height: '3rem',
            borderWidth: '0.3em'
          }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-light" style={{ fontFamily: 'Orbitron, monospace' }}>
            <i className="fas fa-network-wired me-2"></i>
            INITIALIZING NETWORK MATRIX...
          </h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ 
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        fontFamily: 'Orbitron, monospace'
      }}>
        <div className="alert alert-danger text-center border-0" style={{ 
          background: 'rgba(255,51,102,0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,51,102,0.5) !important',
          color: '#ffffff'
        }}>
          <h4 style={{ fontFamily: 'Orbitron, monospace' }}>SYSTEM ERROR</h4>
          <p>{error}</p>
          <button 
            className="btn btn-sm" 
            onClick={() => window.location.reload()}
            style={{ 
              background: 'rgba(255,51,102,0.3)',
              border: '1px solid rgba(255,51,102,0.5)',
              color: '#ffffff',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid vh-100 p-0">
        <div className="row flex-grow-1 m-0">
          <div className="col-12 p-0 position-relative">
            <div
              ref={networkRef}
              style={{
                height: '100vh',
                width: '100%',
                background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
                border: 'none',
              }}
            />

            {/* Legend positioned in the bottom right corner */}
            <div
              className="position-absolute bottom-0 end-0 m-3 p-3 rounded shadow-sm"
              style={{ 
                background: 'rgba(12,12,12,0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,212,255,0.3)',
                maxWidth: '200px',
                fontSize: '0.85rem',
                color: '#ffffff',
                fontFamily: 'Orbitron, monospace'
              }}
            >
              <h6 className="mb-2 text-primary" style={{ 
                color: '#00d4ff !important',
                fontFamily: 'Orbitron, monospace',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                <i className="fas fa-info-circle me-1"></i>
                NETWORK LEGEND
              </h6>
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: '#ff3366',
                    border: '2px solid #ff3366',
                    boxShadow: '0 0 8px rgba(255,51,102,0.7)'
                  }}></div>
                  <span>You</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: '#4ecdc4',
                    border: '2px solid #00d4ff',
                    boxShadow: '0 0 8px rgba(0,212,255,0.7)'
                  }}></div>
                  <span>Others</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div style={{
                    width: '20px', 
                    height: '3px', 
                    backgroundColor: '#ff3366',
                    boxShadow: '0 0 5px rgba(255,51,102,0.7)'
                  }}></div>
                  <span>Unpaid</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div style={{
                    width: '20px', 
                    height: '3px', 
                    backgroundColor: '#00ff88',
                    boxShadow: '0 0 5px rgba(0,255,136,0.7)'
                  }}></div>
                  <span>Paid</span>
                </div>
              </div>
            </div>

            {/* Instructions overlay */}
            <div 
              className="position-absolute top-0 end-0 m-3 p-3 rounded shadow-sm"
              style={{ 
                background: 'rgba(12,12,12,0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,212,255,0.3)',
                maxWidth: '250px', 
                fontSize: '0.85rem',
                color: '#ffffff',
                fontFamily: 'Orbitron, monospace'
              }}
            >
              <h6 className="mb-2" style={{ 
                color: '#00d4ff',
                fontFamily: 'Orbitron, monospace',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                <i className="fas fa-info-circle me-1"></i>
                INTERACTION PROTOCOL
              </h6>
              <ul className="mb-0 ps-3" style={{ fontSize: '0.8rem' }}>
                <li>Click connections to view details</li>
                <li>Drag nodes to rearrange</li>
                <li>Scroll to zoom in/out</li>
                <li>Hover for data highlights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

{/* Sci-fi Transaction Details Modal */}
{selectedTransaction && (
    <div 
        className={`modal fade ${showModal ? 'show d-block' : ''}`} 
        tabIndex="-1"
        style={{ backgroundColor: showModal ? 'rgba(0,0,0,0.8)' : 'transparent' }}
    >
        <div className="modal-dialog modal-lg modal-dialog-centered">
            <div 
                className="modal-content border-0"
                style={{ 
                    background: 'rgba(12,12,12,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,212,255,0.3)!important',
                    borderRadius: '15px',
                    boxShadow: '0 0 50px rgba(0,212,255,0.3)'
                }}
            >
                <div 
                    className="modal-header border-0"
                    style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.2), rgba(255,51,102,0.2))' }}
                >
                    <h5 
                        className="modal-title"
                        style={{ 
                            fontFamily: 'Orbitron, monospace', 
                            color: '#00d4ff',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        <i className="fas fa-database me-2"></i>
                        TRANSACTION DATA MATRIX
                    </h5>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={() => setShowModal(false)}
                        style={{ filter: 'drop-shadow(0 0 5px rgba(0,212,255,0.5))' }}
                    ></button>
                </div>
                <div className="modal-body" style={{ color: '#ffffff' }}>
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div 
                                className="card border-0"
                                style={{ 
                                    background: 'rgba(255,51,102,0.1)',
                                    border: '1px solid rgba(255,51,102,0.3)!important',
                                    borderRadius: '10px'
                                }}
                            >
                                <div className="card-body text-center">
                                    <h6 className="mb-1" style={{ 
                                        fontFamily: 'Orbitron, monospace', 
                                        color: '#ff3366',
                                        textTransform: 'uppercase',
                                        fontSize: '12px'
                                    }}>SOURCE NODE</h6>
                                    <h4 className="mb-0" style={{ 
                                        fontFamily: 'Orbitron, monospace',
                                        color: '#ffffff'
                                    }}>
                                        {selectedTransaction.fromUser}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div 
                                className="card border-0"
                                style={{ 
                                    background: 'rgba(0,212,255,0.1)',
                                    border: '1px solid rgba(0,212,255,0.3)!important',
                                    borderRadius: '10px'
                                }}
                            >
                                <div className="card-body text-center">
                                    <h6 className="mb-1" style={{ 
                                        fontFamily: 'Orbitron, monospace', 
                                        color: '#00d4ff',
                                        textTransform: 'uppercase',
                                        fontSize: '12px'
                                    }}>TARGET NODE</h6>
                                    <h4 className="mb-0" style={{ 
                                        fontFamily: 'Orbitron, monospace',
                                        color: '#ffffff'
                                    }}>
                                        {selectedTransaction.toUser}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-md-4">
    <div className="text-center">
                      <h6 className="mb-1" style={{ 
                        fontFamily: 'Orbitron, monospace', 
                        color: '#ff3366',
                        textTransform: 'uppercase',
                        fontSize: '12px'
                      }}>TOTAL AMOUNT</h6>
                      <h3 className="mb-0" style={{ 
                        fontFamily: 'Orbitron, monospace',
                        color: '#ffffff'
                      }}>₹{getTotalAmount(selectedTransaction.transactions)}</h3>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="text-center">
                      <h6 className="mb-1" style={{ 
                        fontFamily: 'Orbitron, monospace', 
                        color: '#00d4ff',
                        textTransform: 'uppercase',
                        fontSize: '12px'
                      }}>PAID AMOUNT</h6>
                      <h3 className="mb-0" style={{ 
                        fontFamily: 'Orbitron, monospace',
                        color: '#ffffff'
                      }}>₹{getPaidAmount(selectedTransaction.transactions)}</h3>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="text-center">
                      <h6 className="mb-1" style={{ 
                        fontFamily: 'Orbitron, monospace', 
                        color: '#ffcc00',
                        textTransform: 'uppercase',
                        fontSize: '12px'
                      }}>PENDING</h6>
                      <h3 className="mb-0" style={{ 
                        fontFamily: 'Orbitron, monospace',
                        color: '#ffffff'
                      }}>
                                    ₹{getTotalAmount(selectedTransaction.transactions) - getPaidAmount(selectedTransaction.transactions)}
                                </h3>
                            </div>
                        </div>
                    </div>

                <h6 className="border-bottom pb-2 mb-3" style={{ 
                  fontFamily: 'Orbitron, monospace',
                  color: '#00d4ff',
                  textTransform: 'uppercase'
                }}>
                  INDIVIDUAL TRANSACTIONS ({selectedTransaction.transactions.length})
                    </h6>
                    
                <div className="table-responsive" style={{ maxHeight: '300px' ,}}>
                  <table className="table" style={{ color: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.3)',backgroundColor:'rgba(0,0,0,0)'}}>
                    <thead style={{ 
                      background: 'rgb(0, 213, 255)',
                      fontFamily: 'Orbitron, monospace',
                      position: 'sticky',
                      top: 0,
                    }}>
                      <tr>
                        <th style={{ color: '#00d4ff' }}>DATE</th>
                        <th style={{ color: '#00d4ff' }}>DESCRIPTION</th>
                        <th style={{ color: '#00d4ff' }}>AMOUNT</th>
                        <th style={{ color: '#00d4ff' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedTransaction.transactions.map((transaction, index) => (
                        <tr key={index} style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                          <td className="small">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td>
                                            <div>
                                                {transaction.description || 'No description'}
                                            </div>
                                        </td>
                                        <td>
                                            <strong>₹{transaction.amount}</strong>
                                        </td>
                                        <td>
                            <span 
                              className={`badge ${transaction.status ? 'bg-success' : 'bg-warning'}`}
                              style={{ 
                                fontFamily: 'Orbitron, monospace',
                                textTransform: 'uppercase',
                                fontSize: '10px',
                                letterSpacing: '1px'
                              }}
                            >
                                                {transaction.status ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              <div className="modal-footer border-0" style={{ 
                background: 'linear-gradient(90deg, rgba(0,212,255,0.1), rgba(255,51,102,0.1))' 
              }}>
                    <button 
                        type="button" 
                  className="btn btn-sm" 
                        onClick={() => setShowModal(false)}
                  style={{ 
                    background: 'rgba(255,51,102,0.3)',
                    border: '1px solid rgba(255,51,102,0.5)',
                    color: '#ffffff',
                    fontFamily: 'Orbitron, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  Close Matrix
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

<link 
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
    rel="stylesheet" 
/>
<link 
    href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" 
    rel="stylesheet" 
/>

<style>{`
    body {
        background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
        font-family: 'Orbitron', monospace;
          overflow: hidden;
    }
    
    /* Custom scrollbar for sci-fi look */
    ::-webkit-scrollbar {
        width: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.3);
        border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: linear-gradient(45deg, #00d4ff, #0099cc);
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(0,212,255,0.5);
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(45deg, #00ff88, #00cc66);
        box-shadow: 0 0 15px rgba(0,255,136,0.5);
    }
    
    /* Glowing animation for elements */
    @keyframes glow {
        0% { box-shadow: 0 0 5px currentColor; }
        50% { box-shadow: 0 0 20px currentColor; }
        100% { box-shadow: 0 0 5px currentColor; }
    }
    
    .glow-effect {
        animation: glow 2s infinite;
    }
`}</style>
</>
);
}

export default Visualise;