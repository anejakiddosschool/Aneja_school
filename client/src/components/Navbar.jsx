


// import React, { useState, useEffect, useMemo } from "react";
// import { NavLink, useNavigate, Link } from "react-router-dom";
// import authService from "../services/authService";
// import studentAuthService from "../services/studentAuthService";
// import { useNotifications } from "../context/NotificationContext";
// import { io } from "socket.io-client";
// import { QRCodeSVG } from "qrcode.react";

// const BACKEND = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5001").replace(/\/$/, "");

// const socket = io(BACKEND, {
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
// });

// const Navbar = () => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [currentStudent, setCurrentStudent] = useState(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const [showWhatsAppQr, setShowWhatsAppQr] = useState(false);
//   const [qr, setQr] = useState("");
//   const [whatsappStatus, setWhatsappStatus] = useState("Checking status...");
  
//   // Naya state banner dikhane/chupane ke liye
//   const [showWarningBanner, setShowWarningBanner] = useState(false);

//   const navigate = useNavigate();
//   const { notifications, unreadCount, markAllAsRead } = useNotifications();

//   useEffect(() => {
//     const user = authService.getCurrentUser();
//     const student = studentAuthService.getCurrentStudent();
//     if (user) setCurrentUser(user);
//     else if (student) setCurrentStudent(student);
//   }, []);

//   useEffect(() => {
//     let isMounted = true;

//     fetch(`${BACKEND}/api/whatsapp/status`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (!isMounted) return;
//         if (data.status === "connected") {
//           setWhatsappStatus("WhatsApp connected ✅");
//           setShowWarningBanner(false);
//         } else if (data.status === "qr" && data.qrCode) {
//           setQr(data.qrCode);
//           setWhatsappStatus("Scan this QR with WhatsApp");
//           setShowWarningBanner(true); // Banner dikhao
//         } else {
//           setWhatsappStatus("Disconnected ❌");
//           setShowWarningBanner(true); // Banner dikhao
//         }
//       })
//       .catch(() => {
//         if (isMounted) {
//           setWhatsappStatus("Disconnected ❌");
//           setShowWarningBanner(true);
//         }
//       });

//     const handleConnect = () => console.log("Socket connected:", socket.id);

//     const handleQr = (qrString) => {
//       setQr(qrString);
//       setWhatsappStatus("Scan this QR with WhatsApp");
//       setShowWarningBanner(true); // QR aaye toh banner dikhao
//     };

//     const handleReady = (msg) => {
//       setQr("");
//       setWhatsappStatus(msg || "WhatsApp connected ✅");
//       setShowWarningBanner(false); // Connect hone par banner hata do
//       setTimeout(() => setShowWhatsAppQr(false), 3000);
//     };

//     const handleAuthFailure = (msg) => {
//       setWhatsappStatus("Auth failure — check server logs");
//       setShowWarningBanner(true);
//       console.error("auth_failure:", msg);
//     };

//     const handleDisconnect = () => {
//       console.log("Socket disconnected");
//       setWhatsappStatus("Disconnected ❌");
//       setQr("");
//       setShowWhatsAppQr(false);
//       setShowWarningBanner(true);
//     };

//     socket.on("connect", handleConnect);
//     socket.on("qr", handleQr);
//     socket.on("ready", handleReady);
//     socket.on("auth_failure", handleAuthFailure);
//     socket.on("disconnect", handleDisconnect);

//     return () => {
//       isMounted = false;
//       socket.off("connect", handleConnect);
//       socket.off("qr", handleQr);
//       socket.off("ready", handleReady);
//       socket.off("auth_failure", handleAuthFailure);
//       socket.off("disconnect", handleDisconnect);
//     };
//   }, []);

//   const handleLogout = () => {
//     if (currentUser) {
//       authService.logout();
//       setCurrentUser(null);
//       navigate("/");
//     } else if (currentStudent) {
//       studentAuthService.logout();
//       setCurrentStudent(null);
//       navigate("/");
//     }
//     window.location.reload();
//   };

//   const closeMobileMenu = () => setIsOpen(false);

//   const handleWaLogout = async () => {
//     setWhatsappStatus("Logging out...");
//     setQr("");
//     try {
//       await fetch(`${BACKEND}/api/whatsapp/logout`, { method: "POST" });
//     } catch (error) {
//       console.error("Logout failed", error);
//     }
//   };

//   const statusMeta = useMemo(() => {
//     const value = whatsappStatus.toLowerCase();
//     if (qr) return { label: "Scan QR", dot: "bg-amber-500 animate-pulse", iconBg: "bg-amber-100", iconText: "text-amber-600" };
//     if (value.includes("connected")) return { label: "Connected", dot: "bg-emerald-500", iconBg: "bg-emerald-100", iconText: "text-emerald-600" };
//     if (value.includes("logging out")) return { label: "Logging out", dot: "bg-orange-500", iconBg: "bg-orange-100", iconText: "text-orange-600" };
//     if (value.includes("checking")) return { label: "Checking", dot: "bg-sky-500", iconBg: "bg-sky-100", iconText: "text-sky-600" };
//     if (value.includes("auth failure")) return { label: "Auth issue", dot: "bg-rose-500", iconBg: "bg-rose-100", iconText: "text-rose-600" };
//     return { label: "Disconnected", dot: "bg-red-500", iconBg: "bg-red-100", iconText: "text-red-600" };
//   }, [whatsappStatus, qr]);

//   const linkClasses = "block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors duration-200 whitespace-nowrap";
//   const activeLinkClasses = "bg-pink-600";
//   const navLink = ({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : "hover:bg-gray-700"}`;

//    return (
//     <>
//       {/* --- BEST OPTION: MODERN FLOATING WARNING WIDGET --- */}
//       {currentUser?.role === "admin" && showWarningBanner && (
//         <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-white/90 backdrop-blur-md border border-red-200 p-3 sm:p-4 rounded-2xl shadow-[0_8px_30px_rgb(239,68,68,0.2)] animate-pulse">
//           {/* Warning Icon with Red Background */}
//           <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//             </svg>
//           </div>
          
//           {/* Text Info */}
//           <div className="flex flex-col">
//             <h4 className="text-sm font-bold text-gray-900">WhatsApp Offline</h4>
//             <p className="text-xs text-gray-500 font-medium">Auto-messages are paused.</p>
//           </div>

//           {/* Action Button */}
//           <button 
//             onClick={() => {
//               // Scroll to top agar zaroorat ho, aur popup open karo
//               window.scrollTo({ top: 0, behavior: 'smooth' });
//               setShowWhatsAppQr(true);
//             }}
//             className="ml-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-red-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
//           >
//             Fix Now
//           </button>
//         </div>
//       )}

//       {/* --- NORMAL NAVBAR STARTS HERE --- */}
//       <nav className="bg-gray-800 p-2 md:p-3 shadow-md sticky top-0 z-40">
//         <div className="container mx-auto flex items-center justify-between flex-wrap">
          
//           {/* LOGO */}
//           <div className="flex items-center flex-shrink-0 text-white mr-8">
//             <Link to="/" onClick={closeMobileMenu} className="font-bold text-xl tracking-tight">
//               Aneja Kiddos School
//             </Link>
//           </div>

//           {/* MOBILE MENU TOGGLE BUTTON */}
//           <div className="block md:hidden">
//             <button
//               onClick={() => setIsOpen(!isOpen)}
//               className="flex items-center px-3 py-2 border rounded text-gray-200 border-gray-400 hover:text-white hover:border-white"
//             >
//               <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
//                 <title>Menu</title>
//                 <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
//               </svg>
//             </button>
//           </div>

//           {/* NAVIGATION LINKS & ACTIONS CONTAINER */}
//           <div className={`w-full md:flex md:items-center md:w-auto md:flex-grow ${isOpen ? "block mt-4 md:mt-0" : "hidden"}`}>
            
//             <div className="text-sm md:flex-grow md:flex md:items-center md:gap-3 flex flex-col md:flex-row gap-2">
//               {currentUser && (
//                 <>
//                   <NavLink to="/students" className={navLink} onClick={closeMobileMenu}>Students</NavLink>
//                   {(currentUser.role === "admin" || currentUser.homeroomGrade) && (
//                     <NavLink to="/roster" className={navLink} onClick={closeMobileMenu}>Yearly Roster</NavLink>
//                   )}
//                   <NavLink to="/timetable" className={navLink} onClick={closeMobileMenu}>Time Table</NavLink>
//                   <NavLink to="/analytics" className={navLink} onClick={closeMobileMenu}>Analytics</NavLink>
//                   <NavLink to="/grade-sheet" className={navLink} onClick={closeMobileMenu}>Grade Sheet</NavLink>
//                   <NavLink to="/manage-assessments" className={navLink} onClick={closeMobileMenu}>Assessments</NavLink>
//                   {currentUser.role === "admin" && (
//                     <NavLink to="/subjects" className={navLink} onClick={closeMobileMenu}>Subjects</NavLink>
//                   )}
//                 </>
//               )}
//             </div>

//             <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
//               {currentUser?.role === "admin" && (
//                 <div className="relative">
//                   {/* WHATSAPP BUTTON */}
//                   <button
//                     onClick={() => setShowWhatsAppQr((prev) => !prev)}
//                     title="WhatsApp Connection Status"
//                     // Yahan button ko red glow diya gaya hai agar disconnected ho
//                     className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow transition-all w-full md:w-auto justify-center ${
//                       showWarningBanner 
//                         ? "border-red-500 bg-red-900/30 hover:bg-red-900/50" 
//                         : "border-gray-600 bg-gray-900 hover:bg-gray-700"
//                     }`}
//                   >
//                     <div className="relative flex items-center justify-center">
//                       <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${showWarningBanner ? "text-red-400" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h1M7 14h1M11 10h1M3 18h1M16 14h2a2 2 0 100-4h-2m-5 4v4m0 0h4m-4 0H7" />
//                       </svg>
//                       <span className={`absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-gray-900 ${statusMeta.dot}`} />
//                     </div>
//                     <span className={`text-sm font-semibold ${showWarningBanner ? "text-red-300" : "text-gray-200"}`}>
//                       WhatsApp
//                     </span>
//                   </button>

//                   {/* WhatsApp Dropdown Panel */}
//                   {showWhatsAppQr && (
//                     <div className="absolute right-0 mt-3 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl z-50">
//                       <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
//                         <h3 className="text-sm font-bold text-gray-800">WhatsApp Gateway</h3>
//                         <button onClick={() => setShowWhatsAppQr(false)} className="text-gray-400 hover:text-red-500 font-bold">✕</button>
//                       </div>

//                       <div className="p-5 flex flex-col items-center">
//                         <div className="mb-4 flex flex-col items-center gap-1 text-center">
//                           <span className="text-sm font-semibold text-gray-900">{statusMeta.label}</span>
//                           <span className="text-xs text-gray-500">System status: {whatsappStatus}</span>
//                         </div>

//                         {qr ? (
//                           <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
//                             <QRCodeSVG value={qr} size={200} level="H" />
//                             <p className="mt-3 text-center text-xs text-gray-500">Scan from Linked Devices in WhatsApp</p>
//                           </div>
//                         ) : whatsappStatus.toLowerCase().includes("connected") ? (
//                           <div className="flex flex-col items-center text-center">
//                             <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${statusMeta.iconBg}`}>
//                               <svg className={`h-8 w-8 ${statusMeta.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                               </svg>
//                             </div>
//                             <p className="text-sm text-gray-600 mb-4">You can now send automated reports to parents.</p>
//                             <button onClick={handleWaLogout} className="rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition w-full">
//                               Disconnect Device
//                             </button>
//                           </div>
//                         ) : (
//                           <div className="flex flex-col items-center py-4">
//                             <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500" />
//                             <p className="text-xs text-gray-500">Awaiting fresh connection data...</p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* User Auth Buttons */}
//               {currentUser || currentStudent ? (
//                 <button
//                   onClick={handleLogout}
//                   className="w-full md:w-auto bg-transparent text-pink-400 font-bold py-1.5 px-4 border border-pink-400 rounded-md hover:bg-pink-500 hover:text-white transition-colors duration-200"
//                 >
//                   Logout
//                 </button>
//               ) : (
//                 <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
//                   <NavLink to="/login" className={navLink} onClick={closeMobileMenu}>
//                     Teacher/Admin Login
//                   </NavLink>
//                   <NavLink to="/parent-login" className={navLink} onClick={closeMobileMenu}>
//                     Parent Login
//                   </NavLink>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </nav>
//     </>
//   );
// };

// export default Navbar;




// src/components/Navbar.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import studentAuthService from "../services/studentAuthService";
import { useNotifications } from "../context/NotificationContext";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5001").replace(/\/$/, "");

const socket = io(BACKEND, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showWhatsAppQr, setShowWhatsAppQr] = useState(false);
  const [qr, setQr] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState("Checking status...");
  
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  useEffect(() => {
    const user = authService.getCurrentUser();
    const student = studentAuthService.getCurrentStudent();
    if (user) setCurrentUser(user);
    else if (student) setCurrentStudent(student);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch(`${BACKEND}/api/whatsapp/status`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.status === "connected") {
          setWhatsappStatus("WhatsApp connected ✅");
          setShowWarningBanner(false);
        } else if (data.status === "qr" && data.qrCode) {
          setQr(data.qrCode);
          setWhatsappStatus("Scan this QR with WhatsApp");
          setShowWarningBanner(true);
        } else {
          setWhatsappStatus("Disconnected ❌");
          setShowWarningBanner(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setWhatsappStatus("Disconnected ❌");
          setShowWarningBanner(true);
        }
      });

    const handleConnect = () => console.log("Socket connected:", socket.id);

    const handleQr = (qrString) => {
      setQr(qrString);
      setWhatsappStatus("Scan this QR with WhatsApp");
      setShowWarningBanner(true);
    };

    const handleReady = (msg) => {
      setQr("");
      setWhatsappStatus(msg || "WhatsApp connected ✅");
      setShowWarningBanner(false);
      setTimeout(() => setShowWhatsAppQr(false), 3000);
    };

    const handleAuthFailure = (msg) => {
      setWhatsappStatus("Auth failure — check logs");
      setShowWarningBanner(true);
    };

    const handleDisconnect = () => {
      setWhatsappStatus("Disconnected ❌");
      setQr("");
      setShowWhatsAppQr(false);
      setShowWarningBanner(true);
    };

    socket.on("connect", handleConnect);
    socket.on("qr", handleQr);
    socket.on("ready", handleReady);
    socket.on("auth_failure", handleAuthFailure);
    socket.on("disconnect", handleDisconnect);

    return () => {
      isMounted = false;
      socket.off("connect", handleConnect);
      socket.off("qr", handleQr);
      socket.off("ready", handleReady);
      socket.off("auth_failure", handleAuthFailure);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // Close WA dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowWhatsAppQr(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (currentUser) {
      authService.logout();
      setCurrentUser(null);
    } else if (currentStudent) {
      studentAuthService.logout();
      setCurrentStudent(null);
    }
    navigate("/");
    window.location.reload();
  };

  const closeMobileMenu = () => setIsOpen(false);

  const handleWaLogout = async () => {
    setWhatsappStatus("Logging out...");
    setQr("");
    try {
      await fetch(`${BACKEND}/api/whatsapp/logout`, { method: "POST" });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const statusMeta = useMemo(() => {
    const value = whatsappStatus.toLowerCase();
    if (qr) return { label: "Scan QR", dot: "bg-amber-500 animate-pulse", iconBg: "bg-amber-50 border-amber-200", iconText: "text-amber-600" };
    if (value.includes("connected")) return { label: "Connected", dot: "bg-emerald-500", iconBg: "bg-emerald-50 border-emerald-200", iconText: "text-emerald-600" };
    if (value.includes("logging out")) return { label: "Logging out", dot: "bg-orange-500", iconBg: "bg-orange-50 border-orange-200", iconText: "text-orange-600" };
    if (value.includes("checking")) return { label: "Checking", dot: "bg-sky-500", iconBg: "bg-sky-50 border-sky-200", iconText: "text-sky-600" };
    if (value.includes("auth failure")) return { label: "Auth issue", dot: "bg-rose-500", iconBg: "bg-rose-50 border-rose-200", iconText: "text-rose-600" };
    return { label: "Disconnected", dot: "bg-red-500", iconBg: "bg-red-50 border-red-200", iconText: "text-red-600" };
  }, [whatsappStatus, qr]);

  // Modern Light Theme Pill Links
  const navLinkClasses = ({ isActive }) => 
    `text-sm font-semibold transition-all duration-200 px-3 py-2 rounded-lg block md:inline-block
    ${isActive 
      ? "bg-pink-50 text-pink-600 shadow-sm border border-pink-100/50" 
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`;

  return (
    <>
      {/* FLOATING WARNING WIDGET */}
      {currentUser?.role === "admin" && showWarningBanner && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-white/95 backdrop-blur-md border border-red-200 p-4 rounded-2xl shadow-[0_8px_30px_rgb(239,68,68,0.15)] animate-fade-in">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-gray-900">WhatsApp Offline</h4>
            <p className="text-[11px] text-gray-500 font-medium">Auto-messages are paused.</p>
          </div>
          <button 
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setShowWhatsAppQr(true); }}
            className="ml-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-600 hover:shadow"
          >
            Fix Now
          </button>
        </div>
      )}

      {/* TOP NAVIGATION BAR - LIGHT THEME */}
      <nav className="bg-white/95 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* LOGO */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-pink-200">
                A
              </div>
              <Link to="/" onClick={closeMobileMenu} className="font-extrabold text-xl tracking-tight text-gray-800 hidden sm:block">
                Aneja <span className="text-pink-600">Kiddos</span>
              </Link>
            </div>

            {/* MOBILE MENU BUTTON */}
            <div className="flex md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-md transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> 
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>

            {/* DESKTOP LINKS */}
            <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
              {currentUser && (
                <>
                  <NavLink to="/students" className={navLinkClasses}>Directory</NavLink>
                  {(currentUser.role === "admin" || currentUser.homeroomGrade) && (
                    <NavLink to="/roster" className={navLinkClasses}>Roster</NavLink>
                  )}
                  <NavLink to="/grade-sheet" className={navLinkClasses}>Grades</NavLink>
                  <NavLink to="/manage-assessments" className={navLinkClasses}>Assessments</NavLink>
                  <NavLink to="/timetable" className={navLinkClasses}>Timetable</NavLink>
                  <NavLink to="/analytics" className={navLinkClasses}>Analytics</NavLink>
                  {currentUser.role === "admin" && (
                    <NavLink to="/subjects" className={navLinkClasses}>Subjects</NavLink>
                  )}
                </>
              )}
            </div>

            {/* ACTION AREA (WhatsApp & Logout) */}
            <div className="hidden md:flex items-center gap-4">
              {currentUser?.role === "admin" && (
                <div className="relative" ref={dropdownRef}>
                  {/* WHATSAPP BUTTON */}
                  <button
                    onClick={() => setShowWhatsAppQr((prev) => !prev)}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-all border ${
                      showWarningBanner 
                        ? "border-red-200 bg-red-50 hover:bg-red-100" 
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 shadow-sm"
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${showWarningBanner ? "text-red-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h1M7 14h1M11 10h1M3 18h1M16 14h2a2 2 0 100-4h-2m-5 4v4m0 0h4m-4 0H7" />
                      </svg>
                      <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white ${statusMeta.dot}`} />
                    </div>
                    <span className={`text-xs font-bold ${showWarningBanner ? "text-red-600" : "text-gray-700"}`}>
                      WA Portal
                    </span>
                  </button>

                  {/* WHATSAPP DROPDOWN PANEL (Light Theme Adjusted) */}
                  {showWhatsAppQr && (
                    <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 z-50 overflow-hidden animate-fade-in">
                      <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-gray-800">WhatsApp Gateway</h3>
                        <button onClick={() => setShowWhatsAppQr(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 font-bold bg-white border border-gray-200 rounded-md w-7 h-7 flex items-center justify-center shadow-sm transition-colors">✕</button>
                      </div>

                      <div className="p-6 flex flex-col items-center">
                        <div className="mb-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-white ${statusMeta.iconText}`}>
                              <span className={`w-2 h-2 rounded-full ${statusMeta.dot.split(' ')[0]}`}></span>
                              {statusMeta.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-2 font-medium">{whatsappStatus}</p>
                        </div>

                        {qr ? (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 shadow-sm">
                            <QRCodeSVG value={qr} size={180} level="H" />
                            <p className="mt-3 text-center text-[11px] font-medium text-gray-500">Scan from Linked Devices in WhatsApp app</p>
                          </div>
                        ) : whatsappStatus.toLowerCase().includes("connected") ? (
                          <div className="flex flex-col items-center text-center w-full">
                            <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-white shadow-sm ${statusMeta.iconBg}`}>
                              <svg className={`h-8 w-8 ${statusMeta.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-xs font-medium text-gray-600 mb-6">Messaging system is active and ready to broadcast reports.</p>
                            <button onClick={handleWaLogout} className="rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-4 py-2.5 text-xs font-bold transition w-full">
                              Disconnect Device
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-6">
                            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-pink-500" />
                            <p className="text-xs text-gray-400">Awaiting server response...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* USER ACTION BUTTONS */}
              {currentUser || currentStudent ? (
                <button onClick={handleLogout} className="text-xs font-bold text-gray-600 hover:text-pink-600 bg-white hover:bg-pink-50 px-5 py-2 rounded-full transition-colors border border-gray-200 hover:border-pink-200 shadow-sm">
                  Log Out
                </button>
              ) : (
                <div className="flex gap-3 items-center">
                  <NavLink to="/login" className="text-xs font-bold text-gray-600 hover:text-pink-600 px-2 py-2 transition-colors">Staff Login</NavLink>
                  <NavLink to="/parent-login" className="text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 rounded-full transition-colors shadow-sm shadow-pink-200">Parent Login</NavLink>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN (Light Theme) */}
        {isOpen && (
          <div className="md:hidden bg-gray-50 border-t border-gray-200 px-4 pt-3 pb-6 space-y-2 shadow-inner">
             {currentUser && (
                <div className="flex flex-col gap-1">
                  <NavLink to="/students" className={navLinkClasses} onClick={closeMobileMenu}>Directory</NavLink>
                  {(currentUser.role === "admin" || currentUser.homeroomGrade) && (
                    <NavLink to="/roster" className={navLinkClasses} onClick={closeMobileMenu}>Roster</NavLink>
                  )}
                  <NavLink to="/grade-sheet" className={navLinkClasses} onClick={closeMobileMenu}>Grades</NavLink>
                  <NavLink to="/manage-assessments" className={navLinkClasses} onClick={closeMobileMenu}>Assessments</NavLink>
                  <NavLink to="/timetable" className={navLinkClasses} onClick={closeMobileMenu}>Timetable</NavLink>
                  <NavLink to="/analytics" className={navLinkClasses} onClick={closeMobileMenu}>Analytics</NavLink>
                  {currentUser.role === "admin" && (
                    <NavLink to="/subjects" className={navLinkClasses} onClick={closeMobileMenu}>Subjects</NavLink>
                  )}
                </div>
              )}
              
              <div className="pt-4 mt-3 border-t border-gray-200 flex flex-col gap-3">
                 {currentUser?.role === "admin" && (
                     <button onClick={() => { setShowWhatsAppQr(true); closeMobileMenu(); window.scrollTo(0,0); }} className="text-left text-sm font-semibold text-gray-700 py-2 flex items-center gap-2 bg-white px-4 rounded-lg border border-gray-200 shadow-sm">
                         📱 Open WhatsApp Gateway
                     </button>
                 )}
                 {currentUser || currentStudent ? (
                    <button onClick={handleLogout} className="w-full text-center text-sm font-bold text-red-600 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                      Log Out
                    </button>
                 ) : (
                    <div className="flex flex-col gap-2">
                        <NavLink to="/login" className="text-sm font-semibold text-gray-700 py-2.5 bg-white border border-gray-200 text-center rounded-lg shadow-sm" onClick={closeMobileMenu}>Staff Login</NavLink>
                        <NavLink to="/parent-login" className="text-sm font-semibold text-white py-2.5 bg-pink-600 text-center rounded-lg shadow-sm" onClick={closeMobileMenu}>Parent Login</NavLink>
                    </div>
                 )}
              </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
