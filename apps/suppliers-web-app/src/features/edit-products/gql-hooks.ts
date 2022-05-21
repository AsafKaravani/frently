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
