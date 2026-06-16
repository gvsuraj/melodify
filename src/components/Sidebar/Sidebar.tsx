import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen((o) => !o)} aria-label="Toggle menu">
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        )}
      </button>
      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-logo">
          <h2>Melodify</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 3L4 9v12h5v-7h6v7h5V9z"/></svg>
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span>Search</span>
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>
            <span>Library</span>
          </NavLink>
          <NavLink to="/playlists" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
            <span>Playlists</span>
          </NavLink>
          <NavLink to="/vibe-together" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 3H3v18h18V3zm-4 10h-2v4h-2v-4h-2v-2h2V7h2v4h2v2z"/></svg>
            <span>Vibe Together</span>
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.displayName?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="user-name">{user?.displayName || user?.email}</span>
          </div>
          <NavLink to="/settings" className="settings-icon-btn" title="Settings">
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
