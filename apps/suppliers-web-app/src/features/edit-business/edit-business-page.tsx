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
} from '@mui/material';
import { PhoneNumberMask } from '@utils/components/phone-number-mask';

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

    const [businessForm, setBusinessFormField, handleBusinessFormFieldChange] =
        useFormHandler<GraphQLTypes['Business_insert_input']>({});

    return (
        <Root className={classes.root}>
            <form dir="rtl">
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
                        />
                    </FormControl>
                    <FormControl>
                        <TextField
                            id="outlined-basic"
                            label="אימייל"
                            {...formControlStyle}
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
