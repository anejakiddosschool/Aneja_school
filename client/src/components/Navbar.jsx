

// // import React, { useState, useEffect } from "react";
// // import { NavLink, useNavigate, Link } from "react-router-dom";
// // import authService from "../services/authService";
// // import studentAuthService from "../services/studentAuthService";
// // import { useNotifications } from "../context/NotificationContext";
// // import { io } from "socket.io-client";
// // // QRCodeSVG is much faster than QRCodeCanvas in React environments
// // import { QRCodeSVG } from "qrcode.react";

// // // Fix for Double Slash (//) Issue
// // // Hum extra trailing slash backend URL se hata dete hain taaki /api/whatsapp match kare
// // const BACKEND = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5001").replace(/\/$/, "");

// // // Socket ko bahar rakha hai taaki Navbar re-render par multiple connections na bane
// // const socket = io(BACKEND, {
// //   reconnectionAttempts: 5,
// //   reconnectionDelay: 1000,
// // });

// // const Navbar = () => {
// //   // --- State Management ---
// //   const [currentUser, setCurrentUser] = useState(null);
// //   const [currentStudent, setCurrentStudent] = useState(null);
// //   const [isOpen, setIsOpen] = useState(false); // Mobile menu
// //   const [showNotifications, setShowNotifications] = useState(false);
// //   const [showWhatsAppQr, setShowWhatsAppQr] = useState(false);
// //   const [qr, setQr] = useState("");
// //   const [whatsappStatus, setWhatsappStatus] = useState("Checking status...");
  
// //   const navigate = useNavigate();
// //   const { notifications, unreadCount, markAllAsRead } = useNotifications();

// //   useEffect(() => {
// //     const user = authService.getCurrentUser();
// //     const student = studentAuthService.getCurrentStudent();
// //     if (user) setCurrentUser(user);
// //     else if (student) setCurrentStudent(student);
// //   }, []);

// //   // WhatsApp Sync via REST API & Socket.io
// //   useEffect(() => {
// //     let isMounted = true;

// //     // 1. Check Initial Status Via REST API (No more 404 double slash error)
// //     fetch(`${BACKEND}/api/whatsapp/status`)
// //       .then((res) => res.json())
// //       .then((data) => {
// //         if (!isMounted) return;
// //         if (data.status === "connected") {
// //           setWhatsappStatus("WhatsApp connected ✅");
// //         } else if (data.status === "qr" && data.qrCode) {
// //           setQr(data.qrCode);
// //           setWhatsappStatus("Scan this QR with WhatsApp");
// //         } else {
// //           setWhatsappStatus("Disconnected ❌");
// //         }
// //       })
// //       .catch((err) => {
// //         if (isMounted) setWhatsappStatus("Disconnected ❌");
// //       });

// //     // 2. Real-time Socket.io Listeners (For fastest QR delivery)
// //     const handleConnect = () => console.log("Socket connected:", socket.id);
    
// //     const handleQr = (qrString) => {
// //       setQr(qrString);
// //       setWhatsappStatus("Scan this QR with WhatsApp");
// //       setShowWhatsAppQr(true); // Automatically open QR dropdown when fresh QR arrives
// //     };

// //     const handleReady = (msg) => {
// //       setQr("");
// //       setWhatsappStatus(msg || "WhatsApp connected ✅");
// //       setTimeout(() => setShowWhatsAppQr(false), 3000); // auto-hide after connection
// //     };

// //     const handleAuthFailure = (msg) => {
// //       setWhatsappStatus("Auth failure — check server logs");
// //       console.error("auth_failure:", msg);
// //     };

// //     const handleDisconnect = () => {
// //       console.log("Socket disconnected");
// //       setWhatsappStatus("Disconnected ❌");
// //       setQr("");
// //       setShowWhatsAppQr(false);
// //     };

// //     socket.on("connect", handleConnect);
// //     socket.on("qr", handleQr);
// //     socket.on("ready", handleReady);
// //     socket.on("auth_failure", handleAuthFailure);
// //     socket.on("disconnect", handleDisconnect);

// //     return () => {
// //       isMounted = false;
// //       socket.off("connect", handleConnect);
// //       socket.off("qr", handleQr);
// //       socket.off("ready", handleReady);
// //       socket.off("auth_failure", handleAuthFailure);
// //       socket.off("disconnect", handleDisconnect);
// //     };
// //   }, []);

// //   const handleLogout = () => {
// //     if (currentUser) {
// //       authService.logout();
// //       setCurrentUser(null);
// //       navigate("/");
// //     } else if (currentStudent) {
// //       studentAuthService.logout();
// //       setCurrentStudent(null);
// //       navigate("/");
// //     }
// //     window.location.reload();
// //   };

// //   const closeMobileMenu = () => setIsOpen(false);

// //   const handleNotificationClick = () => {
// //     setShowNotifications((prev) => !prev);
// //     if (unreadCount > 0) {
// //       markAllAsRead();
// //     }
// //   };

// //   // Logout WhatsApp Device action
// //   const handleWaLogout = async () => {
// //     setWhatsappStatus("Logging out...");
// //     setQr("");
// //     try {
// //       await fetch(`${BACKEND}/api/whatsapp/logout`, { method: "POST" });
// //     } catch (error) {
// //       console.error("Logout failed", error);
// //     }
// //   };

// //   const linkClasses =
// //     "block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors duration-200 whitespace-nowrap";
// //   const activeLinkClasses = "bg-pink-600";
// //   const navLink = ({ isActive }) =>
// //     `${linkClasses} ${isActive ? activeLinkClasses : "hover:bg-gray-700"}`;

// //   return (
// //     <nav className="bg-gray-800 p-1 shadow-md sticky top-0 z-50">
// //       <div className="container mx-auto flex items-center justify-between flex-wrap">
// //         <div className="flex items-center flex-shrink-0 text-white mr-6">
// //           <Link
// //             to="/"
// //             onClick={closeMobileMenu}
// //             className="font-bold text-xl tracking-tight"
// //           >
// //             Aneja Kiddos School
// //           </Link>
// //         </div>

// //         <div className="block md:hidden">
// //           <button
// //             onClick={() => setIsOpen(!isOpen)}
// //             className="flex items-center px-3 py-2 border rounded text-gray-200 border-gray-400 hover:text-white hover:border-white"
// //           >
// //             <svg
// //               className="fill-current h-3 w-3"
// //               viewBox="0 0 20 20"
// //               xmlns="http://www.w3.org/2000/svg"
// //             >
// //               <title>Menu</title>
// //               <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
// //             </svg>
// //           </button>
// //         </div>

// //         <div
// //           className={`w-full md:flex md:items-center md:w-auto ${
// //             isOpen ? "block" : "hidden"
// //           }`}
// //         >
// //           <div className="text-sm md:flex-grow md:flex md:items-center md:gap-2">
// //             {currentUser && (
// //               <>
// //                 <NavLink to="/students" className={navLink} onClick={closeMobileMenu}>
// //                   Students
// //                 </NavLink>

// //                 {/* Restored options for Yearly Roster */}
// //                 {(currentUser.role === "admin" || currentUser.homeroomGrade) && (
// //                   <NavLink to="/roster" className={navLink} onClick={closeMobileMenu}>
// //                     Yearly Roster
// //                   </NavLink>
// //                 )}

// //                 <NavLink to="/timetable" className={navLink} onClick={closeMobileMenu}>
// //                   Time Table
// //                 </NavLink>

// //                 <NavLink to="/analytics" className={navLink} onClick={closeMobileMenu}>
// //                   Analytics
// //                 </NavLink>

// //                 <NavLink to="/grade-sheet" className={navLink} onClick={closeMobileMenu}>
// //                   Grade Sheet
// //                 </NavLink>

// //                 <NavLink to="/manage-assessments" className={navLink} onClick={closeMobileMenu}>
// //                   Assessments
// //                 </NavLink>

// //                 {/* Restored option for Subjects */}
// //                 {currentUser.role === "admin" && (
// //                   <NavLink to="/subjects" className={navLink} onClick={closeMobileMenu}>
// //                     Subjects
// //                   </NavLink>
// //                 )}
// //               </>
// //             )}
// //           </div>

// //           {/* 🟢 Professional WhatsApp Integration UI */}
// //           {currentUser?.role === "admin" && (
// //             <div className="relative md:mr-4 mb-2 md:mb-0 mt-2 md:mt-0">
// //               <button
// //                 onClick={() => setShowWhatsAppQr((prev) => !prev)}
// //                 className="relative text-green-400 hover:text-green-600 transition-colors duration-200"
// //                 title="WhatsApp Connection Status"
// //               >
// //                 {/* Visual Indicator of connection Status */}
// //                 {whatsappStatus.includes("connected") && (
// //                   <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 shadow-lg"></span>
// //                 )}
// //                 <svg
// //                   xmlns="http://www.w3.org/2000/svg"
// //                   className="h-7 w-7"
// //                   fill="none"
// //                   viewBox="0 0 24 24"
// //                   stroke="currentColor"
// //                   strokeWidth={2}
// //                 >
// //                   <path
// //                     strokeLinecap="round"
// //                     strokeLinejoin="round"
// //                     d="M3 10h1M7 14h1M11 10h1M3 18h1M16 14h2a2 2 0 100-4h-2m-5 4v4m0 0h4m-4 0H7"
// //                   />
// //                 </svg>
// //               </button>

// //               {/* Improved Dropdown Modal for WhatsApp */}
// //               {showWhatsAppQr && (
// //                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-2xl z-50 border animate-fade-in-down overflow-hidden">
// //                   <div className="p-3 bg-gray-50 flex justify-between items-center border-b">
// //                     <h3 className="font-bold text-gray-800">WhatsApp System</h3>
// //                     <button onClick={() => setShowWhatsAppQr(false)} className="text-gray-500 hover:text-red-500 font-bold">✕</button>
// //                   </div>
                  
// //                   <div className="p-5 flex flex-col items-center min-h-[200px] justify-center">
// //                     <h4 className={`text-center font-semibold mb-4 ${whatsappStatus.includes("connected") ? "text-green-600" : "text-gray-700"}`}>
// //                       {whatsappStatus}
// //                     </h4>
                    
// //                     {/* Render Fast SVG QR */}
// //                     {qr ? (
// //                       <div className="p-2 border rounded-lg bg-white shadow-sm">
// //                         <QRCodeSVG value={qr} size={200} level="H" />
// //                       </div>
// //                     ) : whatsappStatus.includes("connected") ? (
// //                       <div className="flex flex-col items-center">
// //                         <svg className="w-16 h-16 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                         </svg>
// //                         <button onClick={handleWaLogout} className="mt-2 text-sm text-red-500 hover:text-red-700 font-semibold border border-red-200 px-3 py-1 rounded">
// //                           Log Out Device
// //                         </button>
// //                       </div>
// //                     ) : (
// //                       <div className="text-gray-400">Loading/Disconnected...</div>
// //                     )}
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           )}

// //           {/* User Section */}
// //           {currentUser || currentStudent ? (
// //             <button
// //               onClick={handleLogout}
// //               className="w-full md:w-auto bg-transparent text-pink-400 font-bold py-2 px-4 border border-pink-400 rounded-md hover:bg-pink-400 hover:text-white transition-colors duration-200"
// //             >
// //               Logout
// //             </button>
// //           ) : (
// //             <div className="flex flex-col md:flex-row gap-2">
// //               <NavLink
// //                 to="/login"
// //                 className={navLink}
// //                 onClick={closeMobileMenu}
// //               >
// //                 Teacher/Admin Login
// //               </NavLink>
// //               <NavLink
// //                 to="/parent-login"
// //                 className={navLink}
// //                 onClick={closeMobileMenu}
// //               >
// //                 Parent Login
// //               </NavLink>
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     </nav>
// //   );
// // };

// // export default Navbar;


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
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [showWhatsAppQr, setShowWhatsAppQr] = useState(false);
//   const [qr, setQr] = useState("");
//   const [whatsappStatus, setWhatsappStatus] = useState("Checking status...");

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
//         } else if (data.status === "qr" && data.qrCode) {
//           setQr(data.qrCode);
//           setWhatsappStatus("Scan this QR with WhatsApp");
//         } else {
//           setWhatsappStatus("Disconnected ❌");
//         }
//       })
//       .catch(() => {
//         if (isMounted) setWhatsappStatus("Disconnected ❌");
//       });

//     const handleConnect = () => console.log("Socket connected:", socket.id);

//     const handleQr = (qrString) => {
//       setQr(qrString);
//       setWhatsappStatus("Scan this QR with WhatsApp");
//       setShowWhatsAppQr(true);
//     };

//     const handleReady = (msg) => {
//       setQr("");
//       setWhatsappStatus(msg || "WhatsApp connected ✅");
//       setTimeout(() => setShowWhatsAppQr(false), 3000);
//     };

//     const handleAuthFailure = (msg) => {
//       setWhatsappStatus("Auth failure — check server logs");
//       console.error("auth_failure:", msg);
//     };

//     const handleDisconnect = () => {
//       console.log("Socket disconnected");
//       setWhatsappStatus("Disconnected ❌");
//       setQr("");
//       setShowWhatsAppQr(false);
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

//   const handleNotificationClick = () => {
//     setShowNotifications((prev) => !prev);
//     if (unreadCount > 0) markAllAsRead();
//   };

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

//     if (qr) {
//       return {
//         label: "Scan Required",
//         subtext: "Open WhatsApp on your phone and scan the QR code.",
//         dot: "bg-amber-500",
//         pill: "bg-amber-100 text-amber-700 border-amber-200",
//         iconBg: "bg-amber-100",
//         iconText: "text-amber-600",
//       };
//     }

//     if (value.includes("connected")) {
//       return {
//         label: "Connected",
//         subtext: "Reports and WhatsApp messages are ready to send.",
//         dot: "bg-emerald-500",
//         pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
//         iconBg: "bg-emerald-100",
//         iconText: "text-emerald-600",
//       };
//     }

//     if (value.includes("logging out")) {
//       return {
//         label: "Logging out",
//         subtext: "Disconnecting this linked WhatsApp device.",
//         dot: "bg-orange-500",
//         pill: "bg-orange-100 text-orange-700 border-orange-200",
//         iconBg: "bg-orange-100",
//         iconText: "text-orange-600",
//       };
//     }

//     if (value.includes("checking")) {
//       return {
//         label: "Checking",
//         subtext: "Fetching current WhatsApp connection status.",
//         dot: "bg-sky-500",
//         pill: "bg-sky-100 text-sky-700 border-sky-200",
//         iconBg: "bg-sky-100",
//         iconText: "text-sky-600",
//       };
//     }

//     if (value.includes("auth failure")) {
//       return {
//         label: "Auth issue",
//         subtext: "Please relink the device from a fresh QR code.",
//         dot: "bg-rose-500",
//         pill: "bg-rose-100 text-rose-700 border-rose-200",
//         iconBg: "bg-rose-100",
//         iconText: "text-rose-600",
//       };
//     }

//     return {
//       label: "Disconnected",
//       subtext: "WhatsApp is not currently linked to the system.",
//       dot: "bg-red-500",
//       pill: "bg-red-100 text-red-700 border-red-200",
//       iconBg: "bg-red-100",
//       iconText: "text-red-600",
//     };
//   }, [whatsappStatus, qr]);

//   const linkClasses =
//     "block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors duration-200 whitespace-nowrap";
//   const activeLinkClasses = "bg-pink-600";
//   const navLink = ({ isActive }) =>
//     `${linkClasses} ${isActive ? activeLinkClasses : "hover:bg-gray-700"}`;

//   return (
//     <nav className="bg-gray-800 p-1 shadow-md sticky top-0 z-50">
//       <div className="container mx-auto flex items-center justify-between flex-wrap">
//         <div className="flex items-center flex-shrink-0 text-white mr-6">
//           <Link to="/" onClick={closeMobileMenu} className="font-bold text-xl tracking-tight">
//             Aneja Kiddos School
//           </Link>
//         </div>

//         <div className="block md:hidden">
//           <button
//             onClick={() => setIsOpen(!isOpen)}
//             className="flex items-center px-3 py-2 border rounded text-gray-200 border-gray-400 hover:text-white hover:border-white"
//           >
//             <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
//               <title>Menu</title>
//               <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
//             </svg>
//           </button>
//         </div>

//         <div className={`w-full md:flex md:items-center md:w-auto ${isOpen ? "block" : "hidden"}`}>
//           <div className="text-sm md:flex-grow md:flex md:items-center md:gap-2">
//             {currentUser && (
//               <>
//                 <NavLink to="/students" className={navLink} onClick={closeMobileMenu}>
//                   Students
//                 </NavLink>

//                 {(currentUser.role === "admin" || currentUser.homeroomGrade) && (
//                   <NavLink to="/roster" className={navLink} onClick={closeMobileMenu}>
//                     Yearly Roster
//                   </NavLink>
//                 )}

//                 <NavLink to="/timetable" className={navLink} onClick={closeMobileMenu}>
//                   Time Table
//                 </NavLink>

//                 <NavLink to="/analytics" className={navLink} onClick={closeMobileMenu}>
//                   Analytics
//                 </NavLink>

//                 <NavLink to="/grade-sheet" className={navLink} onClick={closeMobileMenu}>
//                   Grade Sheet
//                 </NavLink>

//                 <NavLink to="/manage-assessments" className={navLink} onClick={closeMobileMenu}>
//                   Assessments
//                 </NavLink>

//                 {currentUser.role === "admin" && (
//                   <NavLink to="/subjects" className={navLink} onClick={closeMobileMenu}>
//                     Subjects
//                   </NavLink>
//                 )}
//               </>
//             )}
//           </div>

//           {currentUser?.role === "admin" && (
//             <div className="relative md:mr-4 mb-2 md:mb-0 mt-2 md:mt-0">
//               <button
//                 onClick={() => setShowWhatsAppQr((prev) => !prev)}
//                 title="WhatsApp Connection Status"
//                 className="group flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-2 shadow-lg transition-all duration-200 hover:border-emerald-400/40 hover:shadow-emerald-500/10"
//               >
//                 <div className="relative">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-5 w-5"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                       strokeWidth={2}
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M3 10h1M7 14h1M11 10h1M3 18h1M16 14h2a2 2 0 100-4h-2m-5 4v4m0 0h4m-4 0H7"
//                       />
//                     </svg>
//                   </div>
//                   <span
//                     className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-gray-900 ${statusMeta.dot} ${qr ? "animate-pulse" : ""}`}
//                   />
//                 </div>

//                 <div className="hidden sm:block text-left">
//                   <p className="text-xs font-medium text-gray-400">WhatsApp</p>
//                   <p className="text-sm font-semibold text-white">{statusMeta.label}</p>
//                 </div>

//                 <svg
//                   className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showWhatsAppQr ? "rotate-180" : ""}`}
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                   strokeWidth={2}
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//                 </svg>
//               </button>

//               {showWhatsAppQr && (
//                 <div className="absolute right-0 mt-3 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl z-50">
//                   <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-4 text-white">
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">
//                           WhatsApp Integration
//                         </p>
//                         <h3 className="mt-1 text-lg font-bold">Device Status</h3>
//                       </div>
//                       <button
//                         onClick={() => setShowWhatsAppQr(false)}
//                         className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
//                       >
//                         ✕
//                       </button>
//                     </div>
//                   </div>

//                   <div className="p-5">
//                     <div className="mb-4 flex items-center justify-between gap-3">
//                       <div className="flex items-center gap-3">
//                         <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${statusMeta.iconBg}`}>
//                           <svg
//                             className={`h-6 w-6 ${statusMeta.iconText}`}
//                             fill="none"
//                             viewBox="0 0 24 24"
//                             stroke="currentColor"
//                             strokeWidth={2}
//                           >
//                             {qr ? (
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             ) : whatsappStatus.toLowerCase().includes("connected") ? (
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                             ) : (
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                             )}
//                           </svg>
//                         </div>

//                         <div>
//                           <p className="text-sm font-semibold text-gray-900">{statusMeta.label}</p>
//                           <p className="text-xs text-gray-500">{statusMeta.subtext}</p>
//                         </div>
//                       </div>

//                       <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.pill}`}>
//                         {statusMeta.label}
//                       </span>
//                     </div>

//                     {qr ? (
//                       <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4">
//                         <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
//                           <QRCodeSVG value={qr} size={210} level="H" includeMargin />
//                         </div>
//                         <div className="mt-4 text-center">
//                           <p className="text-sm font-semibold text-gray-800">Scan from Linked Devices</p>
//                           <p className="mt-1 text-xs text-gray-500">
//                             WhatsApp &gt; Linked Devices &gt; Link a Device
//                           </p>
//                         </div>
//                       </div>
//                     ) : whatsappStatus.toLowerCase().includes("connected") ? (
//                       <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
//                         <div className="flex flex-col items-center text-center">
//                           <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
//                             <svg
//                               className="h-8 w-8 text-emerald-600"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                               stroke="currentColor"
//                               strokeWidth={2.5}
//                             >
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                             </svg>
//                           </div>
//                           <p className="text-base font-bold text-gray-900">Device linked successfully</p>
//                           <p className="mt-1 text-sm text-gray-600">
//                             Reports, notices and personal messages can be sent now.
//                           </p>
//                           <button
//                             onClick={handleWaLogout}
//                             className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
//                           >
//                             Log Out Device
//                           </button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
//                         <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500" />
//                         <p className="text-sm font-semibold text-gray-800">{whatsappStatus}</p>
//                         <p className="mt-1 text-xs text-gray-500">
//                           Waiting for a fresh connection update from the server.
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {currentUser || currentStudent ? (
//             <button
//               onClick={handleLogout}
//               className="w-full md:w-auto bg-transparent text-pink-400 font-bold py-2 px-4 border border-pink-400 rounded-md hover:bg-pink-400 hover:text-white transition-colors duration-200"
//             >
//               Logout
//             </button>
//           ) : (
//             <div className="flex flex-col md:flex-row gap-2">
//               <NavLink to="/login" className={navLink} onClick={closeMobileMenu}>
//                 Teacher/Admin Login
//               </NavLink>
//               <NavLink to="/parent-login" className={navLink} onClick={closeMobileMenu}>
//                 Parent Login
//               </NavLink>
//             </div>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;


import React, { useState, useEffect, useMemo } from "react";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWhatsAppQr, setShowWhatsAppQr] = useState(false);
  const [qr, setQr] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState("Checking status...");

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
        } else if (data.status === "qr" && data.qrCode) {
          setQr(data.qrCode);
          setWhatsappStatus("Scan this QR with WhatsApp");
        } else {
          setWhatsappStatus("Disconnected ❌");
        }
      })
      .catch(() => {
        if (isMounted) setWhatsappStatus("Disconnected ❌");
      });

    const handleConnect = () => console.log("Socket connected:", socket.id);

    const handleQr = (qrString) => {
      setQr(qrString);
      setWhatsappStatus("Scan this QR with WhatsApp");
      setShowWhatsAppQr(true);
    };

    const handleReady = (msg) => {
      setQr("");
      setWhatsappStatus(msg || "WhatsApp connected ✅");
      setTimeout(() => setShowWhatsAppQr(false), 3000);
    };

    const handleAuthFailure = (msg) => {
      setWhatsappStatus("Auth failure — check server logs");
      console.error("auth_failure:", msg);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setWhatsappStatus("Disconnected ❌");
      setQr("");
      setShowWhatsAppQr(false);
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

  const handleLogout = () => {
    if (currentUser) {
      authService.logout();
      setCurrentUser(null);
      navigate("/");
    } else if (currentStudent) {
      studentAuthService.logout();
      setCurrentStudent(null);
      navigate("/");
    }
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
    if (qr) return { label: "Scan QR", dot: "bg-amber-500 animate-pulse", iconBg: "bg-amber-100", iconText: "text-amber-600" };
    if (value.includes("connected")) return { label: "Connected", dot: "bg-emerald-500", iconBg: "bg-emerald-100", iconText: "text-emerald-600" };
    if (value.includes("logging out")) return { label: "Logging out", dot: "bg-orange-500", iconBg: "bg-orange-100", iconText: "text-orange-600" };
    if (value.includes("checking")) return { label: "Checking", dot: "bg-sky-500", iconBg: "bg-sky-100", iconText: "text-sky-600" };
    if (value.includes("auth failure")) return { label: "Auth issue", dot: "bg-rose-500", iconBg: "bg-rose-100", iconText: "text-rose-600" };
    return { label: "Disconnected", dot: "bg-red-500", iconBg: "bg-red-100", iconText: "text-red-600" };
  }, [whatsappStatus, qr]);

  // Original clean link styling
  const linkClasses = "block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors duration-200 whitespace-nowrap";
  const activeLinkClasses = "bg-pink-600";
  const navLink = ({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : "hover:bg-gray-700"}`;

  return (
    <nav className="bg-gray-800 p-2 md:p-3 shadow-md sticky top-0 z-50">
      {/* Container ensures items stay aligned and constrained to layout */}
      <div className="container mx-auto flex items-center justify-between flex-wrap">
        
        {/* LOGO */}
        <div className="flex items-center flex-shrink-0 text-white mr-8">
          <Link to="/" onClick={closeMobileMenu} className="font-bold text-xl tracking-tight">
            Aneja Kiddos School
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE BUTTON */}
        <div className="block md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center px-3 py-2 border rounded text-gray-200 border-gray-400 hover:text-white hover:border-white"
          >
            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
            </svg>
          </button>
        </div>

        {/* NAVIGATION LINKS & ACTIONS CONTAINER */}
        <div className={`w-full md:flex md:items-center md:w-auto md:flex-grow ${isOpen ? "block mt-4 md:mt-0" : "hidden"}`}>
          
          {/* Main Navigation Links */}
          <div className="text-sm md:flex-grow md:flex md:items-center md:gap-3 flex flex-col md:flex-row gap-2">
            {currentUser && (
              <>
                <NavLink to="/students" className={navLink} onClick={closeMobileMenu}>Students</NavLink>
                
                {(currentUser.role === "admin" || currentUser.homeroomGrade) && (
                  <NavLink to="/roster" className={navLink} onClick={closeMobileMenu}>Yearly Roster</NavLink>
                )}
                
                <NavLink to="/timetable" className={navLink} onClick={closeMobileMenu}>Time Table</NavLink>
                <NavLink to="/analytics" className={navLink} onClick={closeMobileMenu}>Analytics</NavLink>
                <NavLink to="/grade-sheet" className={navLink} onClick={closeMobileMenu}>Grade Sheet</NavLink>
                <NavLink to="/manage-assessments" className={navLink} onClick={closeMobileMenu}>Assessments</NavLink>
                
                {currentUser.role === "admin" && (
                  <NavLink to="/subjects" className={navLink} onClick={closeMobileMenu}>Subjects</NavLink>
                )}
              </>
            )}
          </div>

          {/* Right Side Tools: WhatsApp & Auth */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
            
            {/* WhatsApp Integration Button (Admin Only) */}
            {currentUser?.role === "admin" && (
              <div className="relative">
                <button
                  onClick={() => setShowWhatsAppQr((prev) => !prev)}
                  title="WhatsApp Connection Status"
                  className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 shadow transition-all hover:bg-gray-700 w-full md:w-auto justify-center"
                >
                  <div className="relative flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h1M7 14h1M11 10h1M3 18h1M16 14h2a2 2 0 100-4h-2m-5 4v4m0 0h4m-4 0H7" />
                    </svg>
                    {/* Status Dot */}
                    <span className={`absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-gray-900 ${statusMeta.dot}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">WhatsApp</span>
                </button>

                {/* WhatsApp Dropdown Panel */}
                {showWhatsAppQr && (
                  <div className="absolute right-0 mt-3 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl z-50">
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800">WhatsApp Gateway</h3>
                      <button onClick={() => setShowWhatsAppQr(false)} className="text-gray-400 hover:text-red-500 font-bold">✕</button>
                    </div>

                    <div className="p-5 flex flex-col items-center">
                      <div className="mb-4 flex flex-col items-center gap-1 text-center">
                        <span className="text-sm font-semibold text-gray-900">{statusMeta.label}</span>
                        <span className="text-xs text-gray-500">System status: {whatsappStatus}</span>
                      </div>

                      {qr ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                          <QRCodeSVG value={qr} size={200} level="H" />
                          <p className="mt-3 text-center text-xs text-gray-500">Scan from Linked Devices in WhatsApp</p>
                        </div>
                      ) : whatsappStatus.toLowerCase().includes("connected") ? (
                        <div className="flex flex-col items-center text-center">
                          <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${statusMeta.iconBg}`}>
                            <svg className={`h-8 w-8 ${statusMeta.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">You can now send automated reports to parents.</p>
                          <button onClick={handleWaLogout} className="rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition w-full">
                            Disconnect Device
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4">
                          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500" />
                          <p className="text-xs text-gray-500">Awaiting fresh connection data...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Auth Buttons */}
            {currentUser || currentStudent ? (
              <button
                onClick={handleLogout}
                className="w-full md:w-auto bg-transparent text-pink-400 font-bold py-1.5 px-4 border border-pink-400 rounded-md hover:bg-pink-500 hover:text-white transition-colors duration-200"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <NavLink to="/login" className={navLink} onClick={closeMobileMenu}>
                  Teacher/Admin Login
                </NavLink>
                <NavLink to="/parent-login" className={navLink} onClick={closeMobileMenu}>
                  Parent Login
                </NavLink>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
