import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { atom_pageName } from '../../core/navigation/page-name.state';
import { useEffect } from 'react';
import { useOnInit } from '../../utils/hooks/index';
import { StyledOptions } from '@emotion/styled';
import { StyleSheetMap } from '../../utils/types/index';
import {
    Interpolation,
    MUIStyledCommonProps,
    MuiStyledOptions,
    Theme,
} from '@mui/system';

export function HomePage() {
    const s_setPageName = useSetRecoilState(atom_pageName);

    useOnInit(() => {
        s_setPageName('בית');
    });

    return (
        <Root className={classes.root}>
            <Box className={classes.newBusinessBtn}>הוסף עסק</Box>
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

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {
                display: 'flex',
                width: '100%',
                height: '100%',
                flex: 1,
                flexDirection: 'column',
                padding: 20,
            },

            [`& .${classes.newBusinessBtn}`]: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'solid 1px',
                borderColor: theme.palette.primary.main,
                width: '200px',
                height: '100px',
                borderRadius: 10,
                cursor: 'pointer',
            },
        } as StyleSheetMap)
);
