import { useTypedMutation } from '@generated/zeus/apollo';
import { GraphQLTypes } from '@generated/zeus/index';
import { useTypedQuery } from '@generated/zeus/apollo';
import { order_by } from '@generated/zeus';
export const useTypedMutation_insertBusiness = (
    business: GraphQLTypes['Business_insert_input']
) =>
    useTypedMutation({
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
    });

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
