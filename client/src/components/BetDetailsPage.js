import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Helper to parse the book string
function parseBook(bookStr) {
  if (!bookStr) return {};
  const parts = bookStr.split('|');
  const runnersStr = parts[parts.length - 1];
  const runnersArr = runnersStr.split(',');
  const result = {};
  runnersArr.forEach(runnerStr => {
    if (!runnerStr) return;
    const [runnerId, status, oddsStr] = runnerStr.split('~');
    result[runnerId] = { status, back: null, lay: { price: '-', size: '0' }, currentOdd: null };
    if (status !== 'ACTIVE') return;
    let back = null, lay = { price: '-', size: '0' }, currentOdd = null;
    if (oddsStr) {
      const groups = oddsStr.split('*');
      if (groups[0]) {
        const backParts = groups[0].split(':').filter(Boolean);
        if (backParts.length >= 2) {
          back = { price: backParts[0], size: backParts[1] };
          currentOdd = backParts[0];
        }
      }
      if (groups[1]) {
        const layParts = groups[1].split(':').filter(Boolean);
        if (layParts.length >= 2) {
          lay = { 
            price: layParts[0],
            size: layParts[1]
          };
        }
      }
    }
    result[runnerId] = { ...result[runnerId], back, lay, currentOdd };
  });
  return result;
}

const quickAmounts = [100, 500, 1000, 5000, 10000, 50000];
const numPad = [1,2,3,4,5,6,7,8,9,0,'00','.','⌫'];

const spinnerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh',
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

const SpinnerOverlay = () => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(255,255,255,0.7)', zIndex: 9999, display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      border: '8px solid #f3f3f3',
      borderTop: '8px solid #1bb6c9',
      borderRadius: '50%',
      width: 70,
      height: 70,
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
      }
    `}</style>
  </div>
);

const BetDetailsPage = () => {
  const { marketId } = useParams();
  const navBarRef = useRef();
  const betSlipRef = useRef();
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [oddsMap, setOddsMap] = useState({});
  const [betSlip, setBetSlip] = useState(null);
  const [tab, setTab] = useState('market');
  const [openBets, setOpenBets] = useState([]);
  const [marketStatus, setMarketStatus] = useState('ACTIVE');
  const openBetsCount = openBets.length;
  const [openBetsLoading, setOpenBetsLoading] = useState(false);
  const [oddsChangeHistory, setOddsChangeHistory] = useState({});
  const [adminOdds, setAdminOdds] = useState({});
  const [settledBets, setSettledBets] = useState([]);
  const prevSettledIds = useRef(new Set());
  const [placingBet, setPlacingBet] = useState(false);
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState(false);

  const fetchSportsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/sports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const sportsArray = Array.isArray(data.data) ? data.data : [];
      const found = sportsArray.find(item => item.catalogue.marketId === marketId);
      
      if (found) {
        setRace(found);
        setMarketStatus(found.metadata?.status || 'ACTIVE');
        
        if (found.metadata?.book) {
          const newOddsMap = parseBook(found.metadata.book);
          setOddsMap(prevOddsMap => {
            const changes = {};
            Object.entries(newOddsMap).forEach(([runnerId, odds]) => {
              if (prevOddsMap[runnerId]?.currentOdd !== odds.currentOdd) {
                changes[runnerId] = {
                  old: prevOddsMap[runnerId]?.currentOdd,
                  new: odds.currentOdd,
                  timestamp: new Date().toISOString()
                };
              }
            });
            if (Object.keys(changes).length > 0) {
              setOddsChangeHistory(prev => ({
                ...prev,
                ...changes
              }));
            }
            return newOddsMap;
          });
        }
      }
      setLoading(false);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  // Fetch open bets from API
  const fetchOpenBets = () => {
    setOpenBetsLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/api/bets/by-market?market_id=${marketId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOpenBets(data.bets || []);
        setOpenBetsLoading(false);
      })
      .catch(() => {
        setOpenBets([]);
        setOpenBetsLoading(false);
      });
  };

  const fetchSettledBets = () => {
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/api/bets/by-market?market_id=${marketId}&status=settled`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSettledBets(data.bets || []));
  };

  useEffect(() => {
    fetchSportsData();
    fetchOpenBets();
    fetchSettledBets();
    // Fetch admin odds
    const fetchAdminOdds = async () => {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/odds/${marketId}`);
      const data = await res.json();
      const oddsMap = {};
      (data.odds || []).forEach(o => {
        oddsMap[o.runner_id] = o;
      });
      setAdminOdds(oddsMap);
    };
    fetchAdminOdds();
    const pollInterval = setInterval(() => {
      fetchSportsData();
      fetchOpenBets();
      fetchSettledBets();
      fetchAdminOdds();
    }, 5000);
    return () => {
      clearInterval(pollInterval);
    };
  }, [marketId]);

  useEffect(() => {
    if (tab === 'openBets') {
      fetchOpenBets();
    }
  }, [tab, marketId]);

  // Notify user of new settlements
  useEffect(() => {
    if (settledBets.length > 0) {
      settledBets.forEach(bet => {
        if (!prevSettledIds.current.has(bet.id)) {
          toast.info(
            `Bet on ${bet.selection_name} was settled: ${bet.settlement_status === 'win' ? 'WIN' : 'LOSE'} (${bet.settled_amount > 0 ? '+' : ''}${bet.settled_amount})`,
            { position: 'top-center', theme: 'colored' }
          );
          prevSettledIds.current.add(bet.id);
        }
      });
    }
  }, [settledBets]);

  const handleSelect = (runner, type, odds) => {
    setBetSlip({
      runner,
      type,
      odds: parseFloat(odds.price),
      size: parseFloat(odds.size),
      stake: '',
      origOdds: parseFloat(odds.price)
    });
    setTimeout(() => {
      if (betSlipRef.current) {
        betSlipRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleOddsChange = (delta) => {
    setBetSlip(bet => ({ ...bet, odds: Math.max(1.01, parseFloat((bet.odds + delta).toFixed(2))) }));
  };

  const handleStakeChange = (val) => {
    setBetSlip(bet => ({ ...bet, stake: val }));
  };

  const handleQuickAmount = (amt) => {
    setBetSlip(bet => ({ ...bet, stake: String(amt) }));
  };

  const handleNumPad = (val) => {
    setBetSlip(bet => {
      let stake = bet.stake || '';
      if (val === '⌫') {
        stake = stake.slice(0, -1);
      } else {
        stake += val;
      }
      return { ...bet, stake };
    });
  };

  const handleCancel = () => setBetSlip(null);

  const handlePlaceBet = async () => {
    if (!betSlip || !betSlip.stake || isNaN(parseFloat(betSlip.stake))) return;
    setPlacingBet(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          market_id: marketId,
          runner_id: betSlip.runner.id,
          bet_type: betSlip.type.toLowerCase(),
          odds: betSlip.odds,
          bet_amount: parseFloat(betSlip.stake),
          selection_name: betSlip.runner.name,
          market_name: race?.catalogue?.marketName || ''
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBetSlip(null);
        if (navBarRef.current) navBarRef.current.refreshBalance();
        fetchOpenBets();
        toast.success('Bet placed successfully!', {
          position: 'top-center',
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'colored',
        });
      } else {
        toast.error(data.error || 'Failed to place bet', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'colored',
        });
      }
    } catch (e) {
      toast.error('Failed to place bet', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
    } finally {
      setPlacingBet(false);
    }
  };

  const handleBack = () => {
    setNavigating(true);
    setTimeout(() => {
      navigate('/betting/');
    }, 300); // short delay for spinner effect
  };

  if (loading) return <Spinner />;
  if (error) return <div>{error}</div>;
  if (!race) return <div>Race not found</div>;

  const isMarketSuspended = marketStatus !== 'ACTIVE';
  const isRunnerSuspended = (runnerId) => {
    const runner = oddsMap[runnerId];
    return !runner || runner.status !== 'ACTIVE';
  };

  const renderRunnerRow = (runner) => {
    // Use admin odds if available, otherwise fallback to external odds
    const odds = oddsMap[runner.id] || {};
    const admin = adminOdds[runner.id] || {};
    const mergedBack = admin.back_odds ? { price: admin.back_odds, size: admin.back_size } : odds.back;
    const mergedLay = admin.lay_odds
      ? {
          price: admin.lay_odds,
          size: admin.lay_size !== undefined && admin.lay_size !== null && admin.lay_size !== ''
            ? admin.lay_size
            : (odds.lay?.size ?? '0')
        }
      : odds.lay;
    const suspended = isRunnerSuspended(runner.id);
    const isSelected = betSlip && betSlip.runner.id === runner.id;
    const columnStyle = { padding: 0, border: '1px solid #ccc', width: 120, minWidth: 120, maxWidth: 120 };
    return (
      <tr key={runner.id}>
        <td style={{ padding: 8, border: '1px solid #ccc' }}>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>{runner.name}</div>
          <div style={{ fontSize: 15, color: '#222', fontWeight: 400 }}>{runner.metadata?.JOCKEY_NAME || '-'}</div>
        </td>
        {suspended ? (
          <td colSpan={2} style={{ ...columnStyle }}>
            <div style={{
              background: '#888',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: 6,
              padding: '8px 0',
              textAlign: 'center',
              fontSize: 18,
              margin: 2
            }}>
              Suspended
            </div>
          </td>
        ) : (
          <>
            <td style={columnStyle}>
              {mergedBack ? (
                <div
                  style={{
                    background: isSelected && betSlip.type === 'Back' ? '#0074d9' : '#4da6ff',
                    color: '#222',
                    fontWeight: 'bold',
                    borderRadius: 6,
                    padding: '8px 0',
                    textAlign: 'center',
                    fontSize: 18,
                    margin: 2,
                    cursor: 'pointer',
                    border: isSelected && betSlip.type === 'Back' ? '2px solid #222' : 'none',
                    boxShadow: isSelected && betSlip.type === 'Back' ? '0 0 8px #0074d9' : 'none'
                  }}
                  onClick={() => handleSelect(runner, 'Back', mergedBack)}
                >
                  {mergedBack.price}
                  <div style={{ fontSize: 12, color: '#222', fontWeight: 400 }}>
                    {mergedBack.size ? (parseFloat(mergedBack.size) * 20).toFixed(2) : '0'}
                  </div>
                </div>
              ) : '-'}
            </td>
            <td style={columnStyle}>
              {mergedLay ? (
                <div
                  style={{
                    background: isSelected && betSlip.type === 'Lay' ? '#ff4d4f' : '#ffb3c6',
                    color: '#222',
                    fontWeight: 'bold',
                    borderRadius: 6,
                    padding: '8px 0',
                    textAlign: 'center',
                    fontSize: 18,
                    margin: 2,
                    cursor: 'pointer',
                    border: isSelected && betSlip.type === 'Lay' ? '2px solid #222' : 'none',
                    boxShadow: isSelected && betSlip.type === 'Lay' ? '0 0 8px #ff4d4f' : 'none'
                  }}
                  onClick={() => handleSelect(runner, 'Lay', mergedLay)}
                >
                  {mergedLay.price}
                  <div style={{ fontSize: 12, color: '#222', fontWeight: 400 }}>
                    {mergedLay.size ? (parseFloat(mergedLay.size) * 20).toFixed(2) : '0'}
                  </div>
                </div>
              ) : '-'}
            </td>
          </>
        )}
      </tr>
    );
  };

  const renderBetSlip = () => {
    if (!betSlip) return null;

    const isDisabled = isMarketSuspended || isRunnerSuspended(betSlip.runner.id);
    const quickBtnColor = '#4da6ff';
    const quickBtnTextColor = '#fff';

    return (
      <div ref={betSlipRef} style={{ 
        marginTop: 30, 
        background: '#e9f6ff', 
        borderRadius: 10, 
        padding: 20, 
        boxShadow: '0 2px 8px #bbb',
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
          <span style={{ fontWeight: 'bold', fontSize: 18 }}>{betSlip.runner.name}</span>
          <span
            style={{
              fontWeight: 'bold',
              color: betSlip.type === 'Lay' ? '#ff4d4f' : '#0074d9',
              fontSize: 18
            }}
          >
            {betSlip.type}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: 18 }}>@</span>
          <button onClick={() => handleOddsChange(-0.01)} style={{ fontSize: 20, marginRight: 6, background: '#ccc', border: 'none', borderRadius: 4, width: 32, height: 32, cursor: 'pointer' }}>-</button>
          <span style={{ fontWeight: 'bold', fontSize: 20, minWidth: 50, display: 'inline-block', textAlign: 'center' }}>{betSlip.odds}</span>
          <button onClick={() => handleOddsChange(0.01)} style={{ fontSize: 20, marginLeft: 6, background: '#ccc', border: 'none', borderRadius: 4, width: 32, height: 32, cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          {quickAmounts.map(amt => {
            const isSelected = betSlip.stake === String(amt);
            const bgColor = betSlip.type === 'Lay'
              ? (isSelected ? '#ff4d4f' : '#ffb3c6')
              : (isSelected ? '#0074d9' : '#4da6ff');
            const color = '#fff';
            return (
              <button
                key={amt}
                onClick={() => handleQuickAmount(amt)}
                style={{
                  background: bgColor,
                  color,
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                {amt}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={betSlip.stake}
            readOnly
            style={{ width: 120, fontSize: 20, textAlign: 'center', border: '2px solid #0074d9', borderRadius: 6, padding: 6, background: '#fff' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', maxWidth: 400, margin: '0 auto 16px auto' }}>
          {numPad.map(val => (
            <button
              key={val}
              onClick={() => handleNumPad(val)}
              style={{ width: 60, height: 40, fontSize: 18, margin: 2, background: '#f0f0f0', border: '1px solid #bbb', borderRadius: 6, cursor: 'pointer' }}
            >
              {val}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button 
            onClick={handleCancel} 
            style={{ 
              background: '#ff4d4f', 
              color: '#fff', 
              fontWeight: 'bold', 
              border: 'none', 
              borderRadius: 6, 
              padding: '12px 32px', 
              fontSize: 18, 
              cursor: 'pointer',
              opacity: isDisabled || placingBet ? 0.5 : 1
            }}
            disabled={isDisabled || placingBet}
          >
            Cancel
          </button>
          <button 
            onClick={handlePlaceBet} 
            disabled={isDisabled || placingBet}
            style={{ 
              background: '#00c853', 
              color: '#fff', 
              fontWeight: 'bold', 
              border: 'none', 
              borderRadius: 6, 
              padding: '12px 32px', 
              fontSize: 18, 
              cursor: isDisabled || placingBet ? 'not-allowed' : 'pointer',
              opacity: isDisabled || placingBet ? 0.5 : 1
            }}
          >
            {placingBet ? (
              <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #fff', borderTop: '3px solid #00c853', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              'Place Bet'
            )}
          </button>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div style={{ padding: 20, position: 'relative' }}>
      {navigating && <SpinnerOverlay />}
      <NavBar ref={navBarRef} />
      <ToastContainer />
      <button onClick={handleBack} style={{ marginBottom: 16, background: '#eee', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>Back</button>
      <div style={{ marginTop: 70 }}>
        {/* Toggle Bar */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
          <button
            onClick={() => setTab('market')}
            style={{
              flex: 1,
              background: tab === 'market' ? '#1bb6c9' : '#444',
              color: tab === 'market' ? '#fff' : '#bbb',
              fontWeight: 'bold',
              fontSize: 18,
              border: 'none',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'background 0.2s',
              outline: 'none',
            }}
          >
            Market
          </button>
          <button
            onClick={() => setTab('openBets')}
            style={{
              flex: 1,
              background: tab === 'openBets' ? '#1bb6c9' : '#444',
              color: tab === 'openBets' ? '#fff' : '#bbb',
              fontWeight: 'bold',
              fontSize: 18,
              border: 'none',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'background 0.2s',
              outline: 'none',
            }}
          >
            Open Bets ({openBetsCount})
          </button>
          <button
            onClick={() => setTab('settledBets')}
            style={{
              flex: 1,
              background: tab === 'settledBets' ? '#1bb6c9' : '#444',
              color: tab === 'settledBets' ? '#fff' : '#bbb',
              fontWeight: 'bold',
              fontSize: 18,
              border: 'none',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'background 0.2s',
              outline: 'none',
            }}
          >
            Settled Bets
          </button>
        </div>

        {tab === 'market' ? (
          <>
            <h2>{race?.event?.name}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: 8, border: '1px solid #ccc' }}>Runner</th>
                  <th style={{ padding: 8, border: '1px solid #ccc', background: '#4da6ff', color: '#222', fontWeight: 'bold', fontSize: 18 }}>Back</th>
                  <th style={{ padding: 8, border: '1px solid #ccc', background: '#ffb3c6', color: '#222', fontWeight: 'bold', fontSize: 18 }}>Lay</th>
                </tr>
              </thead>
              <tbody>
                {race?.catalogue?.runners.map(renderRunnerRow)}
              </tbody>
            </table>
            {renderBetSlip()}
          </>
        ) : tab === 'openBets' ? (
          <div style={{ background: '#fff', borderRadius: 10, padding: 0, marginTop: 20, minHeight: 200, boxShadow: '0 2px 8px #bbb' }}>
            {openBetsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 18 }}>Loading open bets...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1bb6c9' }}>
                    <th style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, padding: 10, textAlign: 'left' }}>Matched Bet</th>
                    <th style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, padding: 10 }}>Odds</th>
                    <th style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, padding: 10 }}>Stake</th>
                  </tr>
                </thead>
                <tbody>
                  {openBets.map((bet) => (
                    <tr key={bet.id} style={{ background: '#7ecbff' }}>
                      <td style={{ padding: 10, fontWeight: 'bold', color: '#222' }}>
                        {bet.selection_name} - {bet.market_name}
                      </td>
                      <td style={{ padding: 10, color: '#222', fontWeight: 'bold', textAlign: 'center' }}>
                        {bet.odds}
                      </td>
                      <td style={{ padding: 10, color: '#222', fontWeight: 'bold', textAlign: 'center' }}>
                        {Number(bet.bet_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 10, padding: 0, marginTop: 20, minHeight: 200, boxShadow: '0 2px 8px #bbb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1bb6c9' }}>
                  <th style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, padding: 10, textAlign: 'left' }}>Settled Bet</th>
                  <th style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, padding: 10 }}>Result</th>
                  <th style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, padding: 10 }}>Amount</th>
                  <th style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, padding: 10 }}>Settled At</th>
                </tr>
              </thead>
              <tbody>
                {settledBets.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: '#888' }}>No settled bets yet.</td></tr>
                ) : (
                  settledBets.map((bet) => (
                    <tr key={bet.id} style={{ background: bet.settlement_status === 'win' ? '#d4ffd4' : '#ffd4d4' }}>
                      <td style={{ padding: 10, fontWeight: 'bold', color: '#222' }}>
                        {bet.selection_name} - {bet.market_name}
                      </td>
                      <td style={{ padding: 10, color: '#222', fontWeight: 'bold', textAlign: 'center' }}>
                        {bet.settlement_status === 'win' ? 'WIN' : 'LOSE'}
                      </td>
                      <td style={{ padding: 10, color: '#222', fontWeight: 'bold', textAlign: 'center' }}>
                        {bet.settled_amount > 0 ? '+' : ''}{bet.settled_amount}
                      </td>
                      <td style={{ padding: 10, color: '#222', fontWeight: 'bold', textAlign: 'center' }}>
                        {bet.settled_at ? new Date(bet.settled_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetDetailsPage; 