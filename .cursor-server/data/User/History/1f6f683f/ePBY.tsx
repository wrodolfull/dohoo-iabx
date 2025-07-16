import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById("root")!).render(<App />);
