import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';

const groupData = (data) => {
  if (!Array.isArray(data)) return {};
  const grouped = {};
  data.forEach(item => {
    const country = item.event.countryCode;
    const racecourse = item.event.name;
    if (!grouped[country]) grouped[country] = {};
    if (!grouped[country][racecourse]) grouped[country][racecourse] = [];
    grouped[country][racecourse].push(item);
  });
  return grouped;
};

const BettingPage = () => {
  const [sportsData, setSportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sports`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setSportsData(data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sports:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchSports();
  }, []);

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '60vh' 
    }}>
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
  
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</div>;

  const grouped = groupData(sportsData);

  // Find all currently running games (inPlay === true)
  const liveMarketIds = sportsData
    .filter(market => market.catalogue.inPlay === true)
    .map(market => market.catalogue.marketId);

  // Find the current game (IN_PLAY or soonest OPEN)
  const now = new Date();
  let currentMarketId = null;
  let soonestTime = Infinity;
  sportsData.forEach(market => {
    const status = market.catalogue.status;
    const inPlay = market.catalogue.inPlay;
    const marketTime = new Date(market.catalogue.marketTime).getTime();
    if (inPlay === true) {
      currentMarketId = market.catalogue.marketId;
      soonestTime = marketTime;
    } else if (status === 'OPEN' && marketTime > now.getTime() && marketTime < soonestTime) {
      currentMarketId = market.catalogue.marketId;
      soonestTime = marketTime;
    }
  });

  return (
    <div style={{ padding: 20, position: 'relative' }}>
      <NavBar />
      <div style={{ marginTop: 70 }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: '#666' }}>
            No races available at the moment
          </div>
        ) : (
          Object.keys(grouped).map(country => (
            <div key={country} style={{ marginBottom: 30 }}>
              <div style={{ background: '#16a2b8', color: '#fff', padding: 8, fontWeight: 'bold', fontSize: 18 }}>{country}</div>
              {Object.keys(grouped[country]).map(racecourse => (
                <div key={racecourse} style={{ margin: '10px 0', paddingLeft: 20 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 5 }}>{racecourse}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {grouped[country][racecourse].map((race, idx) => {
                      const isCurrent = liveMarketIds.includes(race.catalogue.marketId);
                      return (
                        <div key={idx} style={{ background: '#eee', borderRadius: 4, padding: '6px 12px', marginBottom: 4 }}>
                          <Link to={`/betting/${race.catalogue.marketId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <span style={{ color: isCurrent ? 'green' : undefined, fontWeight: isCurrent ? 'bold' : undefined }}>
                              {new Date(race.catalogue.marketTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isCurrent ? ' (LIVE)' : ''}
                            </span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BettingPage; 