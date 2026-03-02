import React, { useState } from "react";

const Apps = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const apps = [
    {
      id: 1,
      name: "Coin",
      description: "Buy direct mutual funds online with zero commission.",
      status: "Installed",
      link: "https://coin.zerodha.com",
    },
    {
      id: 2,
      name: "Kite Connect",
      description: "Build powerful trading platforms with HTTP/JSON APIs.",
      status: "Available",
      link: "https://kite.trade",
    },
    {
      id: 3,
      name: "Console",
      description: "The central dashboard for your Zerodha account.",
      status: "Installed",
      link: "https://console.zerodha.com",
    },
    {
      id: 4,
      name: "Varsity",
      description: "Mobile app for stock market education.",
      status: "Available",
      link: "https://zerodha.com/varsity",
    },
    {
      id: 5,
      name: "Sentinel",
      description: "Create powerful market alerts on the cloud.",
      status: "Available",
      link: "https://sentinel.zerodha.com",
    },
    {
      id: 6,
      name: "Smallcase",
      description: "Thematic investment platform.",
      status: "Available",
      link: "https://smallcase.zerodha.com",
    },
    {
      id: 7,
      name: "Streak",
      description: "Algo trading without coding.",
      status: "Available",
      link: "https://streak.zerodha.com",
    },
  ];

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleLaunch = (link) => {
    window.open(link, "_blank");
  };

  return (
    <div className="apps-container">
      <div className="apps-header">
        <h3 className="title">Apps</h3>
        <input
          type="text"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="apps-grid">
        {filteredApps.map((app) => (
          <div key={app.id} className="app-card">
            <div className="app-header">
              <h4>{app.name}</h4>
              <span className={`status ${app.status.toLowerCase()}`}>
                {app.status}
              </span>
            </div>
            <p>{app.description}</p>
            <button
              className="btn-launch"
              onClick={() => handleLaunch(app.link)}
            >
              Launch
            </button>
          </div>
        ))}
      </div>
      <style>{`
        .apps-container { padding: 20px; }
        .apps-header { display: flex; justify-content: space-between; align-items: center; }
        .search-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; width: 250px; font-size: 0.9rem; }
        .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .app-card { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: transform 0.2s; display: flex; flex-direction: column; justify-content: space-between; }
        .app-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .app-header h4 { margin: 0; font-size: 1.1rem; color: #444; }
        .status { font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; }
        .status.installed { background: #e8f5e9; color: #2e7d32; }
        .status.available { background: #e3f2fd; color: #1976d2; }
        .app-card p { color: #666; font-size: 0.9rem; margin-bottom: 20px; }
        .btn-launch { width: 100%; padding: 10px; background: #387ed1; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
        .btn-launch:hover { background: #316cb9; }
        
        body.dark-mode .app-card { background: #1e1e1e; border-color: #333; }
        body.dark-mode .app-header h4 { color: #e0e0e0; }
        body.dark-mode .app-card p { color: #aaa; }
        body.dark-mode .search-input { background: #2d2d2d; border-color: #444; color: #e0e0e0; }
      `}</style>
    </div>
  );
};

export default Apps;
