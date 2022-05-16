import { order_by } from '@generated/zeus';
import { useTypedQuery } from '@generated/zeus/apollo';
export const useTypedQuery_lastBusiness = (limit: number) =>
    useTypedQuery({
        Business: [
            {
                order_by: [
                    {
                        createdAt: order_by.desc,
                    },
                ],
                limit: limit,
            },
            {
                name: true,
                City: {
                    name: true,
                },
                createdAt: true,
            },
        ],
    });
