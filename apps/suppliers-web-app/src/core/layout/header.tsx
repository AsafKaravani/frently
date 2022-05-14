import { styled } from '@mui/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { atom_pageName } from '../navigation/page-name.state';

export function Header() {
    const s_pageName = useRecoilState(atom_pageName);
    return (
        <Root className={classes.root}>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="end"
                            color="inherit"
                            aria-label="menu"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ flexGrow: 1 }}
                        >
                            <>{s_pageName}</>
                        </Typography>
                        Frently
                    </Toolbar>
                </AppBar>
            </Box>
        </Root>
    );
}

const PREFIX = 'Header';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {},
}));
