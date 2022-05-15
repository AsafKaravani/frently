import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { Header } from './header';

export function Shell() {
    return (
        <Root className={classes.root}>
            <div className={classes.header}>
                <Header />
            </div>
            <div className={classes.content}>
                <Outlet />
            </div>
        </Root>
    );
}

const PREFIX = 'HomePage';
const classes = {
    root: `${PREFIX}-root`,
    header: `${PREFIX}-header`,
    content: `${PREFIX}-content`,
};

const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: theme.palette.background.default,
    },
    [`& .${classes.header}`]: {},
    [`& .${classes.content}`]: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
}));
