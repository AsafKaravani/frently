import { useTypedMutation } from '@generated/zeus/apollo';
import { GraphQLTypes, useZeusVariables } from '@generated/zeus/index';
import { useTypedQuery } from '@generated/zeus/apollo';
import { order_by } from '@generated/zeus';
export const useTypedMutation_insertBusiness = (
    business: GraphQLTypes['Business_insert_input'],
    options?: Parameters<typeof useTypedMutation>[1]
) =>
    useTypedMutation(
        {
            insert_Business_one: [
                {
                    object: {
                        ...business,
                        updatedAt: new Date().toISOString(),
                        phone: business.phone?.replace(/\D/g, ''),
                    },
                },
                {
                    id: true,
                    name: true,
                    City: {
                        name: true,
                    },
                },
            ],
        },
        options as any
    );

export const useTypedMutation_updateBusiness = (
    business: GraphQLTypes['Business_set_input'],
    options?: Parameters<typeof useTypedMutation>[1]
) =>
    useTypedMutation(
        {
            update_Business_by_pk: [
                {
                    pk_columns: { id: business.id as number },
                    _set: {
                        ...business,
                        updatedAt: new Date().toISOString(),
                        phone: business.phone?.replace(/\D/g, ''),
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

export const useTypedQuery_getCities = () =>
    useTypedQuery({
        City: [
            {
                order_by: [
                    {
                        name: order_by.asc,
                    },
                ],
            },
            {
                id: true,
                name: true,
            },
        ],
    });

export const useTypedQuery_getBusiness = (businessId: number) =>
    useTypedQuery({
        Business_by_pk: [
            { id: businessId },
            { name: true, email: true, phone: true, cityId: true, id: true },
        ],
    });

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
