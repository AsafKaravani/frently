import { styled } from '@mui/material/styles';
import { StyleSheetMap } from '@utils/types';
import { useTypedQuery_getBusinessProducts } from '../edit-business/gql-hooks';
import { useSetRecoilState } from 'recoil';
import { useOnInit } from '@utils/hooks/index';
import { atom_pageName } from '@core/navigation/page-name.state';
import { useSearchParams } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { ProductForm } from './product-form';

export function EditProductsPage() {
    const s_setPageName = useSetRecoilState(atom_pageName);
    useOnInit(() => {
        s_setPageName('מוצרים');
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const businessId = Number.parseInt(searchParams.get('businessId') || '-1');

    const {
        data: products_data,
        loading: products_loading,
        error: prodcuts_error,
    } = useTypedQuery_getBusinessProducts(businessId);

    useEffect(() => {
        s_setPageName(`${'מוצרים'} - ${products_data?.Business_by_pk?.name}`);
    }, [products_data]);

    return (
        <Root className={classes.root}>
            <Typography variant="caption" sx={{ marginBlockEnd: 2 }}>
                כאן אפשר לערוך את המוצרים המוצעים בעסק.
            </Typography>
            <ProductForm />
        </Root>
    );
}

const PREFIX = 'Comp';
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
