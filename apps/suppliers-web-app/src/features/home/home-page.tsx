import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { atom_pageName } from '@core/navigation/page-name.state';
import { useOnInit } from '@utils/hooks';
import { StyleSheetMap } from '@utils/types';
import { Form, Field } from 'react-final-form';
import { useTypedSubsciption_lastBusiness } from './gql-hooks';
import { useState } from 'react';

const onSubmit = async (values) => {
    window.alert(JSON.stringify(values, 0, 2));
};

export function HomePage() {
    const s_setPageName = useSetRecoilState(atom_pageName);
    const navigate = useNavigate();
    const lastBusinessesSubscription = useTypedSubsciption_lastBusiness(5);

    const [, forceUpdate] = useState({});

    useOnInit(() => {
        s_setPageName('בית');
        forceUpdate({});
    });

    return (
        <Root className={classes.root}>
            <Box
                sx={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex',
                }}
            >
                <img
                    src="../../../src/assets/imgs/business-3d-girl-with-coffee-1.png"
                    width="71%"
                />
            </Box>
            <Button
                sx={{ fontSize: 16, fontWeight: 600 }}
                variant="outlined"
                className={classes.newBusinessBtn}
                onClick={() => navigate('/edit-business')}
            >
                <i className="fa-solid fa-plus me" />
                הוסף עסק
            </Button>

            <Typography
                sx={{ marginBlockStart: 2, marginBlockEnd: 2, opacity: 0.3 }}
            >
                או חפש עסק קיים
            </Typography>

            <Box
                sx={{
                    marginBlockEnd: 2,
                    width: '100%',
                    overflow: 'scroll',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {lastBusinessesSubscription.loading && (
                    <CircularProgress className={classes.loading} />
                )}
                {!lastBusinessesSubscription.loading &&
                    lastBusinessesSubscription.data?.Business.map(
                        (business) => (
                            <Button
                                key={business.id}
                                variant="text"
                                className={classes.businessBtn}
                            >
                                <Chip
                                    label={
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-end',
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: '1em',
                                                }}
                                            >
                                                {business?.name}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.8em',
                                                    marginInlineStart: 0.5,
                                                    color: '#0000004d',
                                                }}
                                            >
                                                {business?.City.name}
                                            </Typography>
                                        </Box>
                                    }
                                    color="primary"
                                    sx={{ background: 'white', border: 'none' }}
                                    variant="outlined"
                                />
                            </Button>
                        )
                    )}
            </Box>
            <Box sx={{ width: '100%', height: 55 }}>
                <Form
                    onSubmit={onSubmit}
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
                                placeholder="שם העסק"
                                autoComplete="off"
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
    businessBtn: `${PREFIX}-businesses-btn`,
    loading: `${PREFIX}-loading`,
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
                width: '200px',
                height: '100px',
                borderRadius: 10,
                cursor: 'pointer',
                background: 'white',
                border: 'none',
            },

            [`& .${classes.searchForm}`]: {
                display: 'flex',
                background: 'white',
                width: '100%',
                padding: 10,
                paddingInlineEnd: 5,
                height: '100%',
            },

            [`& .${classes.searchInput}`]: {
                width: '100%',
                border: 'none',
                background: theme.palette.background.default,
                paddingInlineStart: 10,
                borderRadius: 5,
                outline: 'none',
            },

            [`& .${classes.businessBtn}`]: {
                padding: 0,
                borderRadius: 100,
                marginInlineStart: 10,
                flex: 'none',
                scrollbarWidth: 'none',
                scrollbarGutter: 0,
            },

            [`& .${classes.businessBtn}::-webkit-scrollbar`]: {
                display: 'none',
            },
            [`& .${classes.loading}`]: {
                width: '20px !important',
                height: '20px !important',
            },
        } as StyleSheetMap)
);
