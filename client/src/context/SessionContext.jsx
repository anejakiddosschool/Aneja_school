// SessionContext.jsx — Global academic session switcher
// One source of truth for the active academic year across the whole app.
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "activeAcademicSession";

const getCurrentAcademicYear = () => {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
};

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSessionState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Validate format "YYYY-YYYY"
      if (stored && /^\d{4}-\d{4}$/.test(stored)) return stored;
    } catch (e) {
      /* localStorage unavailable */
    }
    return getCurrentAcademicYear();
  });

  const setCurrentSession = useCallback((session) => {
    if (!session) return;
    setCurrentSessionState(session);
    try {
      localStorage.setItem(STORAGE_KEY, session);
    } catch (e) {
      /* ignore */
    }
  }, []);

  // True when viewing any session other than the current academic year.
  // Pages can show a warning banner for data-entry safety.
  const isPastSession = currentSession !== getCurrentAcademicYear();

  // Keep the browser tab title hint (cheap, useful when many tabs open)
  useEffect(() => {
    document.title = isPastSession
      ? `Aneja Kiddos School [${currentSession}]`
      : "Aneja Kiddos School";
  }, [currentSession, isPastSession]);

  return (
    <SessionContext.Provider value={{ currentSession, setCurrentSession, isPastSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    // Safe fallback so components can be used in isolation (tests, previews)
    return {
      currentSession: getCurrentAcademicYear(),
      setCurrentSession: () => {},
      isPastSession: false,
    };
  }
  return ctx;
};

export default SessionContext;
