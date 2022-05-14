import { Box, Button } from '@mui/material';
import { styled } from '@mui/styles';
import { useSetRecoilState } from 'recoil';
import { atom_pageName } from '../../core/navigation/page-name.state';

export function HomePage() {
    const s_setPageName = useSetRecoilState(atom_pageName);
    s_setPageName('בית');

    return (
        <Root className={classes.root}>
            <div className={classes.newBusinessBtn}>s</div>
        </Root>
    );
}

const PREFIX = 'HomePage';
const classes = {
    root: `${PREFIX}-root`,
    body: `${PREFIX}-body`,
    footer: `${PREFIX}-footer`,
    newBusinessBtn: `${PREFIX}-new-business-btn`,
};

const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {
        display: 'flex',
        width: '100%',
        minHeight: '100%',
    },
    [`& .${classes.newBusinessBtn}`]: {
        display: 'flex',
        background: theme.palette.primary.main,
        width: '50%',
        height: '50%',
    },
}));
