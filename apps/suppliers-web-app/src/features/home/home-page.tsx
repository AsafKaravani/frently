import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { atom_pageName } from '../../core/navigation/page-name.state';

const PREFIX = 'HomePage';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {},
}));

export function HomePage() {
    const s_setPageName = useSetRecoilState(atom_pageName);
    s_setPageName('בית');

    return (
        <Root className={classes.root}>
            <Button variant="contained">asd</Button>
        </Root>
    );
}
