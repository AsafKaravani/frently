import { styled } from '@mui/material/styles';
import { Box, Typography, Divider, Button } from '@mui/material';
import { StyleSheetMap } from '@utils/types/index';
import { useTypedQuery_getBusinessCategories } from './gql-hooks';
import { useNavigate } from 'react-router-dom';

type EditBusinessCategoriesComponentProps = {
    businessId: number;
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
                    marginBlockEnd: '20px',
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
                        <Box
                            onClick={() =>
                                navigate(
                                    `/edit-category?businessId=${props.businessId}&categoryId=${businessCategory?.Category?.id}`
                                )
                            }
                        >
                            {businessCategory.Category?.name}
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
