import { Box, Button, IconButton, Typography } from '@mui/material';
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
import { Form, Field } from 'react-final-form';

const onSubmit = async (values) => {
    window.alert(JSON.stringify(values, 0, 2));
};

export function HomePage() {
    const s_setPageName = useSetRecoilState(atom_pageName);

    useOnInit(() => {
        s_setPageName('בית');
    });

    return (
        <Root className={classes.root}>
            <Box sx={{ flex: 1 }}></Box>
            <Button
                sx={{ fontSize: 16, fontWeight: 600 }}
                variant="outlined"
                className={classes.newBusinessBtn}
            >
                <i className="fa-solid fa-plus me" />
                הוסף עסק
            </Button>
            <Typography
                sx={{ marginBlockStart: 2, marginBlockEnd: 2, opacity: 0.6 }}
            >
                או חפש עסק קיים
            </Typography>
            <Box>
                <Form
                    onSubmit={onSubmit}
                    initialValues={{ stooge: 'larry', employed: false }}
                    render={({
                        handleSubmit,
                        form,
                        submitting,
                        pristine,
                        values,
                    }) => (
                        <form
                            className={classes.searchForm}
                            onSubmit={handleSubmit}
                        >
                            <Field
                                className={classes.searchInput}
                                name="firstName"
                                component="input"
                                type="text"
                                placeholder="חפש עסק"
                            />
                            <IconButton
                                aria-label="submit"
                                type="submit"
                                size="small"
                                disabled={submitting}
                            >
                                <i className="fa-solid fa-magnifying-glass ms"></i>
                            </IconButton>
                        </form>
                    )}
                />
            </Box>
        </Root>
    );
}

const PREFIX = 'HomePage';
const classes = {
    root: `${PREFIX}-root`,
    body: `${PREFIX}-body`,
    footer: `${PREFIX}-footer`,
    newBusinessBtn: `${PREFIX}-new-business-btn`,
    searchInput: `${PREFIX}-search-input`,
    searchForm: `${PREFIX}-search-form`,
};

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                flex: 1,
            },

            [`& .${classes.newBusinessBtn}`]: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'solid 1px',
                width: '200px',
                height: '100px',
                borderRadius: 10,
                cursor: 'pointer',
            },

            [`& .${classes.searchInput}`]: {
                width: '100%',
                border: 'none',
                background: theme.palette.background.default,
                paddingInlineStart: 10,
                borderRadius: 5,
            },

            [`& .${classes.searchForm}`]: {
                display: 'flex',
                background: 'white',
                width: '100%',
                padding: 10,
                paddingInlineEnd: 5,
            },
        } as StyleSheetMap)
);
