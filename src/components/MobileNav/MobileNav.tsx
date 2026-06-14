import { NavLink } from "react-router-dom";
import "./MobileNav.css";

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      <NavLink to="/" end className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 3L4 9v12h5v-7h6v7h5V9z"/></svg>
        <span>Home</span>
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <span>Search</span>
      </NavLink>
      <NavLink to="/library" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>
        <span>Library</span>
      </NavLink>
      <NavLink to="/playlists" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
        <span>Playlists</span>
      </NavLink>
      <NavLink to="/vibe-together" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M21 3H3v18h18V3zm-4 10h-2v4h-2v-4h-2v-2h2V7h2v4h2v2z"/></svg>
        <span>Vibe</span>
      </NavLink>
    </nav>
  );
}
