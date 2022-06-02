import { styled } from '@mui/material/styles';
import {
    Box,
    Typography,
    Divider,
    Button,
    TextField,
    TextFieldProps,
} from '@mui/material';
import { StyleSheetMap } from '@utils/types/index';
import { useTypedQuery_getBusinessCategories } from './gql-hooks';
import { useNavigate } from 'react-router-dom';

type EditBusinessCategoriesComponentProps = {
    businessId: number;
};

const formControlStyle: TextFieldProps = {
    variant: 'outlined',
    sx: { background: 'white', marginBlockEnd: 3, flex: 1 },
    autoComplete: 'off',
};

export function EditBusinessCategoriesComponent(
    props: EditBusinessCategoriesComponentProps
) {
    const navigate = useNavigate();
    const businessCategory = useTypedQuery_getBusinessCategories(
        props.businessId
    );

    return (
        <Root className={classes.root}>
            <Box
                sx={{
                    marginBlockEnd: '0px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Typography variant="h6" sx={{ marginBlockEnd: 2, margin: 0 }}>
                    קטגוריות
                </Typography>
                <Divider sx={{ flex: 1 }} />
                <Button
                    sx={{ paddingLeft: 4, paddingRight: 4 }}
                    className="frently__action-btn"
                    onClick={() =>
                        navigate(
                            `/edit-category?businessId=${props.businessId}`
                        )
                    }
                >
                    <i className="fa-solid fa-shapes me" />
                    הוספת קטגוריה
                </Button>
            </Box>
            <Box
                sx={{
                    marginBlockEnd: '20px',
                }}
            >
                {businessCategory.data?.BusinessCategory.length === 0 && (
                    <Typography variant="caption" sx={{ marginBlockEnd: 2 }}>
                        לא הוזנו קטגוריות לעסק
                    </Typography>
                )}
                {businessCategory.data?.BusinessCategory.map(
                    (businessCategory) => (
                        <Box key={businessCategory.id}>
                            <Box sx={{ marginBlockEnd: 1 }}>
                                {businessCategory.Category?.name}
                            </Box>
                            <Box>
                                {businessCategory.Category?.CategoryFields.map(
                                    (field) => (
                                        <Box sx={{ display: 'flex' }}>
                                            <TextField
                                                label={field.name}
                                                id="name"
                                                {...formControlStyle}
                                                value={
                                                    field.CategoryFieldValues[0]
                                                        .value || ''
                                                }
                                                name="name"
                                            />
                                        </Box>
                                    )
                                )}
                            </Box>
                        </Box>
                    )
                )}
            </Box>
        </Root>
    );
}

const PREFIX = 'EditCategoriesComponent';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {},
        } as StyleSheetMap)
);
