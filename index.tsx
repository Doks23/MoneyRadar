import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: The error "Module has no default export" indicates that App is a named export.
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);