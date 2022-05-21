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
import { useState } from 'react';

type ProductFormProps = {
    productId: string;
};

export function ProductForm(props: ProductFormProps) {
    const productForm = useFormHandler<GraphQLTypes['Product_insert_input']>(
        {}
    );
    const upsertProduct: React.FormEventHandler<HTMLFormElement> = (event) => {
        console.log('====================================');
        console.log(productForm.state);
        console.log('====================================');
        event.preventDefault();
    };
    const onMainImageDrop = async (pictureFiles: File[]) => {
        seMainImageUrl_loading(true);
        const upload = await uploadImageToS3(pictureFiles[0]);
        seMainImageUrl_loading(false);
        productForm.setStateKey('mainImageUrl', upload.Location);
    };
    const [mainImageUrl_loading, seMainImageUrl_loading] = useState(false);
    const isEditMode = false;
    return (
        <Root className={classes.root}>
            <form dir="rtl" onSubmit={upsertProduct} autoComplete="off">
                <FormGroup>
                    <ImageUploader
                        withIcon={true}
                        buttonText="העלה תמונה ראשית"
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
                        loading={mainImageUrl_loading}
                    >
                        {props.productId ? 'עדכן' : 'שמור'}
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
