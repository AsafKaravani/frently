import { useTypedSubscription } from '@generated/zeus/apollo';


export const useTypedQuery_getBusinessCategories = (businessId: number) =>
    useTypedSubscription({
        BusinessCategory: [
            {
                where: { businessId: { _eq: businessId } }
            },
            {
                id: true,
                Category: {
                    name: true,
                    id: true,
                }
            }
        ]
    });