import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { RecoilRoot } from 'recoil';
import './App.css';
import { AppRoutes } from './core/navigation/app-routes';
const env = import.meta.env;

import { StateDebugObserver } from './core/state-debugger';

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

const client = new ApolloClient({
    uri: env.VITE_FRENTLY_GRAPHQL_ENDPOINT,
    cache: new InMemoryCache(),
});

function App() {
    return (
        <>
            <ApolloProvider client={client}>
                <RecoilRoot>
                    <StateDebugObserver />
                    <ThemeProvider theme={theme}>
                        <AppRoutes />
                    </ThemeProvider>
                </RecoilRoot>
            </ApolloProvider>
        </>
    );
}

export default App;
