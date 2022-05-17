import {
    ApolloClient,
    ApolloProvider,
    InMemoryCache,
    split,
    HttpLink,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
import { onError } from '@apollo/client/link/error';

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
            main: '#B8B2F2',
        },
        background: {
            default: '#edf2ff',
        },
    },
});

const httpLink = new HttpLink({
    uri: `http://${env.VITE_FRENTLY_GRAPHQL_ENDPOINT}/v1/graphql`,
});

const wsLink = new WebSocketLink({
    uri: `ws://${env.VITE_FRENTLY_GRAPHQL_ENDPOINT}/v1/graphql`,
});

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink
);

const errorLink = onError((error) => {
    console.log(error);
});

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: errorLink.concat(
        split(
            // split based on operation type
            ({ query }) => {
                const definition = getMainDefinition(query);
                return (
                    definition.kind === 'OperationDefinition' &&
                    definition.operation === 'subscription'
                );
            },
            wsLink,
            httpLink
        )
    ),
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
