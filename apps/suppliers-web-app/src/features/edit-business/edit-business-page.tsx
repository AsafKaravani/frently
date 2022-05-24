import { styled } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { StyleSheetMap } from '@utils/types';
import { atom_pageName } from '@core/navigation/page-name.state';
import { useOnInit } from '@utils/hooks';
import { useState, useEffect } from 'react';
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
    Divider,
    Avatar,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { VariantType, useSnackbar } from 'notistack';
import { PhoneNumberMask } from '@utils/components/phone-number-mask';
import { useTypedQuery } from '../../../generated/zeus/apollo';
import {
    useTypedMutation_insertBusiness,
    useTypedQuery_getCities,
} from './gql-hooks';
import {
    createSearchParams,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';
import Box from '@mui/material/Box';
import { useTypedQuery_getBusinessProducts } from './gql-hooks';
import {
    useTypedQuery_getBusiness,
    useTypedMutation_updateBusiness,
} from './gql-hooks';
import { EditCategoriesComponent } from '@features/edit-category/edit-category';

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

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const businessIdToEdit = Number.parseInt(searchParams.get('businessId'));

    const isEditMode = !!businessIdToEdit;
    const {
        loading: loadingBusiness,
        error: errorBusiness,
        data: dataBusiness,
    } = useTypedQuery_getBusiness(businessIdToEdit);

    const {
        loading: products_loading,
        error: products_error,
        data: products_data,
    } = useTypedQuery_getBusinessProducts(businessIdToEdit);

    const { enqueueSnackbar } = useSnackbar();

    const {
        state: businessForm,
        setState: setFormValues,
        setStateKey: setBusinessFormField,
        handleFieldChange: handleBusinessFormFieldChange,
    } = useFormHandler<GraphQLTypes['Business_insert_input']>(
        dataBusiness?.Business_by_pk || {}
    );

    useEffect(
        () => setFormValues(dataBusiness?.Business_by_pk || {}),
        [dataBusiness]
    );

    const [
        insertBusiness,
        {
            data: dataInsertBusiness,
            loading: loadingInsertBusiness,
            error: errorInsertBusiness,
        },
    ] = useTypedMutation_insertBusiness(businessForm, {
        onCompleted: (data) => {
            enqueueSnackbar('עסק נוסף בהצלחה.', { variant: 'success' });
            setSearchParams({
                businessId: data.insert_Business_one?.id,
            } as any);
        },
        onError: (err) =>
            enqueueSnackbar('הוספת עסק נכשלה.', { variant: 'error' }),
    });

    const [
        updateBusiness,
        {
            data: dataUpdateBusiness,
            loading: loadingUpdateBusiness,
            error: errorUpdateBusiness,
        },
    ] = useTypedMutation_updateBusiness(businessForm, {
        onCompleted: (data) => {
            enqueueSnackbar('עסק עודכן בהצלחה.', { variant: 'success' });
            setSearchParams({
                businessId: data.update_Business_by_pk?.id,
            } as any);
        },
        onError: (err) =>
            enqueueSnackbar('עדכון עסק נכשל.', { variant: 'error' }),
    });

    const {
        loading: loadingCities,
        error: errorCities,
        data: dataCities,
    } = useTypedQuery_getCities();

    const upsertBusiness: React.FormEventHandler<HTMLFormElement> = (event) => {
        if (isEditMode) {
            updateBusiness();
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
                            label="שם העסק"
                            id="name"
                            {...formControlStyle}
                            value={businessForm.name || ''}
                            onChange={handleBusinessFormFieldChange}
                            name="name"
                        />
                    </FormControl>
                    <FormControl>
                        <TextField
                            label="אימייל"
                            id="outlined-basic"
                            {...formControlStyle}
                            value={businessForm.email || ''}
                            onChange={handleBusinessFormFieldChange}
                            name="email"
                        />
                    </FormControl>
                    <FormControl>
                        <TextField
                            label="מספר טלפון"
                            {...formControlStyle}
                            id="formatted-numberformat-input"
                            value={businessForm.phone || ''}
                            onChange={handleBusinessFormFieldChange}
                            name="phone"
                            InputProps={{
                                inputComponent: PhoneNumberMask as any,
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <InputLabel>
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
                            label="עיר"
                            {...formControlStyle}
                            value={(!dataCities || !dataBusiness) ? '' : businessForm.cityId}
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
                        sx={{ marginBlockEnd: 3 }}
                        loading={loadingInsertBusiness}
                    >
                        {businessIdToEdit ? 'עדכן' : 'שמור'}
                    </LoadingButton>
                </FormGroup>
            </form>

            <EditCategoriesComponent />

            {products_data?.Business_by_pk?.Products.length > 0 ? <Box
                sx={{
                    marginBlockEnd: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Typography variant="h6" sx={{ marginBlockEnd: 2, margin: 0 }}>
                    מוצרים
                </Typography>
                <Divider sx={{ flex: 1 }} />
                <Button
                    sx={{ paddingLeft: 4, paddingRight: 4 }}
                    className="frently__action-btn"
                    onClick={() =>
                        navigate(
                            `/edit-products?businessId=${businessIdToEdit}`
                        )
                    }
                >
                    <i className="fa-solid fa-boxes me" />
                    הוספת מוצר
                </Button>
            </Box> : <></>}
            <Box
                sx={{
                    gap: '10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                }}
            >
                {products_data?.Business_by_pk?.Products.length === 0 && (
                    <Typography variant="caption" sx={{ marginBlockEnd: 2 }}>
                        לא הוזנו מוצרים בעסק
                    </Typography>
                )}
                {products_data?.Business_by_pk?.Products.map((product) => (
                    <Button
                        key={product.id}
                        variant="outlined"
                        fullWidth
                        sx={{
                            background: 'white',
                            justifyContent: 'flex-start',
                        }}
                        onClick={() =>
                            navigate({
                                pathname: '/edit-products',
                                search: createSearchParams({
                                    businessId: businessIdToEdit.toString(),
                                    productId: product.id.toString(),
                                }).toString(),
                            })
                        }
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                alt="Remy Sharp"
                                src={product.mainImageUrl}
                                sx={{ marginInlineEnd: 2 }}
                            />

                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    flexDirection: 'column',
                                }}
                            >
                                <Typography sx={{ fontWeight: 600 }}>
                                    {product.name}
                                </Typography>
                                <Typography>{product.price}₪</Typography>
                            </Box>
                        </Box>
                    </Button>
                ))}
            </Box>
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
