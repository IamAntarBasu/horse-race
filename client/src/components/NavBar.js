import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NavBar = forwardRef((props, ref) => {
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();

  const fetchBalance = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!user || !user.id) return;
    setBalanceLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/user/balance/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBalance(data.balance);
        setBalanceLoading(false);
      })
      .catch(() => {
        setBalance(null);
        setBalanceLoading(false);
      });
  };

  useImperativeHandle(ref, () => ({
    refreshBalance: fetchBalance
  }));

  useEffect(() => {
    fetchBalance();
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored'
      });
      return;
    }

    setProcessingPayment(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          amount: parseFloat(paymentAmount)
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Payment successful!', {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored'
        });
        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchBalance();
      } else {
        toast.error(data.error || 'Payment failed', {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored'
        });
      }
    } catch (error) {
      toast.error('Payment failed', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div style={{ width: '100%', background: '#222', color: '#fff', padding: '12px 0', position: 'relative', minHeight: 56 }}>
        <div style={{ position: 'absolute', top: 12, right: 40, display: 'flex', gap: 20, alignItems: 'center', zIndex: 10 }}>
          {user && (
            <>
              <span style={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginRight: 8 }}>
                {user.first_name || user.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: '#ff4d4f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer',
                  marginLeft: 4
                }}
              >
                Logout
              </button>
            </>
          )}
          {balanceLoading ? (
            <span>Loading balance...</span>
          ) : balance ? (
            <>
              <div style={{ background: '#1e90ff', color: '#fff', borderRadius: 8, padding: '8px 18px', fontWeight: 'bold', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="coin">🪙</span> {parseFloat(balance.balance).toLocaleString()}
              </div>
              <div style={{ background: '#888', color: '#fff', borderRadius: 8, padding: '8px 18px', fontWeight: 'bold', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                Exp : {parseFloat(balance.exposure).toLocaleString()}
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{
                  background: '#52c41a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                Add Balance
              </button>
            </>
          ) : (
            <span>Balance not found</span>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            width: '90%',
            maxWidth: 400
          }}>
            <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 'bold' }}>Add Balance</h2>
            <div style={{ marginBottom: 20 }}>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 16,
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                style={{
                  padding: '8px 16px',
                  background: '#52c41a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: processingPayment ? 'not-allowed' : 'pointer',
                  opacity: processingPayment ? 0.7 : 1
                }}
              >
                {processingPayment ? 'Processing...' : 'Add Balance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default NavBar; 