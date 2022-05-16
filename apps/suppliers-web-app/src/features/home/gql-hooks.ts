import { order_by } from '@generated/zeus';
import { useTypedSubscription } from '@generated/zeus/apollo';
export const useTypedSubsciption_lastBusiness = (limit: number) =>
    useTypedSubscription({
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
                id: true,
                name: true,
                City: {
                    name: true,
                },
                createdAt: true,
            },
        ],
    });
