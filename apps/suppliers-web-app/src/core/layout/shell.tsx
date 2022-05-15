import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { useWindowSize } from '../../utils/hooks/index';

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

const Root = styled('div')(({ theme }) => {
    const windowSize = useWindowSize();

    return {
        [`&.${classes.root}`]: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: windowSize.height,
            background: theme.palette.background.default,
        },
        [`& .${classes.header}`]: {},
        [`& .${classes.content}`]: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
        },
    };
});
