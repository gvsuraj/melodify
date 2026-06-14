import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useVibe } from "./contexts/VibeContext";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Sidebar from "./components/Sidebar/Sidebar";
import Player from "./components/Player/Player";
import Home from "./components/Home/Home";
import Search from "./components/Search/Search";
import Playlists from "./components/Playlist/Playlists";
import PlaylistDetail from "./components/Playlist/PlaylistDetail";
import Library from "./components/Library/Library";
import Settings from "./components/Settings/Settings";
import VibeTogether from "./components/Vibe/VibeTogether";
import Room from "./components/Vibe/Room";
import ToastContainer from "./components/Toast/Toast";
import "./App.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function RoomAutoLeave() {
  const { isInRoom, leaveRoom } = useVibe();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isInRoom) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (location.pathname === "/room") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          leaveRoom();
          timerRef.current = null;
        }, 30000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isInRoom, location.pathname, leaveRoom]);

  return null;
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <RoomAutoLeave />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/vibe-together" element={<VibeTogether />} />
          <Route path="/room" element={<Room />} />
        </Routes>
      </main>
      <Player />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" /> : <Signup />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
