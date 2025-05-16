import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const spinnerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '40vh',
};

const Spinner = () => (
  <div style={spinnerStyle}>
    <div style={{
      border: '8px solid #f3f3f3',
      borderTop: '8px solid #1bb6c9',
      borderRadius: '50%',
      width: 70,
      height: 70,
      animation: 'spin 1s linear infinite',
      marginBottom: 20
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    <div style={{ fontSize: 22, color: '#1bb6c9', fontWeight: 'bold' }}>Loading...</div>
  </div>
);

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balanceEdits, setBalanceEdits] = useState({});
  const [selectedMarket, setSelectedMarket] = useState('');
  const [marketRunners, setMarketRunners] = useState([]);
  const [marketOdds, setMarketOdds] = useState({});
  const [markets, setMarkets] = useState([]);
  const [externalMarketOdds, setExternalMarketOdds] = useState({});
  const [mergedMarketOdds, setMergedMarketOdds] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/all-with-balance`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Failed to fetch users', { position: 'top-center', theme: 'colored' });
    }
    setLoading(false);
  };

  const fetchMarketsAndRunners = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/sports`);
      const data = await res.json();
      const sportsArray = Array.isArray(data.data) ? data.data : [];
      setMarkets(sportsArray.map(m => ({
        marketId: m.catalogue.marketId,
        marketName: m.event.name + ' - ' + m.catalogue.marketName,
        marketTime: m.catalogue.marketTime,
        runners: m.catalogue.runners
      })));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMarketsAndRunners();
  }, []);

  const handleMarketSelect = async (marketId) => {
    setSelectedMarket(marketId);
    const market = markets.find(m => m.marketId === marketId);
    setMarketRunners(market ? market.runners : []);
    // Fetch admin odds for this market
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/odds/${marketId}`);
      const data = await res.json();
      const oddsMap = {};
      (data.odds || []).forEach(o => {
        oddsMap[o.runner_id] = o;
      });
      setMarketOdds(oddsMap);
    } catch (err) {
      setMarketOdds({});
    }
    // Fetch external odds for this market
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/sports`);
      const data = await res.json();
      const marketData = (data.data || []).find(m => m.catalogue.marketId === marketId);
      const oddsMap = {};
      if (marketData && marketData.metadata && marketData.metadata.book) {
        // Parse the book string for external odds
        const runnersStr = marketData.metadata.book.split('|').pop();
        runnersStr.split(',').forEach(runnerStr => {
          if (!runnerStr) return;
          const [runnerId, status, oddsStr] = runnerStr.split('~');
          if (status !== 'ACTIVE') return;
          let back_odds = '', back_size = '', lay_odds = '', lay_size = '';
          if (oddsStr) {
            const groups = oddsStr.split('*');
            if (groups[0]) {
              const backParts = groups[0].split(':').filter(Boolean);
              if (backParts.length >= 2) {
                back_odds = backParts[0];
                back_size = backParts[1];
              }
            }
            if (groups[1]) {
              const layParts = groups[1].split(':').filter(Boolean);
              if (layParts.length >= 2) {
                lay_odds = layParts[0];
                lay_size = layParts[1];
              }
            }
          }
          oddsMap[runnerId] = { back_odds, back_size, lay_odds, lay_size };
        });
      }
      setExternalMarketOdds(oddsMap);
    } catch (err) {
      setExternalMarketOdds({});
    }
  };

  const handleBalanceChange = (userId, value) => {
    setBalanceEdits(edits => ({ ...edits, [userId]: value }));
  };

  const handleUpdateBalance = async (userId) => {
    const newBalance = balanceEdits[userId];
    if (isNaN(newBalance) || newBalance === '') {
      toast.error('Please enter a valid number', { position: 'top-center', theme: 'colored' });
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/balance/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: parseFloat(newBalance) })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Balance updated!', { position: 'top-center', theme: 'colored' });
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update balance', { position: 'top-center', theme: 'colored' });
      }
    } catch (err) {
      toast.error('Failed to update balance', { position: 'top-center', theme: 'colored' });
    }
  };

  const [oddsEdits, setOddsEdits] = useState({});
  const handleOddsEdit = (runnerId, field, value) => {
    setOddsEdits(edits => ({
      ...edits,
      [runnerId]: {
        ...edits[runnerId],
        [field]: value
      }
    }));
  };

  const fetchMergedOdds = async (marketId) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/sports?ts=${Date.now()}`); // cache-busting param
    const data = await res.json();
    const marketData = (data.data || []).find(m => m.catalogue.marketId === marketId);
    const oddsMap = {};
    if (marketData && marketData.metadata && marketData.metadata.book) {
      const runnersStr = marketData.metadata.book.split('|').pop();
      runnersStr.split(',').forEach(runnerStr => {
        if (!runnerStr) return;
        const [runnerId, status, oddsStr] = runnerStr.split('~');
        if (status !== 'ACTIVE') return;
        let back_odds = '', back_size = '', lay_odds = '', lay_size = '';
        if (oddsStr) {
          const groups = oddsStr.split('*');
          if (groups[0]) {
            const backParts = groups[0].split(':').filter(Boolean);
            if (backParts.length >= 2) {
              back_odds = backParts[0];
              back_size = backParts[1];
            }
          }
          if (groups[1]) {
            const layParts = groups[1].split(':').filter(Boolean);
            if (layParts.length >= 2) {
              lay_odds = layParts[0];
              lay_size = layParts[1];
            }
          }
        }
        oddsMap[runnerId] = { back_odds, back_size, lay_odds, lay_size };
      });
    }
    setMergedMarketOdds(oddsMap);
  };

  const handleUpdateOdds = async (marketId, runnerId) => {
    const edit = oddsEdits[runnerId] || {};
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/odds/${marketId}/${runnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          back_odds: edit.back_odds,
          back_size: edit.back_size,
          lay_odds: edit.lay_odds,
          lay_size: edit.lay_size
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Odds updated!', { position: 'top-center', theme: 'colored' });
        handleMarketSelect(marketId); // Only call this, it will fetch merged odds
      } else {
        toast.error(data.error || 'Failed to update odds', { position: 'top-center', theme: 'colored' });
      }
    } catch (err) {
      toast.error('Failed to update odds', { position: 'top-center', theme: 'colored' });
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <ToastContainer />
      <h2 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 24 }}>Admin Dashboard</h2>
      {loading ? (
        <Spinner />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #bbb' }}>
          <thead>
            <tr style={{ background: '#1bb6c9', color: '#fff' }}>
              <th style={{ padding: 12 }}>Username</th>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>First Name</th>
              <th style={{ padding: 12 }}>Last Name</th>
              <th style={{ padding: 12 }}>Role</th>
              <th style={{ padding: 12 }}>Active</th>
              <th style={{ padding: 12 }}>Balance</th>
              <th style={{ padding: 12 }}>Exposure</th>
              <th style={{ padding: 12 }}>Update Balance</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 10 }}>{user.username}</td>
                <td style={{ padding: 10 }}>{user.email}</td>
                <td style={{ padding: 10 }}>{user.first_name}</td>
                <td style={{ padding: 10 }}>{user.last_name}</td>
                <td style={{ padding: 10 }}>{user.role}</td>
                <td style={{ padding: 10 }}>{user.is_active ? 'Yes' : 'No'}</td>
                <td style={{ padding: 10 }}>{user.balance}</td>
                <td style={{ padding: 10 }}>{user.exposure}</td>
                <td style={{ padding: 10 }}>
                  <input
                    type="number"
                    value={balanceEdits[user.id] ?? ''}
                    onChange={e => handleBalanceChange(user.id, e.target.value)}
                    placeholder="New balance"
                    style={{ width: 100, marginRight: 8, padding: 4, borderRadius: 4, border: '1px solid #bbb' }}
                  />
                  <button
                    onClick={() => handleUpdateBalance(user.id)}
                    style={{ background: '#1bb6c9', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Market Odds Editor</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <select value={selectedMarket} onChange={e => handleMarketSelect(e.target.value)} style={{ padding: 8, fontSize: 16 }}>
            <option value="">Select Market</option>
            {markets.map(m => (
              <option key={m.marketId} value={m.marketId}>
                {m.marketName} ({new Date(m.marketTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </option>
            ))}
          </select>
        </div>
        {selectedMarket && marketRunners.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #bbb' }}>
            <thead>
              <tr style={{ background: '#1bb6c9', color: '#fff' }}>
                <th style={{ padding: 12 }}>Runner</th>
                <th style={{ padding: 12 }}>Current Back Odds</th>
                <th style={{ padding: 12 }}>Current Back Size</th>
                <th style={{ padding: 12 }}>Current Lay Odds</th>
                <th style={{ padding: 12 }}>Current Lay Size</th>
                <th style={{ padding: 12 }}>Updated Back Odds</th>
                <th style={{ padding: 12 }}>Updated Back Size</th>
                <th style={{ padding: 12 }}>Updated Lay Odds</th>
                <th style={{ padding: 12 }}>Updated Lay Size</th>
                <th style={{ padding: 12 }}>Update</th>
              </tr>
            </thead>
            <tbody>
              {marketRunners.map(runner => {
                const extOdds = externalMarketOdds[runner.id] || {};
                const odds = marketOdds[runner.id] || {};
                const edit = oddsEdits[runner.id] || {};
                // Use admin odds if available, otherwise fallback to external odds
                const currentBackOdds = odds.back_odds ?? extOdds.back_odds;
                const currentBackSize = odds.back_size ?? extOdds.back_size;
                const currentLayOdds = odds.lay_odds ?? extOdds.lay_odds;
                const currentLaySize = odds.lay_size ?? extOdds.lay_size;
                return (
                  <tr key={runner.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>{runner.name}</td>
                    <td style={{ padding: 10 }}>{currentBackOdds}</td>
                    <td style={{ padding: 10 }}>{currentBackSize ? (parseFloat(currentBackSize) * 20).toFixed(2) : '0'}</td>
                    <td style={{ padding: 10 }}>{currentLayOdds}</td>
                    <td style={{ padding: 10 }}>{currentLaySize ? (parseFloat(currentLaySize) * 20).toFixed(2) : '0'}</td>
                    <td style={{ padding: 10 }}>
                      <input type="number" value={edit.back_odds ?? odds.back_odds ?? ''} onChange={e => handleOddsEdit(runner.id, 'back_odds', e.target.value)} style={{ width: 80 }} />
                    </td>
                    <td style={{ padding: 10 }}>
                      <input type="number" value={edit.back_size ?? odds.back_size ?? ''} onChange={e => handleOddsEdit(runner.id, 'back_size', e.target.value)} style={{ width: 80 }} />
                    </td>
                    <td style={{ padding: 10 }}>
                      <input type="number" value={edit.lay_odds ?? odds.lay_odds ?? ''} onChange={e => handleOddsEdit(runner.id, 'lay_odds', e.target.value)} style={{ width: 80 }} />
                    </td>
                    <td style={{ padding: 10 }}>
                      <input type="number" value={edit.lay_size ?? odds.lay_size ?? ''} onChange={e => handleOddsEdit(runner.id, 'lay_size', e.target.value)} style={{ width: 80 }} />
                    </td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => handleUpdateOdds(selectedMarket, runner.id)} style={{ background: '#1bb6c9', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Update</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 