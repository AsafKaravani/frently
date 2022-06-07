import { Gql } from '@generated/zeus/index';
import { useTypedSubscription, useTypedMutation } from '@generated/zeus/apollo';

export const useTypedQuery_getBusinessCategories = (businessId: number) =>
    useTypedSubscription({
        BusinessCategory: [
            {
                where: { businessId: { _eq: businessId } },
            },
            {
                id: true,
                Business: {
                    id: true,
                },
                Category: {
                    name: true,
                    id: true,
                    CategoryFields: [
                        {},
                        {
                            id: true,
                            name: true,
                            CategoryFieldValues: [
                                { where: { businessId: { _eq: businessId } } },
                                { value: true, id: true },
                            ],
                        },
                    ],
                },
            },
        ],
    });

export const useTypedMutation_insertBusinessCategory = (
    businessId: number,
    categoryId: number
) =>
    useTypedMutation({
        insert_BusinessCategory_one: [
            {
                object: {
                    businessId: businessId,
                    categoryId: categoryId,
                },
            },
            {
                id: true,
                Category: {
                    name: true,
                    id: true,
                    CategoryFields: [
                        {},
                        {
                            name: true,
                            CategoryFieldValues: [
                                { where: { businessId: { _eq: businessId } } },
                                { value: true },
                            ],
                        },
                    ],
                },
            },
        ],
    });

export const useTypedMutation_insertCategory = (categoryName: string) =>
    useTypedMutation({
        insert_Category_one: [
            {
                object: {
                    name: categoryName,
                },
            },
            {
                id: true,
                name: true,
            },
        ],
    });

export const UPDATE_FIELD_VALUE = (id: number, value: string) =>
    Gql('mutation')({
        update_CategoryFieldValue: [
            {
                where: {
                    id: { _eq: id },
                },
                _set: {
                    value: value,
                },
            },
            {
                affected_rows: true,
            },
        ],
    });

export const INSERT_FIELD_VALUE = (
    businessId: number,
    categoryFieldId: number,
    value: string
) =>
    Gql('mutation')({
        insert_CategoryFieldValue_one: [
            {
                object: {
                    businessId: businessId,
                    categoryFieldId: categoryFieldId,
                    updatedAt: new Date().toISOString(),
                    value: value,
                },
            },
            {
                id: true,
            },
        ],
    });

export const REMOVE_CATEGORY_FROM_BUSINESS = (businessId: number, categoryId: number) => Gql('mutation')({
    delete_BusinessCategory: [
        {
            where: {
                businessId: { _eq: businessId },
                categoryId: { _eq: categoryId }
            }
        },
        {
            affected_rows: true
        }
    ]
})