import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { atom_pageName } from '../navigation/page-name.state';
import { StyleSheetMap } from '@utils/types/index';
import { useNavigate } from 'react-router-dom';

export function Header() {
    const s_pageName = useRecoilValue(atom_pageName);
    const naviagte = useNavigate();
    return (
        <Root className={classes.root}>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static" className={classes.appBar}>
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
                            {s_pageName}
                        </Typography>
                        <span onClick={() => naviagte('/')}>Frently</span>
                    </Toolbar>
                </AppBar>
            </Box>
        </Root>
    );
}

const PREFIX = 'Header';
const classes = {
    root: `${PREFIX}-root`,
    appBar: `${PREFIX}-app-bar`,
};

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {},
            [`& .${classes.appBar}`]: {
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                boxShadow: 'none',
            },
        } as StyleSheetMap)
);
