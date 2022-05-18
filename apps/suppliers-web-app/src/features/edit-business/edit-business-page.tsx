import { styled } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { StyleSheetMap } from '@utils/types';
import { atom_pageName } from '@core/navigation/page-name.state';
import { useOnInit } from '@utils/hooks';
import { useState } from 'react';
import { GraphQLTypes } from '@generated/zeus/index';
import { useFormHandler } from '../../utils/hooks/index';
import {
    FormGroup,
    FormControl,
    Typography,
    TextField,
    TextFieldProps,
    InputLabel,
    Input,
    Button,
    Select,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { VariantType, useSnackbar } from 'notistack';
import { PhoneNumberMask } from '@utils/components/phone-number-mask';
import { useTypedQuery } from '../../../generated/zeus/apollo';
import {
    useTypedMutation_insertBusiness,
    useTypedQuery_getCities,
} from './gql-hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';

const formControlStyle: TextFieldProps = {
    variant: 'outlined',
    sx: { background: 'white', marginBlockEnd: 3 },
    autoComplete: 'off',
};

export function EditBusinessPage() {
    const s_setPageName = useSetRecoilState(atom_pageName);
    useOnInit(() => {
        s_setPageName('עמוד עסק');
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const businessIdToEdit = searchParams.get('businessId');
    
    const { enqueueSnackbar } = useSnackbar();

    const [businessForm, setBusinessFormField, handleBusinessFormFieldChange] =
        useFormHandler<GraphQLTypes['Business_insert_input']>({});

    const [
        insertBusiness,
        {
            data: dataInsertBusiness,
            loading: loadingInsertBusiness,
            error: errorInsertBusiness,
        },
    ] = useTypedMutation_insertBusiness(businessForm, {
        onCompleted: (data => {
            enqueueSnackbar('עסק נוסף בהצלחה.', {variant: 'success'});
            setSearchParams({businessId: data.insert_Business_one?.id});
        }),
        onError: err => enqueueSnackbar('הוספת עסק נכשלה.', {variant: 'error'})

    });
    console.log(
        'useTypedMutation_insertBusiness',
        dataInsertBusiness,
        loadingInsertBusiness,
        errorInsertBusiness
    );

    const {
        loading: loadingCities,
        error: errorCities,
        data: dataCities,
    } = useTypedQuery_getCities();

    const upsertBusiness: React.FormEventHandler<HTMLFormElement> = (event) => {
        if (businessIdToEdit) {
            enqueueSnackbar('ערוך עסק')
        } else {
            insertBusiness();
        }
        event.preventDefault();
    };

    return (
        <Root className={classes.root}>
            <form dir="rtl" onSubmit={upsertBusiness}>
                <Typography variant="caption" sx={{ marginBlockEnd: 2 }}>
                    שימו לב למלא את הפרטים הבסיסיים ורק לאחר מכן תוכלו להוסיף
                    מוצרים או קטגוריות לעסק.
                </Typography>
                <FormGroup>
                    <FormControl>
                        <TextField
                            id="name"
                            label="שם העסק"
                            {...formControlStyle}
                            onChange={handleBusinessFormFieldChange}
                            name="name"
                        />
                    </FormControl>
                    <FormControl>
                        <TextField
                            id="outlined-basic"
                            label="אימייל"
                            {...formControlStyle}
                            onChange={handleBusinessFormFieldChange}
                            name="email"
                        />
                    </FormControl>
                    <FormControl variant="standard">
                        <TextField
                            {...formControlStyle}
                            id="formatted-numberformat-input"
                            label="מספר טלפון"
                            value={businessForm.phone}
                            onChange={handleBusinessFormFieldChange}
                            name="phone"
                            InputProps={{
                                inputComponent: PhoneNumberMask as any,
                            }}
                        />
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">
                            {loadingCities ? (
                                <CircularProgress
                                    sx={{
                                        width: '20px !important',
                                        height: '20px !important',
                                    }}
                                />
                            ) : (
                                'עיר'
                            )}
                        </InputLabel>
                        <Select
                            {...formControlStyle}
                            value={businessForm.cityId || ''}
                            label="עיר"
                            name="cityId"
                            onChange={handleBusinessFormFieldChange as any}
                        >
                            {dataCities?.City.map((city) => (
                                <MenuItem key={city.id} value={city.id}>
                                    {city.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <LoadingButton
                        variant="contained"
                        type="submit"
                        disableElevation
                        loading={loadingInsertBusiness}
                    >
                        {businessIdToEdit ? 'עדכן' : 'שמור'}
                    </LoadingButton>
                </FormGroup>
            </form>
        </Root>
    );
}

const PREFIX = 'EditBusinessPage';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {
                padding: 20,
            },
        } as StyleSheetMap)
);
