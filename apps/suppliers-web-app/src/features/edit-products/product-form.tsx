import { styled } from '@mui/material/styles';
import { StyleSheetMap } from '@utils/types';
import { GraphQLTypes } from '@generated/zeus/index';
import { LoadingButton } from '@mui/lab';
import {
    FormGroup,
    FormControl,
    TextField,
    InputLabel,
    CircularProgress,
    Select,
    MenuItem,
} from '@mui/material';
import ImageUploader from 'react-images-upload';

import { useFormHandler } from '@utils/hooks/index';
import { PriceFormatInput } from '@utils/components/price-input';
import { uploadImageToS3 } from '@services/s3';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import {
    useTypedMutation_insertProduct,
    useTypedMutation_updateProduct,
} from './gql-hooks';
import { useSearchParams } from 'react-router-dom';
import { useTypedQuery_getProductByPk } from './gql-hooks';

type ProductFormProps = {
    productId?: number;
    businessId: number;
};

export function ProductForm(props: ProductFormProps) {
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useSearchParams();
    const productId = Number.parseInt(search.get('productId') || '');
    const businessId = Number.parseInt(search.get('businessId') || '');
    const isEditMode = !!productId;
    console.log(search);

    const { loading: product_loading, data: product_data } =
        useTypedQuery_getProductByPk(productId);

    const productForm = useFormHandler<GraphQLTypes['Product_insert_input']>({
        businessId: businessId,
    });
    useEffect(() => {
        if (product_data) productForm.setState(product_data?.Product_by_pk);
    }, [product_data]);

    const onMainImageDrop = async (pictureFiles: File[]) => {
        seMainImageUrl_loading(true);
        const upload = await uploadImageToS3(pictureFiles[0]);
        seMainImageUrl_loading(false);
        productForm.setStateKey('mainImageUrl', upload.Location);
    };

    const [updateProduct, { loading: updateProduct_loading }] =
        useTypedMutation_updateProduct(productForm.state, {
            onCompleted: (data) => {
                setSearch({
                    ...Object.fromEntries([...search]),
                    productId: data?.update_Product_by_pk?.id,
                } as any);
                enqueueSnackbar(`מוצר עודכן בהצלחה.`, { variant: 'success' });
            },
            onError: (data) =>
                enqueueSnackbar(`עדכון מוצר נכשלה.`, { variant: 'error' }),
        });

    const [insertProduct, { loading: insertProduct_loading }] =
        useTypedMutation_insertProduct(productForm.state, {
            onCompleted: (data) => {
                setSearch({
                    ...Object.fromEntries([...search]),
                    productId: data?.insert_Product_one?.id,
                } as any);
                enqueueSnackbar(`מוצר נוצר בהצלחה.`, { variant: 'success' });
            },
            onError: (data) =>
                enqueueSnackbar(`יצירת מוצר נכשלה.`, { variant: 'error' }),
        });

    const upsertProduct: React.FormEventHandler<HTMLFormElement> = (event) => {
        if (isEditMode) updateProduct();
        else insertProduct();
        event.preventDefault();
    };

    const [mainImageUrl_loading, seMainImageUrl_loading] = useState(false);

    return (
        <Root className={classes.root}>
            <form dir="rtl" onSubmit={upsertProduct} autoComplete="off">
                <FormGroup>
                    <ImageUploader
                        withIcon={true}
                        buttonText="העלה תמונה ראשית"
                        defaultImage={productForm.state.mainImageUrl}
                        withLabel={false}
                        onChange={onMainImageDrop}
                        imgExtension={['.jpg', '.gif', '.png', '.gif']}
                        maxFileSize={5242880}
                        withPreview
                        singleImage
                    />
                    <FormControl>
                        <TextField
                            label="שם מוצר"
                            defaultValue={isEditMode ? ' ' : ''}
                            value={productForm.state.name}
                            onChange={productForm.handleFieldChange}
                            name="name"
                        />
                    </FormControl>
                    <FormControl>
                        <TextField
                            label="מחיר ליום"
                            value={productForm.state.price}
                            onChange={productForm.handleFieldChange}
                            name="price"
                            InputProps={{
                                inputComponent: PriceFormatInput as any,
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <TextField
                            label="כמות"
                            defaultValue={isEditMode ? ' ' : ''}
                            value={productForm.state.quota}
                            onChange={productForm.handleFieldChange}
                            inputProps={{ inputMode: 'numeric' }}
                            name="quota"
                        />
                    </FormControl>
                    <LoadingButton
                        variant="contained"
                        type="submit"
                        disableElevation
                        sx={{ marginBlockEnd: 3 }}
                        loading={
                            mainImageUrl_loading ||
                            insertProduct_loading ||
                            product_loading
                        }
                    >
                        {isEditMode ? 'עדכן' : 'שמור'}
                    </LoadingButton>
                </FormGroup>
            </form>
        </Root>
    );
}

const PREFIX = 'ProductForm';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {},
            [`& .MuiInputBase-root`]: {
                marginBlockEnd: '20px',
                background: 'white',
            },
        } as StyleSheetMap)
);
