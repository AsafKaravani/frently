import { styled } from '@mui/material/styles';
import { Box, Typography, Divider } from '@mui/material';
import { StyleSheetMap } from '@utils/types/index';
import { useTypedQuery_getBusinessCategories } from './gql-hooks';

type EditCategoriesComponentProps = {
    businessId: number;
};

export function EditCategoriesComponent(props: EditCategoriesComponentProps) {
    const businessCategory = useTypedQuery_getBusinessCategories(props.businessId);
    console.log(businessCategory.data?.BusinessCategory);

    return <Root className={classes.root}>
        <Box sx={{
            marginBlockEnd: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
        }}>
            <Typography variant="h6" sx={{ marginBlockEnd: 2, margin: 0 }}>
                קטגוריות
            </Typography>
            <Divider sx={{ flex: 1 }} />


        </Box>
        <Box sx={{
            marginBlockEnd: '20px'
        }}>
            {businessCategory.data?.BusinessCategory.map(businessCategory => (
                <Box>
                    {businessCategory.Category?.name}
                </Box>
            ))}
        </Box>
    </Root>;
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
