import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePlayer } from "../../contexts/PlayerContext";
import { useToast } from "../../contexts/ToastContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { stop } = usePlayer();
  const { showToast } = useToast();

  const handleLogout = async () => {
    stop();
    await logout();
    showToast("Logged out successfully.");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Melodify</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 3L4 9v12h5v-7h6v7h5V9z"/></svg>
          Home
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          Search
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>
          Library
        </NavLink>
        <NavLink to="/playlists" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
          Playlists
        </NavLink>
      </nav>
      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">
            {user?.displayName?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="user-name">{user?.displayName || user?.email}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        </button>
      </div>
    </aside>
  );
}
