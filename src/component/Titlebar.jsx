import React, { useState, useEffect } from "react";
import "./Titlebar.css";
import { Bell, Settings, User } from "lucide-react";
import { apiRequest } from "../lib/api";

// Custom hook for media queries
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

export default function Titlebar({
  activeMenu,
  toggleSidebar,
  sidebarWidth,
  onLogout,
  username,
  role,
  currentUserId,
  roleCode,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [clearedIds, setClearedIds] = useState(new Set());
  const [readIds, setReadIds] = useState(new Set());
  const [unreadIds, setUnreadIds] = useState(new Set());
  const [changing, setChanging] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const isAdmin = (roleCode || "").toUpperCase().includes("ADMIN");
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUserId) {
        setNotifications([]);
        setUnreadIds(new Set());
        return;
      }
      try {
        const requests = [];
        // For regular users: their own lost/claim updates
        requests.push(
          apiRequest("/api/v1/lost-reports", {
            params: { userId: currentUserId, size: 5 },
          }),
        );
        requests.push(
          apiRequest("/api/v1/claims", {
            params: { userId: currentUserId, size: 5 },
          }),
        );
        // All users: latest lost/found reports
        requests.push(
          apiRequest("/api/v1/lost-reports", {
            params: { status: "PENDING", size: 5 },
          }),
        );
        requests.push(
          apiRequest("/api/v1/found-reports", {
            params: { size: 5 },
          }),
        );
        // Admin: watch new lost, found, claims
        if (isAdmin) {
          requests.push(
            apiRequest("/api/v1/claims", {
              params: { status: "PENDING", size: 5 },
            }),
          );
        }
        const responses = await Promise.all(requests);
        const [
          userLost,
          userClaims,
          recentLost,
          recentFound,
          adminClaims,
        ] = responses;

        const lostNotes = (userLost?.content || userLost || [])
          .filter((lr) => lr.status && lr.status !== "PENDING")
          .map((lr) => ({
            id: `lost-${lr.id}`,
            title: "Lost report update",
            text: `${lr.referenceCode || `Lost #${lr.id}`} is now ${lr.status}`,
            meta: lr.updatedAt || lr.createdAt,
          }));
        const claimNotes = (userClaims?.content || userClaims || []).map((c) => ({
          id: `claim-${c.id}`,
          title: "Claim update",
          text: `Claim #${c.id} is ${c.status}`,
          meta: c.updatedAt || c.createdAt,
        }));
        const generalNotes = [];
        (recentLost?.content || recentLost || []).forEach((lr) =>
          generalNotes.push({
            id: `public-lost-${lr.id}`,
            title: "New lost report",
            text: `${lr.referenceCode || `Lost #${lr.id}`} reported`,
            meta: lr.createdAt,
          }),
        );
        (recentFound?.content || recentFound || []).forEach((fr) =>
          generalNotes.push({
            id: `public-found-${fr.id}`,
            title: "New found report",
            text: `${fr.referenceCode || `Found #${fr.id}`} submitted`,
            meta: fr.createdAt,
          }),
        );

        const adminNotes = [];
        if (isAdmin) {
          (adminClaims?.content || adminClaims || []).forEach((cl) =>
            adminNotes.push({
              id: `admin-claim-${cl.id}`,
              title: "New claim",
              text: `Claim #${cl.id} pending review`,
              meta: cl.createdAt,
            }),
          );
        }
        // Deduplicate by id
        const combined = [...adminNotes, ...generalNotes, ...lostNotes, ...claimNotes];
        const unique = [];
        const seen = new Set();
        combined.forEach((n) => {
          if (seen.has(n.id)) return;
          seen.add(n.id);
          unique.push(n);
        });
        const filtered = unique.filter((n) => !clearedIds.has(n.id)).slice(0, 15);
        setNotifications(filtered);
        setUnreadIds(
          new Set(filtered.filter((n) => !readIds.has(n.id)).map((n) => n.id))
        );
      } catch (err) {
        // fail silently
      }
    };
    fetchNotifications();
  }, [currentUserId, isAdmin, clearedIds, readIds]);

  // Object mapping menu keys to their display titles
  return (
    <div
      className="top-title-bar"
      style={{
        left: isMobile ? 0 : `${sidebarWidth}px`,
        width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
        transition: "all 0.3s ease",
      }}
    >
      <div className="left-section">
        <img
          src="/ku-logo-png.webp"
          alt="Kampala University"
          className="ku-logo"
        />
        <div className="logo-text">
          <span>Kampala University</span>
          <small>Lost &amp; Found Unit</small>
        </div>
      </div>

      {/* Right section with icons */}
      <div className="user-menu">
        <div
          className="icon-wrapper"
          onClick={() => {
            setShowNotifications((prev) => {
              const next = !prev;
              if (next === true && notifications.length > 0) {
                // mark all as read when opening
                setReadIds((prevSet) => {
                  const nextSet = new Set(prevSet);
                  notifications.forEach((n) => nextSet.add(n.id));
                  return nextSet;
                });
                setUnreadIds(new Set());
              }
              return next;
            });
            setShowSettings(false);
          }}
        >
          <Bell size={20} />
          {unreadIds.size > 0 && (
            <span className="badge">{unreadIds.size}</span>
          )}
        </div>

        <div
          className="icon-wrapper"
          onClick={() => {
            setShowSettings((prev) => !prev);
            setShowNotifications(false);
          }}
        >
          <Settings size={20} />
        </div>

        <div className="user-profile">
          <User size={24} />
          <div className="user-details">
            <span className="username">{username || "User"}</span>
            {role && <small className="user-role">{role}</small>}
          </div>
          {onLogout && (
            <button type="button" className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-header">
              <span>Account Settings</span>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>
            <div className="settings-body">
              <label className="settings-label">Update Password</label>
              <input
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
              <input
                type="password"
                placeholder="New password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
              {passwordFeedback && (
                <div
                  className={`settings-alert ${passwordFeedback.type === "error" ? "error" : "success"}`}
                >
                  {passwordFeedback.message}
                </div>
              )}
              <button
                type="button"
                className="primary-btn"
                onClick={async () => {
                  setPasswordFeedback(null);
                  if (!currentUserId) {
                    setPasswordFeedback({
                      type: "error",
                      message: "You must be signed in to update your password.",
                    });
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    setPasswordFeedback({
                      type: "error",
                      message: "New passwords do not match.",
                    });
                    return;
                  }
                  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
                    setPasswordFeedback({
                      type: "error",
                      message: "Please fill in all password fields.",
                    });
                    return;
                  }
                  try {
                    setChanging(true);
                    await apiRequest("/api/v1/auth/change-password", {
                      method: "POST",
                      body: {
                        currentPassword: passwordForm.currentPassword,
                        newPassword: passwordForm.newPassword,
                      },
                    });
                    setPasswordFeedback({
                      type: "success",
                      message: "Password updated successfully.",
                    });
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  } catch (err) {
                    setPasswordFeedback({
                      type: "error",
                      message: err.message || "Unable to update password.",
                    });
                  } finally {
                    setChanging(false);
                  }
                }}
                disabled={changing}
              >
                {changing ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        )}
        {showNotifications && (
          <div className="notifications-panel">
            <div className="settings-header" style={{ padding: "0 16px 8px" }}>
              <span>Notifications</span>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setClearedIds((prev) => {
                    const next = new Set(prev);
                    notifications.forEach((n) => next.add(n.id));
                    return next;
                  });
                  setNotifications([]);
                  setReadIds((prev) => {
                    const next = new Set(prev);
                    notifications.forEach((n) => next.add(n.id));
                    return next;
                  });
                  setUnreadIds(new Set());
                }}
                aria-label="Clear notifications"
              >
                Clear
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="notification-item">
                <span className="notification-text">No new notifications.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="notification-item">
                  <span className="notification-title">{n.title}</span>
                  <span className="notification-text">{n.text}</span>
                  {n.meta && (
                    <span className="notification-meta">{n.meta}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
