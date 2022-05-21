import { useTypedMutation } from '@generated/zeus/apollo';
import { GraphQLTypes, useZeusVariables } from '@generated/zeus/index';
import { useTypedQuery } from '@generated/zeus/apollo';
import { order_by } from '@generated/zeus';

export const useTypedQuery_getBusinessProducts = (
    businessId: number,
    options?: Parameters<typeof useTypedQuery>[1]
) =>
    useTypedQuery(
        {
            Business_by_pk: [
                { id: businessId },
                {
                    id: true,
                    name: true,
                    Products: [
                        {},
                        {
                            id: true,
                            name: true,
                            ImagesUrls: true,
                            mainImageUrl: true,
                            price: true,
                            quota: true,
                            ProductCategories: [
                                {},
                                {
                                    id: true,
                                    // Category: [
                                    //     {},
                                    //     {
                                    //         name: true,
                                    //     },
                                    // ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        options as any
    );

export const useTypedQuery_getProductByPk = (
    productId: number,
    options?: Parameters<typeof useTypedQuery>[1]
) =>
    useTypedQuery(
        {
            Product_by_pk: [
                { id: productId },
                {
                    id: true,
                    name: true,
                    ImagesUrls: true,
                    mainImageUrl: true,
                    price: true,
                    quota: true,
                },
            ],
        },
        options as any
    );

export const useTypedMutation_insertProduct = (
    product: GraphQLTypes['Product_insert_input'],
    options?: Parameters<typeof useTypedMutation>[1]
) =>
    useTypedMutation(
        {
            insert_Product_one: [
                {
                    object: {
                        ...product,
                        updatedAt: new Date().toISOString(),
                    },
                },
                { id: true, name: true },
            ],
        },
        options as any
    );

export const useTypedMutation_updateProduct = (
    product: GraphQLTypes['Product_insert_input'],
    options?: Parameters<typeof useTypedMutation>[1]
) =>
    useTypedMutation(
        {
            update_Product_by_pk: [
                {
                    pk_columns: {
                        id: product.id as number,
                    },
                    _set: {
                        ...product,
                        updatedAt: new Date().toISOString(),
                    },
                },
                {
                    id: true,
                    name: true,
                },
            ],
        },
        options as any
    );
