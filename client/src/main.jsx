import React from 'react';
import ReactDOM from 'react-dom/client';
// import { BrowserRouter as Router } from 'react-router-dom';
import { HashRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from './context/NotificationContext';
import { SessionProvider } from './context/SessionContext';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    
      <HashRouter>
      <SessionProvider>
      <NotificationProvider>
           <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <App />
      </NotificationProvider>
      </SessionProvider>
      </HashRouter>
   
  </React.StrictMode>
);