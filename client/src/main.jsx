import React from 'react';
import ReactDOM from 'react-dom/client';
// import { BrowserRouter as Router } from 'react-router-dom';
import { HashRouter } from "react-router-dom";

import { NotificationProvider } from './context/NotificationContext';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    
      <HashRouter>
      <NotificationProvider>
        <App />
      </NotificationProvider>
      </HashRouter>
   
  </React.StrictMode>
);