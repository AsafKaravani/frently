import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';
import { AppRoutes } from './core/navigation/app-routes';

let theme = createTheme({
    direction: 'rtl',
    palette: {
        primary: {
            main: '#0052cc',
        },
        secondary: {
            main: '#edf2ff',
        },
        background: {
            default: '#edf2ff',
        },
    },
});

function App() {
    return (
        <>
            <ThemeProvider theme={theme}>
                <AppRoutes />
            </ThemeProvider>
        </>
    );
}

export default App;
