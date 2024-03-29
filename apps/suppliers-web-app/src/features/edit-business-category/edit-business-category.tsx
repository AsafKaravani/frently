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
import {
    REMOVE_CATEGORY_FROM_BUSINESS,
    UPDATE_FIELD_VALUE,
    useTypedQuery_getBusinessCategories,
} from './gql-hooks';
import { useNavigate } from 'react-router-dom';
import { useFormHandler } from '@utils/hooks';
import { useEffect } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import { useSnackbar } from 'notistack';
import { INSERT_FIELD_VALUE } from './gql-hooks';
import { useConfirm } from 'material-ui-confirm';

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
    const { enqueueSnackbar } = useSnackbar();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const fieldValuesForm = useFormHandler({} as any);
    const businessCategoryQuery = useTypedQuery_getBusinessCategories(
        props.businessId
    );

    useEffect(() => {
        let fieldValues: any = {};
        businessCategoryQuery.data?.BusinessCategory.forEach(
            (businessCategory) => {
                businessCategory.Category?.CategoryFields.forEach(
                    (categoryField) => {
                        if (!categoryField.CategoryFieldValues[0]?.id) {
                            console.log('here');

                            INSERT_FIELD_VALUE(
                                businessCategory.Business?.id as number,
                                categoryField.id,
                                ''
                            ).then((res) => {
                                console.log('INSERT_FIELD_VALUE', res);
                            });
                            return;
                        }
                        fieldValues[
                            categoryField.CategoryFieldValues[0]?.id.toString()
                        ] = categoryField.CategoryFieldValues[0]?.value;
                    }
                );
            }
        );
        fieldValuesForm.setState(fieldValues);
    }, [businessCategoryQuery]);

    const handleFieldValueChange = async (
        fieldValueId: number,
        value: string
    ) => {
        fieldValuesForm.setStateKey(fieldValueId.toString(), value);
        console.log({
            fieldValueId,
            value,
        });
    };

    const updateFieldValues = async () => {
        const updates: ReturnType<typeof UPDATE_FIELD_VALUE>[] = [];

        Object.keys(fieldValuesForm.state).forEach((fieldValueId) => {
            updates.push(
                UPDATE_FIELD_VALUE(
                    parseInt(fieldValueId),
                    fieldValuesForm.state[fieldValueId]
                )
            );
        });

        try {
            const results = await Promise.all(updates);
            enqueueSnackbar('עסק עודכן בהצלחה.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('עדכון עסק נכשל.', { variant: 'error' });
            console.log(error);
        }
    };

    const deleteCategory = async (categoryId?: number) => {
        if (!categoryId) return;
        try {
            await confirm({ description: 'האם אתה בטוח?', title: 'אישור מחיקה', confirmationText: 'מחק', cancellationText: 'ביטול' })
            await REMOVE_CATEGORY_FROM_BUSINESS(props.businessId, categoryId);
            enqueueSnackbar('קטגוריה נמחקה.', { variant: 'success' });

        } catch (error) {
            enqueueSnackbar('מחיקה נכשלה.', { variant: 'error' });
        }
    };

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
                {businessCategoryQuery.data?.BusinessCategory.length === 0 && (
                    <Typography variant="caption" sx={{ marginBlockEnd: 2 }}>
                        לא הוזנו קטגוריות לעסק
                    </Typography>
                )}
                {businessCategoryQuery.data?.BusinessCategory.map(
                    (businessCategory) => (
                        <Box key={businessCategory.id}>
                            <Box sx={{ marginBlockEnd: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <span>{businessCategory.Category?.name}</span>
                                <i className="fa-solid fa-trash delete-icon" onClick={() => deleteCategory(businessCategory.Category?.id)}></i>

                            </Box>
                            <Box>
                                {businessCategory.Category?.CategoryFields.map(
                                    (field) => (
                                        <Box
                                            key={field.id}
                                            sx={{ display: 'flex' }}
                                        >
                                            <TextField
                                                label={field.name}
                                                name={field.name}
                                                {...formControlStyle}
                                                value={
                                                    fieldValuesForm.state[
                                                    field.CategoryFieldValues[0]?.id.toString()
                                                    ] || ''
                                                }
                                                onChange={(event) =>
                                                    handleFieldValueChange(
                                                        field
                                                            .CategoryFieldValues[0]
                                                            ?.id,
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </Box>
                                    )
                                )}
                            </Box>
                        </Box>
                    )
                )}
                <LoadingButton
                    variant="contained"
                    onClick={updateFieldValues}
                    disableElevation
                    fullWidth
                    sx={{
                        marginBlockEnd: 3,
                        marginBlockStart: businessCategoryQuery.loading ? 3 : 0,
                    }}
                    loading={businessCategoryQuery.loading}
                >
                    עדכן
                </LoadingButton>
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
        [`&.${classes.root} .delete-icon`]: {
            color: theme.palette.error.main,
            fontSize: '0.8em'
        },
    } as StyleSheetMap)
);
