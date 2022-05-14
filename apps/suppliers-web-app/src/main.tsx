import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import CssBaseline from '@mui/material/CssBaseline';
import { Theme } from '@mui/material/styles';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <CssBaseline enableColorScheme />
        <App />
    </React.StrictMode>
);

declare module '@mui/styles/defaultTheme' {
    interface DefaultTheme extends Theme {}
}
