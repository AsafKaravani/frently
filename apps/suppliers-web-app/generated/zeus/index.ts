/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
export const HOST = "http://34.134.43.92/v1/graphql"



const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json();
};

export const apiFetch = (options: fetchOptions) => (query: string, variables: Record<string, unknown> = {}) => {
  const fetchOptions = options[1] || {};
  if (fetchOptions.method && fetchOptions.method === 'GET') {
    return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  }
  return fetch(`${options[0]}`, {
    body: JSON.stringify({ query, variables }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...fetchOptions,
  })
    .then(handleFetchResponse)
    .then((response: GraphQLResponse) => {
      if (response.errors) {
        throw new GraphQLError(response);
      }
      return response.data;
    });
};




export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};






export const InternalsBuildQuery = (
  props: AllTypesPropsType,
  returns: ReturnTypesType,
  ops: Operations,
  options?: OperationOptions,
) => {
  const ibb = (k: string, o: InputValueType | VType, p = '', root = true): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt(props, returns, ops, options?.variables?.values)(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const hasVariables = root && options?.variables?.$params ? `(${options.variables?.$params})` : '';
    const keyForDirectives = o.__directives ?? '';
    return `${k} ${keyForDirectives}${hasOperationName}${hasVariables}{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false))
      .join('\n')}}`;
  };
  return ibb;
};










export const Thunder = (fn: FetchFunction) => <
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>
>(
  operation: O,
) => <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions) =>
  fullChainConstruct(fn)(operation)(o as any, ops) as Promise<InputType<GraphQLTypes[R], Z>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder = (fn: SubscriptionFunction) => <
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>
>(
  operation: O,
) => <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions) =>
  fullSubscriptionConstruct(fn)(operation)(o as any, ops) as SubscriptionToGraphQL<Z, GraphQLTypes[R]>;

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>
>(
  operation: O,
  o: Z | ValueTypes[R],
  ops?: OperationOptions,
) => InternalsBuildQuery(AllTypesProps, ReturnTypes, Ops, ops)(operation, o as any);
export const Selector = <T extends keyof ValueTypes>(key: T) => ZeusSelect<ValueTypes[T]>();

export const Gql = Chain(HOST);






export const fullChainConstruct = (fn: FetchFunction) => (t: 'query' | 'mutation' | 'subscription') => (
  o: Record<any, any>,
  options?: OperationOptions,
) => {
  const builder = InternalsBuildQuery(AllTypesProps, ReturnTypes, Ops, options);
  return fn(builder(t, o), options?.variables?.values);
};






export const fullSubscriptionConstruct = (fn: SubscriptionFunction) => (t: 'query' | 'mutation' | 'subscription') => (
  o: Record<any, any>,
  options?: OperationOptions,
) => {
  const builder = InternalsBuildQuery(AllTypesProps, ReturnTypes, Ops, options);
  return fn(builder(t, o));
};





export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | boolean
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string | undefined>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, any>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions<Z extends Record<string, unknown> = Record<string, unknown>> = {
  variables?: VariableInput<Z>;
  operationName?: string;
};

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;


export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');




const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (typeof propsP1 === 'boolean' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'object') {
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = (
  props: AllTypesPropsType,
  returns: ReturnTypesType,
  ops: Operations,
  variables?: Record<string, unknown>,
) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (a.startsWith('$') && variables?.[a.slice(1)]) {
        return a;
      }
      const checkType = ResolveFromPath(props, returns, ops)(p);
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};




export const resolverFor = <X, T extends keyof ValueTypes, Z extends keyof ValueTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ValueTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : any,
) => fn as (args?: any, source?: any) => any;


export type SelectionFunction<V> = <T>(t: T | V) => T;
export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;




export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
type IsArray<T, U> = T extends Array<infer R> ? InputType<R, U>[] : InputType<T, U>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string;

type IsInterfaced<SRC extends DeepAnify<DST>, DST> = FlattenArray<SRC> extends ZEUS_INTERFACES | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P]>
          : Record<string, unknown>
        : never;
    }[keyof DST] &
      {
        [P in keyof Omit<
          Pick<
            SRC,
            {
              [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
            }[keyof DST]
          >,
          '__typename'
        >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? SRC[P] : IsArray<SRC[P], DST[P]>;
      }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver ? SRC[P] : IsArray<SRC[P], DST[P]>;
    };

export type MapType<SRC, DST> = SRC extends DeepAnify<DST> ? IsInterfaced<SRC, DST> : never;
export type InputType<SRC, DST> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P]>[keyof MapType<SRC, R[P]>];
    } &
      MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>>
  : MapType<SRC, IsPayLoad<DST>>;
export type SubscriptionToGraphQL<Z, T> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z>; errors?: string[] }) => void) => void;
  open: () => void;
};


export const useZeusVariables =
  <T>(variables: T) =>
  <
    Z extends {
      [P in keyof T]: unknown;
    },
  >(
    values: Z,
  ) => {
    return {
      $params: Object.keys(variables)
        .map((k) => `$${k}: ${variables[k as keyof T]}`)
        .join(', '),
      $: <U extends keyof Z>(variable: U) => {
        return `$${variable}` as unknown as Z[U];
      },
      values,
    };
  };

export type VariableInput<Z extends Record<string, unknown>> = {
  $params: ReturnType<ReturnType<typeof useZeusVariables>>['$params'];
  values: Z;
};


type ZEUS_INTERFACES = never
type ZEUS_UNIONS = never

export type ValueTypes = {
    /** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
["Boolean_comparison_exp"]: {
	_eq?: boolean | undefined | null,
	_gt?: boolean | undefined | null,
	_gte?: boolean | undefined | null,
	_in?: Array<boolean> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: boolean | undefined | null,
	_lte?: boolean | undefined | null,
	_neq?: boolean | undefined | null,
	_nin?: Array<boolean> | undefined | null
};
	/** columns and relationships of "Business" */
["Business"]: AliasType<{
BusinessCategories?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory"]],
BusinessCategories_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory_aggregate"]],
BusinessWorkers?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker"]],
BusinessWorkers_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker_aggregate"]],
CategoryFieldValues?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue"]],
CategoryFieldValues_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue_aggregate"]],
	/** An object relationship */
	City?:ValueTypes["City"],
Products?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Product_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Product_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Product_bool_exp"] | undefined | null},ValueTypes["Product"]],
Products_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Product_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Product_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Product_bool_exp"] | undefined | null},ValueTypes["Product_aggregate"]],
	cityId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	phone?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** columns and relationships of "BusinessCategory" */
["BusinessCategory"]: AliasType<{
	/** An object relationship */
	Business?:ValueTypes["Business"],
	/** An object relationship */
	Category?:ValueTypes["Category"],
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "BusinessCategory" */
["BusinessCategory_aggregate"]: AliasType<{
	aggregate?:ValueTypes["BusinessCategory_aggregate_fields"],
	nodes?:ValueTypes["BusinessCategory"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "BusinessCategory" */
["BusinessCategory_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["BusinessCategory_avg_fields"],
count?: [{	columns?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["BusinessCategory_max_fields"],
	min?:ValueTypes["BusinessCategory_min_fields"],
	stddev?:ValueTypes["BusinessCategory_stddev_fields"],
	stddev_pop?:ValueTypes["BusinessCategory_stddev_pop_fields"],
	stddev_samp?:ValueTypes["BusinessCategory_stddev_samp_fields"],
	sum?:ValueTypes["BusinessCategory_sum_fields"],
	var_pop?:ValueTypes["BusinessCategory_var_pop_fields"],
	var_samp?:ValueTypes["BusinessCategory_var_samp_fields"],
	variance?:ValueTypes["BusinessCategory_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "BusinessCategory" */
["BusinessCategory_aggregate_order_by"]: {
	avg?: ValueTypes["BusinessCategory_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["BusinessCategory_max_order_by"] | undefined | null,
	min?: ValueTypes["BusinessCategory_min_order_by"] | undefined | null,
	stddev?: ValueTypes["BusinessCategory_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["BusinessCategory_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["BusinessCategory_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["BusinessCategory_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["BusinessCategory_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["BusinessCategory_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["BusinessCategory_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "BusinessCategory" */
["BusinessCategory_arr_rel_insert_input"]: {
	data: Array<ValueTypes["BusinessCategory_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["BusinessCategory_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["BusinessCategory_avg_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "BusinessCategory" */
["BusinessCategory_avg_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "BusinessCategory". All fields are combined with a logical 'AND'. */
["BusinessCategory_bool_exp"]: {
	Business?: ValueTypes["Business_bool_exp"] | undefined | null,
	Category?: ValueTypes["Category_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["BusinessCategory_bool_exp"]> | undefined | null,
	_not?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["BusinessCategory_bool_exp"]> | undefined | null,
	businessId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	categoryId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "BusinessCategory" */
["BusinessCategory_constraint"]:BusinessCategory_constraint;
	/** input type for incrementing numeric columns in table "BusinessCategory" */
["BusinessCategory_inc_input"]: {
	businessId?: number | undefined | null,
	categoryId?: number | undefined | null,
	id?: number | undefined | null
};
	/** input type for inserting data into table "BusinessCategory" */
["BusinessCategory_insert_input"]: {
	Business?: ValueTypes["Business_obj_rel_insert_input"] | undefined | null,
	Category?: ValueTypes["Category_obj_rel_insert_input"] | undefined | null,
	businessId?: number | undefined | null,
	categoryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null
};
	/** aggregate max on columns */
["BusinessCategory_max_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "BusinessCategory" */
["BusinessCategory_max_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["BusinessCategory_min_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "BusinessCategory" */
["BusinessCategory_min_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "BusinessCategory" */
["BusinessCategory_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["BusinessCategory"],
		__typename?: boolean | `@${string}`
}>;
	/** on_conflict condition type for table "BusinessCategory" */
["BusinessCategory_on_conflict"]: {
	constraint: ValueTypes["BusinessCategory_constraint"],
	update_columns: Array<ValueTypes["BusinessCategory_update_column"]>,
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "BusinessCategory". */
["BusinessCategory_order_by"]: {
	Business?: ValueTypes["Business_order_by"] | undefined | null,
	Category?: ValueTypes["Category_order_by"] | undefined | null,
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: BusinessCategory */
["BusinessCategory_pk_columns_input"]: {
	id: number
};
	/** select columns of table "BusinessCategory" */
["BusinessCategory_select_column"]:BusinessCategory_select_column;
	/** input type for updating data in table "BusinessCategory" */
["BusinessCategory_set_input"]: {
	businessId?: number | undefined | null,
	categoryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null
};
	/** aggregate stddev on columns */
["BusinessCategory_stddev_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["BusinessCategory_stddev_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["BusinessCategory_stddev_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["BusinessCategory_sum_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "BusinessCategory" */
["BusinessCategory_sum_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "BusinessCategory" */
["BusinessCategory_update_column"]:BusinessCategory_update_column;
	/** aggregate var_pop on columns */
["BusinessCategory_var_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "BusinessCategory" */
["BusinessCategory_var_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["BusinessCategory_var_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "BusinessCategory" */
["BusinessCategory_var_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["BusinessCategory_variance_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "BusinessCategory" */
["BusinessCategory_variance_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** columns and relationships of "BusinessWorker" */
["BusinessWorker"]: AliasType<{
	/** An object relationship */
	Business?:ValueTypes["Business"],
	/** An object relationship */
	Profile?:ValueTypes["Profile"],
	businessId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	duty?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "BusinessWorker" */
["BusinessWorker_aggregate"]: AliasType<{
	aggregate?:ValueTypes["BusinessWorker_aggregate_fields"],
	nodes?:ValueTypes["BusinessWorker"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "BusinessWorker" */
["BusinessWorker_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["BusinessWorker_avg_fields"],
count?: [{	columns?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["BusinessWorker_max_fields"],
	min?:ValueTypes["BusinessWorker_min_fields"],
	stddev?:ValueTypes["BusinessWorker_stddev_fields"],
	stddev_pop?:ValueTypes["BusinessWorker_stddev_pop_fields"],
	stddev_samp?:ValueTypes["BusinessWorker_stddev_samp_fields"],
	sum?:ValueTypes["BusinessWorker_sum_fields"],
	var_pop?:ValueTypes["BusinessWorker_var_pop_fields"],
	var_samp?:ValueTypes["BusinessWorker_var_samp_fields"],
	variance?:ValueTypes["BusinessWorker_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "BusinessWorker" */
["BusinessWorker_aggregate_order_by"]: {
	avg?: ValueTypes["BusinessWorker_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["BusinessWorker_max_order_by"] | undefined | null,
	min?: ValueTypes["BusinessWorker_min_order_by"] | undefined | null,
	stddev?: ValueTypes["BusinessWorker_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["BusinessWorker_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["BusinessWorker_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["BusinessWorker_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["BusinessWorker_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["BusinessWorker_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["BusinessWorker_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "BusinessWorker" */
["BusinessWorker_arr_rel_insert_input"]: {
	data: Array<ValueTypes["BusinessWorker_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["BusinessWorker_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["BusinessWorker_avg_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "BusinessWorker" */
["BusinessWorker_avg_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "BusinessWorker". All fields are combined with a logical 'AND'. */
["BusinessWorker_bool_exp"]: {
	Business?: ValueTypes["Business_bool_exp"] | undefined | null,
	Profile?: ValueTypes["Profile_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["BusinessWorker_bool_exp"]> | undefined | null,
	_not?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["BusinessWorker_bool_exp"]> | undefined | null,
	businessId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	duty?: ValueTypes["Duty_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	profileId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "BusinessWorker" */
["BusinessWorker_constraint"]:BusinessWorker_constraint;
	/** input type for incrementing numeric columns in table "BusinessWorker" */
["BusinessWorker_inc_input"]: {
	businessId?: number | undefined | null,
	id?: number | undefined | null,
	profileId?: number | undefined | null
};
	/** input type for inserting data into table "BusinessWorker" */
["BusinessWorker_insert_input"]: {
	Business?: ValueTypes["Business_obj_rel_insert_input"] | undefined | null,
	Profile?: ValueTypes["Profile_obj_rel_insert_input"] | undefined | null,
	businessId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	duty?: ValueTypes["Duty"] | undefined | null,
	id?: number | undefined | null,
	profileId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["BusinessWorker_max_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	duty?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "BusinessWorker" */
["BusinessWorker_max_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	duty?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["BusinessWorker_min_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	duty?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "BusinessWorker" */
["BusinessWorker_min_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	duty?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "BusinessWorker" */
["BusinessWorker_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["BusinessWorker"],
		__typename?: boolean | `@${string}`
}>;
	/** on_conflict condition type for table "BusinessWorker" */
["BusinessWorker_on_conflict"]: {
	constraint: ValueTypes["BusinessWorker_constraint"],
	update_columns: Array<ValueTypes["BusinessWorker_update_column"]>,
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "BusinessWorker". */
["BusinessWorker_order_by"]: {
	Business?: ValueTypes["Business_order_by"] | undefined | null,
	Profile?: ValueTypes["Profile_order_by"] | undefined | null,
	businessId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	duty?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: BusinessWorker */
["BusinessWorker_pk_columns_input"]: {
	id: number
};
	/** select columns of table "BusinessWorker" */
["BusinessWorker_select_column"]:BusinessWorker_select_column;
	/** input type for updating data in table "BusinessWorker" */
["BusinessWorker_set_input"]: {
	businessId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	duty?: ValueTypes["Duty"] | undefined | null,
	id?: number | undefined | null,
	profileId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["BusinessWorker_stddev_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["BusinessWorker_stddev_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["BusinessWorker_stddev_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["BusinessWorker_sum_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "BusinessWorker" */
["BusinessWorker_sum_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "BusinessWorker" */
["BusinessWorker_update_column"]:BusinessWorker_update_column;
	/** aggregate var_pop on columns */
["BusinessWorker_var_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "BusinessWorker" */
["BusinessWorker_var_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["BusinessWorker_var_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "BusinessWorker" */
["BusinessWorker_var_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["BusinessWorker_variance_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "BusinessWorker" */
["BusinessWorker_variance_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregated selection of "Business" */
["Business_aggregate"]: AliasType<{
	aggregate?:ValueTypes["Business_aggregate_fields"],
	nodes?:ValueTypes["Business"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "Business" */
["Business_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["Business_avg_fields"],
count?: [{	columns?: Array<ValueTypes["Business_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["Business_max_fields"],
	min?:ValueTypes["Business_min_fields"],
	stddev?:ValueTypes["Business_stddev_fields"],
	stddev_pop?:ValueTypes["Business_stddev_pop_fields"],
	stddev_samp?:ValueTypes["Business_stddev_samp_fields"],
	sum?:ValueTypes["Business_sum_fields"],
	var_pop?:ValueTypes["Business_var_pop_fields"],
	var_samp?:ValueTypes["Business_var_samp_fields"],
	variance?:ValueTypes["Business_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "Business" */
["Business_aggregate_order_by"]: {
	avg?: ValueTypes["Business_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["Business_max_order_by"] | undefined | null,
	min?: ValueTypes["Business_min_order_by"] | undefined | null,
	stddev?: ValueTypes["Business_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["Business_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["Business_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["Business_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["Business_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["Business_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["Business_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "Business" */
["Business_arr_rel_insert_input"]: {
	data: Array<ValueTypes["Business_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["Business_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["Business_avg_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "Business" */
["Business_avg_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "Business". All fields are combined with a logical 'AND'. */
["Business_bool_exp"]: {
	BusinessCategories?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null,
	BusinessWorkers?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null,
	CategoryFieldValues?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null,
	City?: ValueTypes["City_bool_exp"] | undefined | null,
	Products?: ValueTypes["Product_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["Business_bool_exp"]> | undefined | null,
	_not?: ValueTypes["Business_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["Business_bool_exp"]> | undefined | null,
	cityId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	email?: ValueTypes["String_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	name?: ValueTypes["String_comparison_exp"] | undefined | null,
	phone?: ValueTypes["String_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "Business" */
["Business_constraint"]:Business_constraint;
	/** input type for incrementing numeric columns in table "Business" */
["Business_inc_input"]: {
	cityId?: number | undefined | null,
	id?: number | undefined | null
};
	/** input type for inserting data into table "Business" */
["Business_insert_input"]: {
	BusinessCategories?: ValueTypes["BusinessCategory_arr_rel_insert_input"] | undefined | null,
	BusinessWorkers?: ValueTypes["BusinessWorker_arr_rel_insert_input"] | undefined | null,
	CategoryFieldValues?: ValueTypes["CategoryFieldValue_arr_rel_insert_input"] | undefined | null,
	City?: ValueTypes["City_obj_rel_insert_input"] | undefined | null,
	Products?: ValueTypes["Product_arr_rel_insert_input"] | undefined | null,
	cityId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	email?: string | undefined | null,
	id?: number | undefined | null,
	name?: string | undefined | null,
	phone?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["Business_max_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	phone?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "Business" */
["Business_max_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	email?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	phone?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["Business_min_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	phone?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "Business" */
["Business_min_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	email?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	phone?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "Business" */
["Business_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["Business"],
		__typename?: boolean | `@${string}`
}>;
	/** input type for inserting object relation for remote table "Business" */
["Business_obj_rel_insert_input"]: {
	data: ValueTypes["Business_insert_input"],
	/** upsert condition */
	on_conflict?: ValueTypes["Business_on_conflict"] | undefined | null
};
	/** on_conflict condition type for table "Business" */
["Business_on_conflict"]: {
	constraint: ValueTypes["Business_constraint"],
	update_columns: Array<ValueTypes["Business_update_column"]>,
	where?: ValueTypes["Business_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "Business". */
["Business_order_by"]: {
	BusinessCategories_aggregate?: ValueTypes["BusinessCategory_aggregate_order_by"] | undefined | null,
	BusinessWorkers_aggregate?: ValueTypes["BusinessWorker_aggregate_order_by"] | undefined | null,
	CategoryFieldValues_aggregate?: ValueTypes["CategoryFieldValue_aggregate_order_by"] | undefined | null,
	City?: ValueTypes["City_order_by"] | undefined | null,
	Products_aggregate?: ValueTypes["Product_aggregate_order_by"] | undefined | null,
	cityId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	email?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	phone?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: Business */
["Business_pk_columns_input"]: {
	id: number
};
	/** select columns of table "Business" */
["Business_select_column"]:Business_select_column;
	/** input type for updating data in table "Business" */
["Business_set_input"]: {
	cityId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	email?: string | undefined | null,
	id?: number | undefined | null,
	name?: string | undefined | null,
	phone?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["Business_stddev_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "Business" */
["Business_stddev_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["Business_stddev_pop_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "Business" */
["Business_stddev_pop_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["Business_stddev_samp_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "Business" */
["Business_stddev_samp_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["Business_sum_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "Business" */
["Business_sum_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "Business" */
["Business_update_column"]:Business_update_column;
	/** aggregate var_pop on columns */
["Business_var_pop_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "Business" */
["Business_var_pop_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["Business_var_samp_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "Business" */
["Business_var_samp_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["Business_variance_fields"]: AliasType<{
	cityId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "Business" */
["Business_variance_order_by"]: {
	cityId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** columns and relationships of "Category" */
["Category"]: AliasType<{
BusinessCategories?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory"]],
BusinessCategories_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory_aggregate"]],
CategoryFields?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryField_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryField_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryField_bool_exp"] | undefined | null},ValueTypes["CategoryField"]],
CategoryFields_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryField_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryField_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryField_bool_exp"] | undefined | null},ValueTypes["CategoryField_aggregate"]],
ProductCategories?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory"]],
ProductCategories_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory_aggregate"]],
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** columns and relationships of "CategoryField" */
["CategoryField"]: AliasType<{
	/** An object relationship */
	Category?:ValueTypes["Category"],
CategoryFieldValues?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue"]],
CategoryFieldValues_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue_aggregate"]],
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	options?:boolean | `@${string}`,
	required?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** columns and relationships of "CategoryFieldValue" */
["CategoryFieldValue"]: AliasType<{
	/** An object relationship */
	Business?:ValueTypes["Business"],
	/** An object relationship */
	CategoryField?:ValueTypes["CategoryField"],
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "CategoryFieldValue" */
["CategoryFieldValue_aggregate"]: AliasType<{
	aggregate?:ValueTypes["CategoryFieldValue_aggregate_fields"],
	nodes?:ValueTypes["CategoryFieldValue"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "CategoryFieldValue" */
["CategoryFieldValue_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["CategoryFieldValue_avg_fields"],
count?: [{	columns?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["CategoryFieldValue_max_fields"],
	min?:ValueTypes["CategoryFieldValue_min_fields"],
	stddev?:ValueTypes["CategoryFieldValue_stddev_fields"],
	stddev_pop?:ValueTypes["CategoryFieldValue_stddev_pop_fields"],
	stddev_samp?:ValueTypes["CategoryFieldValue_stddev_samp_fields"],
	sum?:ValueTypes["CategoryFieldValue_sum_fields"],
	var_pop?:ValueTypes["CategoryFieldValue_var_pop_fields"],
	var_samp?:ValueTypes["CategoryFieldValue_var_samp_fields"],
	variance?:ValueTypes["CategoryFieldValue_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "CategoryFieldValue" */
["CategoryFieldValue_aggregate_order_by"]: {
	avg?: ValueTypes["CategoryFieldValue_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["CategoryFieldValue_max_order_by"] | undefined | null,
	min?: ValueTypes["CategoryFieldValue_min_order_by"] | undefined | null,
	stddev?: ValueTypes["CategoryFieldValue_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["CategoryFieldValue_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["CategoryFieldValue_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["CategoryFieldValue_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["CategoryFieldValue_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["CategoryFieldValue_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["CategoryFieldValue_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "CategoryFieldValue" */
["CategoryFieldValue_arr_rel_insert_input"]: {
	data: Array<ValueTypes["CategoryFieldValue_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["CategoryFieldValue_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["CategoryFieldValue_avg_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_avg_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "CategoryFieldValue". All fields are combined with a logical 'AND'. */
["CategoryFieldValue_bool_exp"]: {
	Business?: ValueTypes["Business_bool_exp"] | undefined | null,
	CategoryField?: ValueTypes["CategoryField_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["CategoryFieldValue_bool_exp"]> | undefined | null,
	_not?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["CategoryFieldValue_bool_exp"]> | undefined | null,
	businessId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	categoryFieldId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	value?: ValueTypes["String_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "CategoryFieldValue" */
["CategoryFieldValue_constraint"]:CategoryFieldValue_constraint;
	/** input type for incrementing numeric columns in table "CategoryFieldValue" */
["CategoryFieldValue_inc_input"]: {
	businessId?: number | undefined | null,
	categoryFieldId?: number | undefined | null,
	id?: number | undefined | null
};
	/** input type for inserting data into table "CategoryFieldValue" */
["CategoryFieldValue_insert_input"]: {
	Business?: ValueTypes["Business_obj_rel_insert_input"] | undefined | null,
	CategoryField?: ValueTypes["CategoryField_obj_rel_insert_input"] | undefined | null,
	businessId?: number | undefined | null,
	categoryFieldId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null,
	value?: string | undefined | null
};
	/** aggregate max on columns */
["CategoryFieldValue_max_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_max_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null,
	value?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["CategoryFieldValue_min_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_min_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null,
	value?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "CategoryFieldValue" */
["CategoryFieldValue_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["CategoryFieldValue"],
		__typename?: boolean | `@${string}`
}>;
	/** on_conflict condition type for table "CategoryFieldValue" */
["CategoryFieldValue_on_conflict"]: {
	constraint: ValueTypes["CategoryFieldValue_constraint"],
	update_columns: Array<ValueTypes["CategoryFieldValue_update_column"]>,
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "CategoryFieldValue". */
["CategoryFieldValue_order_by"]: {
	Business?: ValueTypes["Business_order_by"] | undefined | null,
	CategoryField?: ValueTypes["CategoryField_order_by"] | undefined | null,
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null,
	value?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: CategoryFieldValue */
["CategoryFieldValue_pk_columns_input"]: {
	id: number
};
	/** select columns of table "CategoryFieldValue" */
["CategoryFieldValue_select_column"]:CategoryFieldValue_select_column;
	/** input type for updating data in table "CategoryFieldValue" */
["CategoryFieldValue_set_input"]: {
	businessId?: number | undefined | null,
	categoryFieldId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null,
	value?: string | undefined | null
};
	/** aggregate stddev on columns */
["CategoryFieldValue_stddev_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["CategoryFieldValue_stddev_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["CategoryFieldValue_stddev_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["CategoryFieldValue_sum_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_sum_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "CategoryFieldValue" */
["CategoryFieldValue_update_column"]:CategoryFieldValue_update_column;
	/** aggregate var_pop on columns */
["CategoryFieldValue_var_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_var_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["CategoryFieldValue_var_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_var_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["CategoryFieldValue_variance_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	categoryFieldId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_variance_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	categoryFieldId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregated selection of "CategoryField" */
["CategoryField_aggregate"]: AliasType<{
	aggregate?:ValueTypes["CategoryField_aggregate_fields"],
	nodes?:ValueTypes["CategoryField"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "CategoryField" */
["CategoryField_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["CategoryField_avg_fields"],
count?: [{	columns?: Array<ValueTypes["CategoryField_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["CategoryField_max_fields"],
	min?:ValueTypes["CategoryField_min_fields"],
	stddev?:ValueTypes["CategoryField_stddev_fields"],
	stddev_pop?:ValueTypes["CategoryField_stddev_pop_fields"],
	stddev_samp?:ValueTypes["CategoryField_stddev_samp_fields"],
	sum?:ValueTypes["CategoryField_sum_fields"],
	var_pop?:ValueTypes["CategoryField_var_pop_fields"],
	var_samp?:ValueTypes["CategoryField_var_samp_fields"],
	variance?:ValueTypes["CategoryField_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "CategoryField" */
["CategoryField_aggregate_order_by"]: {
	avg?: ValueTypes["CategoryField_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["CategoryField_max_order_by"] | undefined | null,
	min?: ValueTypes["CategoryField_min_order_by"] | undefined | null,
	stddev?: ValueTypes["CategoryField_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["CategoryField_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["CategoryField_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["CategoryField_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["CategoryField_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["CategoryField_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["CategoryField_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "CategoryField" */
["CategoryField_arr_rel_insert_input"]: {
	data: Array<ValueTypes["CategoryField_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["CategoryField_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["CategoryField_avg_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "CategoryField" */
["CategoryField_avg_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "CategoryField". All fields are combined with a logical 'AND'. */
["CategoryField_bool_exp"]: {
	Category?: ValueTypes["Category_bool_exp"] | undefined | null,
	CategoryFieldValues?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["CategoryField_bool_exp"]> | undefined | null,
	_not?: ValueTypes["CategoryField_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["CategoryField_bool_exp"]> | undefined | null,
	categoryId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	options?: ValueTypes["_text_comparison_exp"] | undefined | null,
	required?: ValueTypes["Boolean_comparison_exp"] | undefined | null,
	type?: ValueTypes["FieldType_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "CategoryField" */
["CategoryField_constraint"]:CategoryField_constraint;
	/** input type for incrementing numeric columns in table "CategoryField" */
["CategoryField_inc_input"]: {
	categoryId?: number | undefined | null,
	id?: number | undefined | null
};
	/** input type for inserting data into table "CategoryField" */
["CategoryField_insert_input"]: {
	Category?: ValueTypes["Category_obj_rel_insert_input"] | undefined | null,
	CategoryFieldValues?: ValueTypes["CategoryFieldValue_arr_rel_insert_input"] | undefined | null,
	categoryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	options?: ValueTypes["_text"] | undefined | null,
	required?: boolean | undefined | null,
	type?: ValueTypes["FieldType"] | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["CategoryField_max_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "CategoryField" */
["CategoryField_max_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	type?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["CategoryField_min_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "CategoryField" */
["CategoryField_min_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	type?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "CategoryField" */
["CategoryField_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["CategoryField"],
		__typename?: boolean | `@${string}`
}>;
	/** input type for inserting object relation for remote table "CategoryField" */
["CategoryField_obj_rel_insert_input"]: {
	data: ValueTypes["CategoryField_insert_input"],
	/** upsert condition */
	on_conflict?: ValueTypes["CategoryField_on_conflict"] | undefined | null
};
	/** on_conflict condition type for table "CategoryField" */
["CategoryField_on_conflict"]: {
	constraint: ValueTypes["CategoryField_constraint"],
	update_columns: Array<ValueTypes["CategoryField_update_column"]>,
	where?: ValueTypes["CategoryField_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "CategoryField". */
["CategoryField_order_by"]: {
	Category?: ValueTypes["Category_order_by"] | undefined | null,
	CategoryFieldValues_aggregate?: ValueTypes["CategoryFieldValue_aggregate_order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	options?: ValueTypes["order_by"] | undefined | null,
	required?: ValueTypes["order_by"] | undefined | null,
	type?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: CategoryField */
["CategoryField_pk_columns_input"]: {
	id: number
};
	/** select columns of table "CategoryField" */
["CategoryField_select_column"]:CategoryField_select_column;
	/** input type for updating data in table "CategoryField" */
["CategoryField_set_input"]: {
	categoryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	options?: ValueTypes["_text"] | undefined | null,
	required?: boolean | undefined | null,
	type?: ValueTypes["FieldType"] | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["CategoryField_stddev_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "CategoryField" */
["CategoryField_stddev_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["CategoryField_stddev_pop_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "CategoryField" */
["CategoryField_stddev_pop_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["CategoryField_stddev_samp_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "CategoryField" */
["CategoryField_stddev_samp_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["CategoryField_sum_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "CategoryField" */
["CategoryField_sum_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "CategoryField" */
["CategoryField_update_column"]:CategoryField_update_column;
	/** aggregate var_pop on columns */
["CategoryField_var_pop_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "CategoryField" */
["CategoryField_var_pop_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["CategoryField_var_samp_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "CategoryField" */
["CategoryField_var_samp_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["CategoryField_variance_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "CategoryField" */
["CategoryField_variance_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null
};
	/** aggregated selection of "Category" */
["Category_aggregate"]: AliasType<{
	aggregate?:ValueTypes["Category_aggregate_fields"],
	nodes?:ValueTypes["Category"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "Category" */
["Category_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["Category_avg_fields"],
count?: [{	columns?: Array<ValueTypes["Category_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["Category_max_fields"],
	min?:ValueTypes["Category_min_fields"],
	stddev?:ValueTypes["Category_stddev_fields"],
	stddev_pop?:ValueTypes["Category_stddev_pop_fields"],
	stddev_samp?:ValueTypes["Category_stddev_samp_fields"],
	sum?:ValueTypes["Category_sum_fields"],
	var_pop?:ValueTypes["Category_var_pop_fields"],
	var_samp?:ValueTypes["Category_var_samp_fields"],
	variance?:ValueTypes["Category_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate avg on columns */
["Category_avg_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Boolean expression to filter rows from the table "Category". All fields are combined with a logical 'AND'. */
["Category_bool_exp"]: {
	BusinessCategories?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null,
	CategoryFields?: ValueTypes["CategoryField_bool_exp"] | undefined | null,
	ProductCategories?: ValueTypes["ProductCategory_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["Category_bool_exp"]> | undefined | null,
	_not?: ValueTypes["Category_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["Category_bool_exp"]> | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	name?: ValueTypes["String_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "Category" */
["Category_constraint"]:Category_constraint;
	/** input type for incrementing numeric columns in table "Category" */
["Category_inc_input"]: {
	id?: number | undefined | null
};
	/** input type for inserting data into table "Category" */
["Category_insert_input"]: {
	BusinessCategories?: ValueTypes["BusinessCategory_arr_rel_insert_input"] | undefined | null,
	CategoryFields?: ValueTypes["CategoryField_arr_rel_insert_input"] | undefined | null,
	ProductCategories?: ValueTypes["ProductCategory_arr_rel_insert_input"] | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	name?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["Category_max_fields"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate min on columns */
["Category_min_fields"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** response of any mutation on the table "Category" */
["Category_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["Category"],
		__typename?: boolean | `@${string}`
}>;
	/** input type for inserting object relation for remote table "Category" */
["Category_obj_rel_insert_input"]: {
	data: ValueTypes["Category_insert_input"],
	/** upsert condition */
	on_conflict?: ValueTypes["Category_on_conflict"] | undefined | null
};
	/** on_conflict condition type for table "Category" */
["Category_on_conflict"]: {
	constraint: ValueTypes["Category_constraint"],
	update_columns: Array<ValueTypes["Category_update_column"]>,
	where?: ValueTypes["Category_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "Category". */
["Category_order_by"]: {
	BusinessCategories_aggregate?: ValueTypes["BusinessCategory_aggregate_order_by"] | undefined | null,
	CategoryFields_aggregate?: ValueTypes["CategoryField_aggregate_order_by"] | undefined | null,
	ProductCategories_aggregate?: ValueTypes["ProductCategory_aggregate_order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: Category */
["Category_pk_columns_input"]: {
	id: number
};
	/** select columns of table "Category" */
["Category_select_column"]:Category_select_column;
	/** input type for updating data in table "Category" */
["Category_set_input"]: {
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	name?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["Category_stddev_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_pop on columns */
["Category_stddev_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_samp on columns */
["Category_stddev_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate sum on columns */
["Category_sum_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** update columns of table "Category" */
["Category_update_column"]:Category_update_column;
	/** aggregate var_pop on columns */
["Category_var_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate var_samp on columns */
["Category_var_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate variance on columns */
["Category_variance_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** columns and relationships of "City" */
["City"]: AliasType<{
Businesses?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Business_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Business_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Business_bool_exp"] | undefined | null},ValueTypes["Business"]],
Businesses_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Business_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Business_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Business_bool_exp"] | undefined | null},ValueTypes["Business_aggregate"]],
	countryCode?:boolean | `@${string}`,
	countryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	stateCode?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	wikiDataId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "City" */
["City_aggregate"]: AliasType<{
	aggregate?:ValueTypes["City_aggregate_fields"],
	nodes?:ValueTypes["City"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "City" */
["City_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["City_avg_fields"],
count?: [{	columns?: Array<ValueTypes["City_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["City_max_fields"],
	min?:ValueTypes["City_min_fields"],
	stddev?:ValueTypes["City_stddev_fields"],
	stddev_pop?:ValueTypes["City_stddev_pop_fields"],
	stddev_samp?:ValueTypes["City_stddev_samp_fields"],
	sum?:ValueTypes["City_sum_fields"],
	var_pop?:ValueTypes["City_var_pop_fields"],
	var_samp?:ValueTypes["City_var_samp_fields"],
	variance?:ValueTypes["City_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate avg on columns */
["City_avg_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Boolean expression to filter rows from the table "City". All fields are combined with a logical 'AND'. */
["City_bool_exp"]: {
	Businesses?: ValueTypes["Business_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["City_bool_exp"]> | undefined | null,
	_not?: ValueTypes["City_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["City_bool_exp"]> | undefined | null,
	countryCode?: ValueTypes["String_comparison_exp"] | undefined | null,
	countryId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	flag?: ValueTypes["Int_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	latitude?: ValueTypes["numeric_comparison_exp"] | undefined | null,
	longitude?: ValueTypes["numeric_comparison_exp"] | undefined | null,
	name?: ValueTypes["String_comparison_exp"] | undefined | null,
	stateCode?: ValueTypes["String_comparison_exp"] | undefined | null,
	stateId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	wikiDataId?: ValueTypes["String_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "City" */
["City_constraint"]:City_constraint;
	/** input type for incrementing numeric columns in table "City" */
["City_inc_input"]: {
	countryId?: number | undefined | null,
	flag?: number | undefined | null,
	id?: number | undefined | null,
	latitude?: ValueTypes["numeric"] | undefined | null,
	longitude?: ValueTypes["numeric"] | undefined | null,
	stateId?: number | undefined | null
};
	/** input type for inserting data into table "City" */
["City_insert_input"]: {
	Businesses?: ValueTypes["Business_arr_rel_insert_input"] | undefined | null,
	countryCode?: string | undefined | null,
	countryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	flag?: number | undefined | null,
	id?: number | undefined | null,
	latitude?: ValueTypes["numeric"] | undefined | null,
	longitude?: ValueTypes["numeric"] | undefined | null,
	name?: string | undefined | null,
	stateCode?: string | undefined | null,
	stateId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null,
	wikiDataId?: string | undefined | null
};
	/** aggregate max on columns */
["City_max_fields"]: AliasType<{
	countryCode?:boolean | `@${string}`,
	countryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	stateCode?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	wikiDataId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate min on columns */
["City_min_fields"]: AliasType<{
	countryCode?:boolean | `@${string}`,
	countryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	stateCode?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	wikiDataId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** response of any mutation on the table "City" */
["City_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["City"],
		__typename?: boolean | `@${string}`
}>;
	/** input type for inserting object relation for remote table "City" */
["City_obj_rel_insert_input"]: {
	data: ValueTypes["City_insert_input"],
	/** upsert condition */
	on_conflict?: ValueTypes["City_on_conflict"] | undefined | null
};
	/** on_conflict condition type for table "City" */
["City_on_conflict"]: {
	constraint: ValueTypes["City_constraint"],
	update_columns: Array<ValueTypes["City_update_column"]>,
	where?: ValueTypes["City_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "City". */
["City_order_by"]: {
	Businesses_aggregate?: ValueTypes["Business_aggregate_order_by"] | undefined | null,
	countryCode?: ValueTypes["order_by"] | undefined | null,
	countryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	flag?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	latitude?: ValueTypes["order_by"] | undefined | null,
	longitude?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	stateCode?: ValueTypes["order_by"] | undefined | null,
	stateId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null,
	wikiDataId?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: City */
["City_pk_columns_input"]: {
	id: number
};
	/** select columns of table "City" */
["City_select_column"]:City_select_column;
	/** input type for updating data in table "City" */
["City_set_input"]: {
	countryCode?: string | undefined | null,
	countryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	flag?: number | undefined | null,
	id?: number | undefined | null,
	latitude?: ValueTypes["numeric"] | undefined | null,
	longitude?: ValueTypes["numeric"] | undefined | null,
	name?: string | undefined | null,
	stateCode?: string | undefined | null,
	stateId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null,
	wikiDataId?: string | undefined | null
};
	/** aggregate stddev on columns */
["City_stddev_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_pop on columns */
["City_stddev_pop_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_samp on columns */
["City_stddev_samp_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate sum on columns */
["City_sum_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** update columns of table "City" */
["City_update_column"]:City_update_column;
	/** aggregate var_pop on columns */
["City_var_pop_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate var_samp on columns */
["City_var_samp_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate variance on columns */
["City_variance_fields"]: AliasType<{
	countryId?:boolean | `@${string}`,
	flag?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	latitude?:boolean | `@${string}`,
	longitude?:boolean | `@${string}`,
	stateId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Duty"]:unknown;
	/** Boolean expression to compare columns of type "Duty". All fields are combined with logical 'AND'. */
["Duty_comparison_exp"]: {
	_eq?: ValueTypes["Duty"] | undefined | null,
	_gt?: ValueTypes["Duty"] | undefined | null,
	_gte?: ValueTypes["Duty"] | undefined | null,
	_in?: Array<ValueTypes["Duty"]> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: ValueTypes["Duty"] | undefined | null,
	_lte?: ValueTypes["Duty"] | undefined | null,
	_neq?: ValueTypes["Duty"] | undefined | null,
	_nin?: Array<ValueTypes["Duty"]> | undefined | null
};
	["FieldType"]:unknown;
	/** Boolean expression to compare columns of type "FieldType". All fields are combined with logical 'AND'. */
["FieldType_comparison_exp"]: {
	_eq?: ValueTypes["FieldType"] | undefined | null,
	_gt?: ValueTypes["FieldType"] | undefined | null,
	_gte?: ValueTypes["FieldType"] | undefined | null,
	_in?: Array<ValueTypes["FieldType"]> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: ValueTypes["FieldType"] | undefined | null,
	_lte?: ValueTypes["FieldType"] | undefined | null,
	_neq?: ValueTypes["FieldType"] | undefined | null,
	_nin?: Array<ValueTypes["FieldType"]> | undefined | null
};
	/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
["Int_comparison_exp"]: {
	_eq?: number | undefined | null,
	_gt?: number | undefined | null,
	_gte?: number | undefined | null,
	_in?: Array<number> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: number | undefined | null,
	_lte?: number | undefined | null,
	_neq?: number | undefined | null,
	_nin?: Array<number> | undefined | null
};
	/** columns and relationships of "Product" */
["Product"]: AliasType<{
	/** An object relationship */
	Business?:ValueTypes["Business"],
	ImagesUrls?:boolean | `@${string}`,
ProductCategories?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory"]],
ProductCategories_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory_aggregate"]],
	businessId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	mainImageUrl?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** columns and relationships of "ProductCategory" */
["ProductCategory"]: AliasType<{
	/** An object relationship */
	Category?:ValueTypes["Category"],
	/** An object relationship */
	Product?:ValueTypes["Product"],
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "ProductCategory" */
["ProductCategory_aggregate"]: AliasType<{
	aggregate?:ValueTypes["ProductCategory_aggregate_fields"],
	nodes?:ValueTypes["ProductCategory"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "ProductCategory" */
["ProductCategory_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["ProductCategory_avg_fields"],
count?: [{	columns?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["ProductCategory_max_fields"],
	min?:ValueTypes["ProductCategory_min_fields"],
	stddev?:ValueTypes["ProductCategory_stddev_fields"],
	stddev_pop?:ValueTypes["ProductCategory_stddev_pop_fields"],
	stddev_samp?:ValueTypes["ProductCategory_stddev_samp_fields"],
	sum?:ValueTypes["ProductCategory_sum_fields"],
	var_pop?:ValueTypes["ProductCategory_var_pop_fields"],
	var_samp?:ValueTypes["ProductCategory_var_samp_fields"],
	variance?:ValueTypes["ProductCategory_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "ProductCategory" */
["ProductCategory_aggregate_order_by"]: {
	avg?: ValueTypes["ProductCategory_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["ProductCategory_max_order_by"] | undefined | null,
	min?: ValueTypes["ProductCategory_min_order_by"] | undefined | null,
	stddev?: ValueTypes["ProductCategory_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["ProductCategory_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["ProductCategory_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["ProductCategory_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["ProductCategory_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["ProductCategory_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["ProductCategory_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "ProductCategory" */
["ProductCategory_arr_rel_insert_input"]: {
	data: Array<ValueTypes["ProductCategory_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["ProductCategory_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["ProductCategory_avg_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "ProductCategory" */
["ProductCategory_avg_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "ProductCategory". All fields are combined with a logical 'AND'. */
["ProductCategory_bool_exp"]: {
	Category?: ValueTypes["Category_bool_exp"] | undefined | null,
	Product?: ValueTypes["Product_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["ProductCategory_bool_exp"]> | undefined | null,
	_not?: ValueTypes["ProductCategory_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["ProductCategory_bool_exp"]> | undefined | null,
	categoryId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	productId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "ProductCategory" */
["ProductCategory_constraint"]:ProductCategory_constraint;
	/** input type for incrementing numeric columns in table "ProductCategory" */
["ProductCategory_inc_input"]: {
	categoryId?: number | undefined | null,
	id?: number | undefined | null,
	productId?: number | undefined | null
};
	/** input type for inserting data into table "ProductCategory" */
["ProductCategory_insert_input"]: {
	Category?: ValueTypes["Category_obj_rel_insert_input"] | undefined | null,
	Product?: ValueTypes["Product_obj_rel_insert_input"] | undefined | null,
	categoryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	productId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["ProductCategory_max_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "ProductCategory" */
["ProductCategory_max_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["ProductCategory_min_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "ProductCategory" */
["ProductCategory_min_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "ProductCategory" */
["ProductCategory_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["ProductCategory"],
		__typename?: boolean | `@${string}`
}>;
	/** on_conflict condition type for table "ProductCategory" */
["ProductCategory_on_conflict"]: {
	constraint: ValueTypes["ProductCategory_constraint"],
	update_columns: Array<ValueTypes["ProductCategory_update_column"]>,
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "ProductCategory". */
["ProductCategory_order_by"]: {
	Category?: ValueTypes["Category_order_by"] | undefined | null,
	Product?: ValueTypes["Product_order_by"] | undefined | null,
	categoryId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: ProductCategory */
["ProductCategory_pk_columns_input"]: {
	id: number
};
	/** select columns of table "ProductCategory" */
["ProductCategory_select_column"]:ProductCategory_select_column;
	/** input type for updating data in table "ProductCategory" */
["ProductCategory_set_input"]: {
	categoryId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	productId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["ProductCategory_stddev_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "ProductCategory" */
["ProductCategory_stddev_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["ProductCategory_stddev_pop_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "ProductCategory" */
["ProductCategory_stddev_pop_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["ProductCategory_stddev_samp_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "ProductCategory" */
["ProductCategory_stddev_samp_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["ProductCategory_sum_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "ProductCategory" */
["ProductCategory_sum_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "ProductCategory" */
["ProductCategory_update_column"]:ProductCategory_update_column;
	/** aggregate var_pop on columns */
["ProductCategory_var_pop_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "ProductCategory" */
["ProductCategory_var_pop_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["ProductCategory_var_samp_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "ProductCategory" */
["ProductCategory_var_samp_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["ProductCategory_variance_fields"]: AliasType<{
	categoryId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	productId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "ProductCategory" */
["ProductCategory_variance_order_by"]: {
	categoryId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	productId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregated selection of "Product" */
["Product_aggregate"]: AliasType<{
	aggregate?:ValueTypes["Product_aggregate_fields"],
	nodes?:ValueTypes["Product"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "Product" */
["Product_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["Product_avg_fields"],
count?: [{	columns?: Array<ValueTypes["Product_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["Product_max_fields"],
	min?:ValueTypes["Product_min_fields"],
	stddev?:ValueTypes["Product_stddev_fields"],
	stddev_pop?:ValueTypes["Product_stddev_pop_fields"],
	stddev_samp?:ValueTypes["Product_stddev_samp_fields"],
	sum?:ValueTypes["Product_sum_fields"],
	var_pop?:ValueTypes["Product_var_pop_fields"],
	var_samp?:ValueTypes["Product_var_samp_fields"],
	variance?:ValueTypes["Product_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "Product" */
["Product_aggregate_order_by"]: {
	avg?: ValueTypes["Product_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["Product_max_order_by"] | undefined | null,
	min?: ValueTypes["Product_min_order_by"] | undefined | null,
	stddev?: ValueTypes["Product_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["Product_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["Product_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["Product_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["Product_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["Product_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["Product_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "Product" */
["Product_arr_rel_insert_input"]: {
	data: Array<ValueTypes["Product_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["Product_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["Product_avg_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "Product" */
["Product_avg_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "Product". All fields are combined with a logical 'AND'. */
["Product_bool_exp"]: {
	Business?: ValueTypes["Business_bool_exp"] | undefined | null,
	ImagesUrls?: ValueTypes["_text_comparison_exp"] | undefined | null,
	ProductCategories?: ValueTypes["ProductCategory_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["Product_bool_exp"]> | undefined | null,
	_not?: ValueTypes["Product_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["Product_bool_exp"]> | undefined | null,
	businessId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	mainImageUrl?: ValueTypes["String_comparison_exp"] | undefined | null,
	name?: ValueTypes["String_comparison_exp"] | undefined | null,
	price?: ValueTypes["Int_comparison_exp"] | undefined | null,
	quota?: ValueTypes["Int_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "Product" */
["Product_constraint"]:Product_constraint;
	/** input type for incrementing numeric columns in table "Product" */
["Product_inc_input"]: {
	businessId?: number | undefined | null,
	id?: number | undefined | null,
	price?: number | undefined | null,
	quota?: number | undefined | null
};
	/** input type for inserting data into table "Product" */
["Product_insert_input"]: {
	Business?: ValueTypes["Business_obj_rel_insert_input"] | undefined | null,
	ImagesUrls?: ValueTypes["_text"] | undefined | null,
	ProductCategories?: ValueTypes["ProductCategory_arr_rel_insert_input"] | undefined | null,
	businessId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	mainImageUrl?: string | undefined | null,
	name?: string | undefined | null,
	price?: number | undefined | null,
	quota?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["Product_max_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	mainImageUrl?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "Product" */
["Product_max_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	mainImageUrl?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["Product_min_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	mainImageUrl?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "Product" */
["Product_min_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	mainImageUrl?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "Product" */
["Product_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["Product"],
		__typename?: boolean | `@${string}`
}>;
	/** input type for inserting object relation for remote table "Product" */
["Product_obj_rel_insert_input"]: {
	data: ValueTypes["Product_insert_input"],
	/** upsert condition */
	on_conflict?: ValueTypes["Product_on_conflict"] | undefined | null
};
	/** on_conflict condition type for table "Product" */
["Product_on_conflict"]: {
	constraint: ValueTypes["Product_constraint"],
	update_columns: Array<ValueTypes["Product_update_column"]>,
	where?: ValueTypes["Product_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "Product". */
["Product_order_by"]: {
	Business?: ValueTypes["Business_order_by"] | undefined | null,
	ImagesUrls?: ValueTypes["order_by"] | undefined | null,
	ProductCategories_aggregate?: ValueTypes["ProductCategory_aggregate_order_by"] | undefined | null,
	businessId?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	mainImageUrl?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: Product */
["Product_pk_columns_input"]: {
	id: number
};
	/** select columns of table "Product" */
["Product_select_column"]:Product_select_column;
	/** input type for updating data in table "Product" */
["Product_set_input"]: {
	ImagesUrls?: ValueTypes["_text"] | undefined | null,
	businessId?: number | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	mainImageUrl?: string | undefined | null,
	name?: string | undefined | null,
	price?: number | undefined | null,
	quota?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["Product_stddev_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "Product" */
["Product_stddev_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["Product_stddev_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "Product" */
["Product_stddev_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["Product_stddev_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "Product" */
["Product_stddev_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["Product_sum_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "Product" */
["Product_sum_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "Product" */
["Product_update_column"]:Product_update_column;
	/** aggregate var_pop on columns */
["Product_var_pop_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "Product" */
["Product_var_pop_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["Product_var_samp_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "Product" */
["Product_var_samp_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["Product_variance_fields"]: AliasType<{
	businessId?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	quota?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "Product" */
["Product_variance_order_by"]: {
	businessId?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	price?: ValueTypes["order_by"] | undefined | null,
	quota?: ValueTypes["order_by"] | undefined | null
};
	/** columns and relationships of "Profile" */
["Profile"]: AliasType<{
BusinessWorkers?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker"]],
BusinessWorkers_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker_aggregate"]],
RolesOfProfiles?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile"]],
RolesOfProfiles_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile_aggregate"]],
	auth?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "Profile" */
["Profile_aggregate"]: AliasType<{
	aggregate?:ValueTypes["Profile_aggregate_fields"],
	nodes?:ValueTypes["Profile"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "Profile" */
["Profile_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["Profile_avg_fields"],
count?: [{	columns?: Array<ValueTypes["Profile_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["Profile_max_fields"],
	min?:ValueTypes["Profile_min_fields"],
	stddev?:ValueTypes["Profile_stddev_fields"],
	stddev_pop?:ValueTypes["Profile_stddev_pop_fields"],
	stddev_samp?:ValueTypes["Profile_stddev_samp_fields"],
	sum?:ValueTypes["Profile_sum_fields"],
	var_pop?:ValueTypes["Profile_var_pop_fields"],
	var_samp?:ValueTypes["Profile_var_samp_fields"],
	variance?:ValueTypes["Profile_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate avg on columns */
["Profile_avg_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Boolean expression to filter rows from the table "Profile". All fields are combined with a logical 'AND'. */
["Profile_bool_exp"]: {
	BusinessWorkers?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null,
	RolesOfProfiles?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["Profile_bool_exp"]> | undefined | null,
	_not?: ValueTypes["Profile_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["Profile_bool_exp"]> | undefined | null,
	auth?: ValueTypes["String_comparison_exp"] | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	name?: ValueTypes["String_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "Profile" */
["Profile_constraint"]:Profile_constraint;
	/** input type for incrementing numeric columns in table "Profile" */
["Profile_inc_input"]: {
	id?: number | undefined | null
};
	/** input type for inserting data into table "Profile" */
["Profile_insert_input"]: {
	BusinessWorkers?: ValueTypes["BusinessWorker_arr_rel_insert_input"] | undefined | null,
	RolesOfProfiles?: ValueTypes["RolesOfProfile_arr_rel_insert_input"] | undefined | null,
	auth?: string | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	name?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["Profile_max_fields"]: AliasType<{
	auth?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate min on columns */
["Profile_min_fields"]: AliasType<{
	auth?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** response of any mutation on the table "Profile" */
["Profile_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["Profile"],
		__typename?: boolean | `@${string}`
}>;
	/** input type for inserting object relation for remote table "Profile" */
["Profile_obj_rel_insert_input"]: {
	data: ValueTypes["Profile_insert_input"],
	/** upsert condition */
	on_conflict?: ValueTypes["Profile_on_conflict"] | undefined | null
};
	/** on_conflict condition type for table "Profile" */
["Profile_on_conflict"]: {
	constraint: ValueTypes["Profile_constraint"],
	update_columns: Array<ValueTypes["Profile_update_column"]>,
	where?: ValueTypes["Profile_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "Profile". */
["Profile_order_by"]: {
	BusinessWorkers_aggregate?: ValueTypes["BusinessWorker_aggregate_order_by"] | undefined | null,
	RolesOfProfiles_aggregate?: ValueTypes["RolesOfProfile_aggregate_order_by"] | undefined | null,
	auth?: ValueTypes["order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	name?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: Profile */
["Profile_pk_columns_input"]: {
	id: number
};
	/** select columns of table "Profile" */
["Profile_select_column"]:Profile_select_column;
	/** input type for updating data in table "Profile" */
["Profile_set_input"]: {
	auth?: string | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	name?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["Profile_stddev_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_pop on columns */
["Profile_stddev_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_samp on columns */
["Profile_stddev_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate sum on columns */
["Profile_sum_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** update columns of table "Profile" */
["Profile_update_column"]:Profile_update_column;
	/** aggregate var_pop on columns */
["Profile_var_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate var_samp on columns */
["Profile_var_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate variance on columns */
["Profile_variance_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** columns and relationships of "Role" */
["Role"]: AliasType<{
RolesOfProfiles?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile"]],
RolesOfProfiles_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile_aggregate"]],
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "Role" */
["Role_aggregate"]: AliasType<{
	aggregate?:ValueTypes["Role_aggregate_fields"],
	nodes?:ValueTypes["Role"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "Role" */
["Role_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["Role_avg_fields"],
count?: [{	columns?: Array<ValueTypes["Role_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["Role_max_fields"],
	min?:ValueTypes["Role_min_fields"],
	stddev?:ValueTypes["Role_stddev_fields"],
	stddev_pop?:ValueTypes["Role_stddev_pop_fields"],
	stddev_samp?:ValueTypes["Role_stddev_samp_fields"],
	sum?:ValueTypes["Role_sum_fields"],
	var_pop?:ValueTypes["Role_var_pop_fields"],
	var_samp?:ValueTypes["Role_var_samp_fields"],
	variance?:ValueTypes["Role_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate avg on columns */
["Role_avg_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Boolean expression to filter rows from the table "Role". All fields are combined with a logical 'AND'. */
["Role_bool_exp"]: {
	RolesOfProfiles?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["Role_bool_exp"]> | undefined | null,
	_not?: ValueTypes["Role_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["Role_bool_exp"]> | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	title?: ValueTypes["String_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "Role" */
["Role_constraint"]:Role_constraint;
	/** input type for incrementing numeric columns in table "Role" */
["Role_inc_input"]: {
	id?: number | undefined | null
};
	/** input type for inserting data into table "Role" */
["Role_insert_input"]: {
	RolesOfProfiles?: ValueTypes["RolesOfProfile_arr_rel_insert_input"] | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	title?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["Role_max_fields"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate min on columns */
["Role_min_fields"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** response of any mutation on the table "Role" */
["Role_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["Role"],
		__typename?: boolean | `@${string}`
}>;
	/** input type for inserting object relation for remote table "Role" */
["Role_obj_rel_insert_input"]: {
	data: ValueTypes["Role_insert_input"],
	/** upsert condition */
	on_conflict?: ValueTypes["Role_on_conflict"] | undefined | null
};
	/** on_conflict condition type for table "Role" */
["Role_on_conflict"]: {
	constraint: ValueTypes["Role_constraint"],
	update_columns: Array<ValueTypes["Role_update_column"]>,
	where?: ValueTypes["Role_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "Role". */
["Role_order_by"]: {
	RolesOfProfiles_aggregate?: ValueTypes["RolesOfProfile_aggregate_order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	title?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: Role */
["Role_pk_columns_input"]: {
	id: number
};
	/** select columns of table "Role" */
["Role_select_column"]:Role_select_column;
	/** input type for updating data in table "Role" */
["Role_set_input"]: {
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	title?: string | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["Role_stddev_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_pop on columns */
["Role_stddev_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_samp on columns */
["Role_stddev_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate sum on columns */
["Role_sum_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** update columns of table "Role" */
["Role_update_column"]:Role_update_column;
	/** aggregate var_pop on columns */
["Role_var_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate var_samp on columns */
["Role_var_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate variance on columns */
["Role_variance_fields"]: AliasType<{
	id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** columns and relationships of "RolesOfProfile" */
["RolesOfProfile"]: AliasType<{
	/** An object relationship */
	Profile?:ValueTypes["Profile"],
	/** An object relationship */
	Role?:ValueTypes["Role"],
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "RolesOfProfile" */
["RolesOfProfile_aggregate"]: AliasType<{
	aggregate?:ValueTypes["RolesOfProfile_aggregate_fields"],
	nodes?:ValueTypes["RolesOfProfile"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "RolesOfProfile" */
["RolesOfProfile_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["RolesOfProfile_avg_fields"],
count?: [{	columns?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["RolesOfProfile_max_fields"],
	min?:ValueTypes["RolesOfProfile_min_fields"],
	stddev?:ValueTypes["RolesOfProfile_stddev_fields"],
	stddev_pop?:ValueTypes["RolesOfProfile_stddev_pop_fields"],
	stddev_samp?:ValueTypes["RolesOfProfile_stddev_samp_fields"],
	sum?:ValueTypes["RolesOfProfile_sum_fields"],
	var_pop?:ValueTypes["RolesOfProfile_var_pop_fields"],
	var_samp?:ValueTypes["RolesOfProfile_var_samp_fields"],
	variance?:ValueTypes["RolesOfProfile_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** order by aggregate values of table "RolesOfProfile" */
["RolesOfProfile_aggregate_order_by"]: {
	avg?: ValueTypes["RolesOfProfile_avg_order_by"] | undefined | null,
	count?: ValueTypes["order_by"] | undefined | null,
	max?: ValueTypes["RolesOfProfile_max_order_by"] | undefined | null,
	min?: ValueTypes["RolesOfProfile_min_order_by"] | undefined | null,
	stddev?: ValueTypes["RolesOfProfile_stddev_order_by"] | undefined | null,
	stddev_pop?: ValueTypes["RolesOfProfile_stddev_pop_order_by"] | undefined | null,
	stddev_samp?: ValueTypes["RolesOfProfile_stddev_samp_order_by"] | undefined | null,
	sum?: ValueTypes["RolesOfProfile_sum_order_by"] | undefined | null,
	var_pop?: ValueTypes["RolesOfProfile_var_pop_order_by"] | undefined | null,
	var_samp?: ValueTypes["RolesOfProfile_var_samp_order_by"] | undefined | null,
	variance?: ValueTypes["RolesOfProfile_variance_order_by"] | undefined | null
};
	/** input type for inserting array relation for remote table "RolesOfProfile" */
["RolesOfProfile_arr_rel_insert_input"]: {
	data: Array<ValueTypes["RolesOfProfile_insert_input"]>,
	/** upsert condition */
	on_conflict?: ValueTypes["RolesOfProfile_on_conflict"] | undefined | null
};
	/** aggregate avg on columns */
["RolesOfProfile_avg_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by avg() on columns of table "RolesOfProfile" */
["RolesOfProfile_avg_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to filter rows from the table "RolesOfProfile". All fields are combined with a logical 'AND'. */
["RolesOfProfile_bool_exp"]: {
	Profile?: ValueTypes["Profile_bool_exp"] | undefined | null,
	Role?: ValueTypes["Role_bool_exp"] | undefined | null,
	_and?: Array<ValueTypes["RolesOfProfile_bool_exp"]> | undefined | null,
	_not?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["RolesOfProfile_bool_exp"]> | undefined | null,
	createdAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null,
	id?: ValueTypes["Int_comparison_exp"] | undefined | null,
	profileId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	roleId?: ValueTypes["Int_comparison_exp"] | undefined | null,
	updatedAt?: ValueTypes["timestamp_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "RolesOfProfile" */
["RolesOfProfile_constraint"]:RolesOfProfile_constraint;
	/** input type for incrementing numeric columns in table "RolesOfProfile" */
["RolesOfProfile_inc_input"]: {
	id?: number | undefined | null,
	profileId?: number | undefined | null,
	roleId?: number | undefined | null
};
	/** input type for inserting data into table "RolesOfProfile" */
["RolesOfProfile_insert_input"]: {
	Profile?: ValueTypes["Profile_obj_rel_insert_input"] | undefined | null,
	Role?: ValueTypes["Role_obj_rel_insert_input"] | undefined | null,
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	profileId?: number | undefined | null,
	roleId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate max on columns */
["RolesOfProfile_max_fields"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by max() on columns of table "RolesOfProfile" */
["RolesOfProfile_max_order_by"]: {
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate min on columns */
["RolesOfProfile_min_fields"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by min() on columns of table "RolesOfProfile" */
["RolesOfProfile_min_order_by"]: {
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** response of any mutation on the table "RolesOfProfile" */
["RolesOfProfile_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["RolesOfProfile"],
		__typename?: boolean | `@${string}`
}>;
	/** on_conflict condition type for table "RolesOfProfile" */
["RolesOfProfile_on_conflict"]: {
	constraint: ValueTypes["RolesOfProfile_constraint"],
	update_columns: Array<ValueTypes["RolesOfProfile_update_column"]>,
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "RolesOfProfile". */
["RolesOfProfile_order_by"]: {
	Profile?: ValueTypes["Profile_order_by"] | undefined | null,
	Role?: ValueTypes["Role_order_by"] | undefined | null,
	createdAt?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null,
	updatedAt?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: RolesOfProfile */
["RolesOfProfile_pk_columns_input"]: {
	id: number
};
	/** select columns of table "RolesOfProfile" */
["RolesOfProfile_select_column"]:RolesOfProfile_select_column;
	/** input type for updating data in table "RolesOfProfile" */
["RolesOfProfile_set_input"]: {
	createdAt?: ValueTypes["timestamp"] | undefined | null,
	id?: number | undefined | null,
	profileId?: number | undefined | null,
	roleId?: number | undefined | null,
	updatedAt?: ValueTypes["timestamp"] | undefined | null
};
	/** aggregate stddev on columns */
["RolesOfProfile_stddev_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_pop on columns */
["RolesOfProfile_stddev_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_pop() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_pop_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate stddev_samp on columns */
["RolesOfProfile_stddev_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by stddev_samp() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_samp_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate sum on columns */
["RolesOfProfile_sum_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by sum() on columns of table "RolesOfProfile" */
["RolesOfProfile_sum_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** update columns of table "RolesOfProfile" */
["RolesOfProfile_update_column"]:RolesOfProfile_update_column;
	/** aggregate var_pop on columns */
["RolesOfProfile_var_pop_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_pop() on columns of table "RolesOfProfile" */
["RolesOfProfile_var_pop_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate var_samp on columns */
["RolesOfProfile_var_samp_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by var_samp() on columns of table "RolesOfProfile" */
["RolesOfProfile_var_samp_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** aggregate variance on columns */
["RolesOfProfile_variance_fields"]: AliasType<{
	id?:boolean | `@${string}`,
	profileId?:boolean | `@${string}`,
	roleId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** order by variance() on columns of table "RolesOfProfile" */
["RolesOfProfile_variance_order_by"]: {
	id?: ValueTypes["order_by"] | undefined | null,
	profileId?: ValueTypes["order_by"] | undefined | null,
	roleId?: ValueTypes["order_by"] | undefined | null
};
	/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
["String_comparison_exp"]: {
	_eq?: string | undefined | null,
	_gt?: string | undefined | null,
	_gte?: string | undefined | null,
	/** does the column match the given case-insensitive pattern */
	_ilike?: string | undefined | null,
	_in?: Array<string> | undefined | null,
	/** does the column match the given POSIX regular expression, case insensitive */
	_iregex?: string | undefined | null,
	_is_null?: boolean | undefined | null,
	/** does the column match the given pattern */
	_like?: string | undefined | null,
	_lt?: string | undefined | null,
	_lte?: string | undefined | null,
	_neq?: string | undefined | null,
	/** does the column NOT match the given case-insensitive pattern */
	_nilike?: string | undefined | null,
	_nin?: Array<string> | undefined | null,
	/** does the column NOT match the given POSIX regular expression, case insensitive */
	_niregex?: string | undefined | null,
	/** does the column NOT match the given pattern */
	_nlike?: string | undefined | null,
	/** does the column NOT match the given POSIX regular expression, case sensitive */
	_nregex?: string | undefined | null,
	/** does the column NOT match the given SQL regular expression */
	_nsimilar?: string | undefined | null,
	/** does the column match the given POSIX regular expression, case sensitive */
	_regex?: string | undefined | null,
	/** does the column match the given SQL regular expression */
	_similar?: string | undefined | null
};
	/** columns and relationships of "_prisma_migrations" */
["_prisma_migrations"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
	checksum?:boolean | `@${string}`,
	finished_at?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	logs?:boolean | `@${string}`,
	migration_name?:boolean | `@${string}`,
	rolled_back_at?:boolean | `@${string}`,
	started_at?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregated selection of "_prisma_migrations" */
["_prisma_migrations_aggregate"]: AliasType<{
	aggregate?:ValueTypes["_prisma_migrations_aggregate_fields"],
	nodes?:ValueTypes["_prisma_migrations"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate fields of "_prisma_migrations" */
["_prisma_migrations_aggregate_fields"]: AliasType<{
	avg?:ValueTypes["_prisma_migrations_avg_fields"],
count?: [{	columns?: Array<ValueTypes["_prisma_migrations_select_column"]> | undefined | null,	distinct?: boolean | undefined | null},boolean | `@${string}`],
	max?:ValueTypes["_prisma_migrations_max_fields"],
	min?:ValueTypes["_prisma_migrations_min_fields"],
	stddev?:ValueTypes["_prisma_migrations_stddev_fields"],
	stddev_pop?:ValueTypes["_prisma_migrations_stddev_pop_fields"],
	stddev_samp?:ValueTypes["_prisma_migrations_stddev_samp_fields"],
	sum?:ValueTypes["_prisma_migrations_sum_fields"],
	var_pop?:ValueTypes["_prisma_migrations_var_pop_fields"],
	var_samp?:ValueTypes["_prisma_migrations_var_samp_fields"],
	variance?:ValueTypes["_prisma_migrations_variance_fields"],
		__typename?: boolean | `@${string}`
}>;
	/** aggregate avg on columns */
["_prisma_migrations_avg_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Boolean expression to filter rows from the table "_prisma_migrations". All fields are combined with a logical 'AND'. */
["_prisma_migrations_bool_exp"]: {
	_and?: Array<ValueTypes["_prisma_migrations_bool_exp"]> | undefined | null,
	_not?: ValueTypes["_prisma_migrations_bool_exp"] | undefined | null,
	_or?: Array<ValueTypes["_prisma_migrations_bool_exp"]> | undefined | null,
	applied_steps_count?: ValueTypes["Int_comparison_exp"] | undefined | null,
	checksum?: ValueTypes["String_comparison_exp"] | undefined | null,
	finished_at?: ValueTypes["timestamptz_comparison_exp"] | undefined | null,
	id?: ValueTypes["String_comparison_exp"] | undefined | null,
	logs?: ValueTypes["String_comparison_exp"] | undefined | null,
	migration_name?: ValueTypes["String_comparison_exp"] | undefined | null,
	rolled_back_at?: ValueTypes["timestamptz_comparison_exp"] | undefined | null,
	started_at?: ValueTypes["timestamptz_comparison_exp"] | undefined | null
};
	/** unique or primary key constraints on table "_prisma_migrations" */
["_prisma_migrations_constraint"]:_prisma_migrations_constraint;
	/** input type for incrementing numeric columns in table "_prisma_migrations" */
["_prisma_migrations_inc_input"]: {
	applied_steps_count?: number | undefined | null
};
	/** input type for inserting data into table "_prisma_migrations" */
["_prisma_migrations_insert_input"]: {
	applied_steps_count?: number | undefined | null,
	checksum?: string | undefined | null,
	finished_at?: ValueTypes["timestamptz"] | undefined | null,
	id?: string | undefined | null,
	logs?: string | undefined | null,
	migration_name?: string | undefined | null,
	rolled_back_at?: ValueTypes["timestamptz"] | undefined | null,
	started_at?: ValueTypes["timestamptz"] | undefined | null
};
	/** aggregate max on columns */
["_prisma_migrations_max_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
	checksum?:boolean | `@${string}`,
	finished_at?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	logs?:boolean | `@${string}`,
	migration_name?:boolean | `@${string}`,
	rolled_back_at?:boolean | `@${string}`,
	started_at?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate min on columns */
["_prisma_migrations_min_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
	checksum?:boolean | `@${string}`,
	finished_at?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	logs?:boolean | `@${string}`,
	migration_name?:boolean | `@${string}`,
	rolled_back_at?:boolean | `@${string}`,
	started_at?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** response of any mutation on the table "_prisma_migrations" */
["_prisma_migrations_mutation_response"]: AliasType<{
	/** number of rows affected by the mutation */
	affected_rows?:boolean | `@${string}`,
	/** data from the rows affected by the mutation */
	returning?:ValueTypes["_prisma_migrations"],
		__typename?: boolean | `@${string}`
}>;
	/** on_conflict condition type for table "_prisma_migrations" */
["_prisma_migrations_on_conflict"]: {
	constraint: ValueTypes["_prisma_migrations_constraint"],
	update_columns: Array<ValueTypes["_prisma_migrations_update_column"]>,
	where?: ValueTypes["_prisma_migrations_bool_exp"] | undefined | null
};
	/** Ordering options when selecting data from "_prisma_migrations". */
["_prisma_migrations_order_by"]: {
	applied_steps_count?: ValueTypes["order_by"] | undefined | null,
	checksum?: ValueTypes["order_by"] | undefined | null,
	finished_at?: ValueTypes["order_by"] | undefined | null,
	id?: ValueTypes["order_by"] | undefined | null,
	logs?: ValueTypes["order_by"] | undefined | null,
	migration_name?: ValueTypes["order_by"] | undefined | null,
	rolled_back_at?: ValueTypes["order_by"] | undefined | null,
	started_at?: ValueTypes["order_by"] | undefined | null
};
	/** primary key columns input for table: _prisma_migrations */
["_prisma_migrations_pk_columns_input"]: {
	id: string
};
	/** select columns of table "_prisma_migrations" */
["_prisma_migrations_select_column"]:_prisma_migrations_select_column;
	/** input type for updating data in table "_prisma_migrations" */
["_prisma_migrations_set_input"]: {
	applied_steps_count?: number | undefined | null,
	checksum?: string | undefined | null,
	finished_at?: ValueTypes["timestamptz"] | undefined | null,
	id?: string | undefined | null,
	logs?: string | undefined | null,
	migration_name?: string | undefined | null,
	rolled_back_at?: ValueTypes["timestamptz"] | undefined | null,
	started_at?: ValueTypes["timestamptz"] | undefined | null
};
	/** aggregate stddev on columns */
["_prisma_migrations_stddev_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_pop on columns */
["_prisma_migrations_stddev_pop_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate stddev_samp on columns */
["_prisma_migrations_stddev_samp_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate sum on columns */
["_prisma_migrations_sum_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** update columns of table "_prisma_migrations" */
["_prisma_migrations_update_column"]:_prisma_migrations_update_column;
	/** aggregate var_pop on columns */
["_prisma_migrations_var_pop_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate var_samp on columns */
["_prisma_migrations_var_samp_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** aggregate variance on columns */
["_prisma_migrations_variance_fields"]: AliasType<{
	applied_steps_count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["_text"]:unknown;
	/** Boolean expression to compare columns of type "_text". All fields are combined with logical 'AND'. */
["_text_comparison_exp"]: {
	_eq?: ValueTypes["_text"] | undefined | null,
	_gt?: ValueTypes["_text"] | undefined | null,
	_gte?: ValueTypes["_text"] | undefined | null,
	_in?: Array<ValueTypes["_text"]> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: ValueTypes["_text"] | undefined | null,
	_lte?: ValueTypes["_text"] | undefined | null,
	_neq?: ValueTypes["_text"] | undefined | null,
	_nin?: Array<ValueTypes["_text"]> | undefined | null
};
	/** mutation root */
["mutation_root"]: AliasType<{
delete_Business?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["Business_bool_exp"]},ValueTypes["Business_mutation_response"]],
delete_BusinessCategory?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["BusinessCategory_bool_exp"]},ValueTypes["BusinessCategory_mutation_response"]],
delete_BusinessCategory_by_pk?: [{	id: number},ValueTypes["BusinessCategory"]],
delete_BusinessWorker?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["BusinessWorker_bool_exp"]},ValueTypes["BusinessWorker_mutation_response"]],
delete_BusinessWorker_by_pk?: [{	id: number},ValueTypes["BusinessWorker"]],
delete_Business_by_pk?: [{	id: number},ValueTypes["Business"]],
delete_Category?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["Category_bool_exp"]},ValueTypes["Category_mutation_response"]],
delete_CategoryField?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["CategoryField_bool_exp"]},ValueTypes["CategoryField_mutation_response"]],
delete_CategoryFieldValue?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["CategoryFieldValue_bool_exp"]},ValueTypes["CategoryFieldValue_mutation_response"]],
delete_CategoryFieldValue_by_pk?: [{	id: number},ValueTypes["CategoryFieldValue"]],
delete_CategoryField_by_pk?: [{	id: number},ValueTypes["CategoryField"]],
delete_Category_by_pk?: [{	id: number},ValueTypes["Category"]],
delete_City?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["City_bool_exp"]},ValueTypes["City_mutation_response"]],
delete_City_by_pk?: [{	id: number},ValueTypes["City"]],
delete_Product?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["Product_bool_exp"]},ValueTypes["Product_mutation_response"]],
delete_ProductCategory?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["ProductCategory_bool_exp"]},ValueTypes["ProductCategory_mutation_response"]],
delete_ProductCategory_by_pk?: [{	id: number},ValueTypes["ProductCategory"]],
delete_Product_by_pk?: [{	id: number},ValueTypes["Product"]],
delete_Profile?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["Profile_bool_exp"]},ValueTypes["Profile_mutation_response"]],
delete_Profile_by_pk?: [{	id: number},ValueTypes["Profile"]],
delete_Role?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["Role_bool_exp"]},ValueTypes["Role_mutation_response"]],
delete_Role_by_pk?: [{	id: number},ValueTypes["Role"]],
delete_RolesOfProfile?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["RolesOfProfile_bool_exp"]},ValueTypes["RolesOfProfile_mutation_response"]],
delete_RolesOfProfile_by_pk?: [{	id: number},ValueTypes["RolesOfProfile"]],
delete__prisma_migrations?: [{	/** filter the rows which have to be deleted */
	where: ValueTypes["_prisma_migrations_bool_exp"]},ValueTypes["_prisma_migrations_mutation_response"]],
delete__prisma_migrations_by_pk?: [{	id: string},ValueTypes["_prisma_migrations"]],
insert_Business?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["Business_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["Business_on_conflict"] | undefined | null},ValueTypes["Business_mutation_response"]],
insert_BusinessCategory?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["BusinessCategory_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["BusinessCategory_on_conflict"] | undefined | null},ValueTypes["BusinessCategory_mutation_response"]],
insert_BusinessCategory_one?: [{	/** the row to be inserted */
	object: ValueTypes["BusinessCategory_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["BusinessCategory_on_conflict"] | undefined | null},ValueTypes["BusinessCategory"]],
insert_BusinessWorker?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["BusinessWorker_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["BusinessWorker_on_conflict"] | undefined | null},ValueTypes["BusinessWorker_mutation_response"]],
insert_BusinessWorker_one?: [{	/** the row to be inserted */
	object: ValueTypes["BusinessWorker_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["BusinessWorker_on_conflict"] | undefined | null},ValueTypes["BusinessWorker"]],
insert_Business_one?: [{	/** the row to be inserted */
	object: ValueTypes["Business_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["Business_on_conflict"] | undefined | null},ValueTypes["Business"]],
insert_Category?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["Category_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["Category_on_conflict"] | undefined | null},ValueTypes["Category_mutation_response"]],
insert_CategoryField?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["CategoryField_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["CategoryField_on_conflict"] | undefined | null},ValueTypes["CategoryField_mutation_response"]],
insert_CategoryFieldValue?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["CategoryFieldValue_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["CategoryFieldValue_on_conflict"] | undefined | null},ValueTypes["CategoryFieldValue_mutation_response"]],
insert_CategoryFieldValue_one?: [{	/** the row to be inserted */
	object: ValueTypes["CategoryFieldValue_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["CategoryFieldValue_on_conflict"] | undefined | null},ValueTypes["CategoryFieldValue"]],
insert_CategoryField_one?: [{	/** the row to be inserted */
	object: ValueTypes["CategoryField_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["CategoryField_on_conflict"] | undefined | null},ValueTypes["CategoryField"]],
insert_Category_one?: [{	/** the row to be inserted */
	object: ValueTypes["Category_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["Category_on_conflict"] | undefined | null},ValueTypes["Category"]],
insert_City?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["City_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["City_on_conflict"] | undefined | null},ValueTypes["City_mutation_response"]],
insert_City_one?: [{	/** the row to be inserted */
	object: ValueTypes["City_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["City_on_conflict"] | undefined | null},ValueTypes["City"]],
insert_Product?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["Product_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["Product_on_conflict"] | undefined | null},ValueTypes["Product_mutation_response"]],
insert_ProductCategory?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["ProductCategory_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["ProductCategory_on_conflict"] | undefined | null},ValueTypes["ProductCategory_mutation_response"]],
insert_ProductCategory_one?: [{	/** the row to be inserted */
	object: ValueTypes["ProductCategory_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["ProductCategory_on_conflict"] | undefined | null},ValueTypes["ProductCategory"]],
insert_Product_one?: [{	/** the row to be inserted */
	object: ValueTypes["Product_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["Product_on_conflict"] | undefined | null},ValueTypes["Product"]],
insert_Profile?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["Profile_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["Profile_on_conflict"] | undefined | null},ValueTypes["Profile_mutation_response"]],
insert_Profile_one?: [{	/** the row to be inserted */
	object: ValueTypes["Profile_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["Profile_on_conflict"] | undefined | null},ValueTypes["Profile"]],
insert_Role?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["Role_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["Role_on_conflict"] | undefined | null},ValueTypes["Role_mutation_response"]],
insert_Role_one?: [{	/** the row to be inserted */
	object: ValueTypes["Role_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["Role_on_conflict"] | undefined | null},ValueTypes["Role"]],
insert_RolesOfProfile?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["RolesOfProfile_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["RolesOfProfile_on_conflict"] | undefined | null},ValueTypes["RolesOfProfile_mutation_response"]],
insert_RolesOfProfile_one?: [{	/** the row to be inserted */
	object: ValueTypes["RolesOfProfile_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["RolesOfProfile_on_conflict"] | undefined | null},ValueTypes["RolesOfProfile"]],
insert__prisma_migrations?: [{	/** the rows to be inserted */
	objects: Array<ValueTypes["_prisma_migrations_insert_input"]>,	/** upsert condition */
	on_conflict?: ValueTypes["_prisma_migrations_on_conflict"] | undefined | null},ValueTypes["_prisma_migrations_mutation_response"]],
insert__prisma_migrations_one?: [{	/** the row to be inserted */
	object: ValueTypes["_prisma_migrations_insert_input"],	/** upsert condition */
	on_conflict?: ValueTypes["_prisma_migrations_on_conflict"] | undefined | null},ValueTypes["_prisma_migrations"]],
update_Business?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Business_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Business_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["Business_bool_exp"]},ValueTypes["Business_mutation_response"]],
update_BusinessCategory?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["BusinessCategory_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["BusinessCategory_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["BusinessCategory_bool_exp"]},ValueTypes["BusinessCategory_mutation_response"]],
update_BusinessCategory_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["BusinessCategory_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["BusinessCategory_set_input"] | undefined | null,	pk_columns: ValueTypes["BusinessCategory_pk_columns_input"]},ValueTypes["BusinessCategory"]],
update_BusinessWorker?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["BusinessWorker_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["BusinessWorker_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["BusinessWorker_bool_exp"]},ValueTypes["BusinessWorker_mutation_response"]],
update_BusinessWorker_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["BusinessWorker_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["BusinessWorker_set_input"] | undefined | null,	pk_columns: ValueTypes["BusinessWorker_pk_columns_input"]},ValueTypes["BusinessWorker"]],
update_Business_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Business_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Business_set_input"] | undefined | null,	pk_columns: ValueTypes["Business_pk_columns_input"]},ValueTypes["Business"]],
update_Category?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Category_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Category_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["Category_bool_exp"]},ValueTypes["Category_mutation_response"]],
update_CategoryField?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["CategoryField_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["CategoryField_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["CategoryField_bool_exp"]},ValueTypes["CategoryField_mutation_response"]],
update_CategoryFieldValue?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["CategoryFieldValue_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["CategoryFieldValue_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["CategoryFieldValue_bool_exp"]},ValueTypes["CategoryFieldValue_mutation_response"]],
update_CategoryFieldValue_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["CategoryFieldValue_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["CategoryFieldValue_set_input"] | undefined | null,	pk_columns: ValueTypes["CategoryFieldValue_pk_columns_input"]},ValueTypes["CategoryFieldValue"]],
update_CategoryField_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["CategoryField_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["CategoryField_set_input"] | undefined | null,	pk_columns: ValueTypes["CategoryField_pk_columns_input"]},ValueTypes["CategoryField"]],
update_Category_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Category_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Category_set_input"] | undefined | null,	pk_columns: ValueTypes["Category_pk_columns_input"]},ValueTypes["Category"]],
update_City?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["City_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["City_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["City_bool_exp"]},ValueTypes["City_mutation_response"]],
update_City_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["City_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["City_set_input"] | undefined | null,	pk_columns: ValueTypes["City_pk_columns_input"]},ValueTypes["City"]],
update_Product?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Product_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Product_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["Product_bool_exp"]},ValueTypes["Product_mutation_response"]],
update_ProductCategory?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["ProductCategory_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["ProductCategory_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["ProductCategory_bool_exp"]},ValueTypes["ProductCategory_mutation_response"]],
update_ProductCategory_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["ProductCategory_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["ProductCategory_set_input"] | undefined | null,	pk_columns: ValueTypes["ProductCategory_pk_columns_input"]},ValueTypes["ProductCategory"]],
update_Product_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Product_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Product_set_input"] | undefined | null,	pk_columns: ValueTypes["Product_pk_columns_input"]},ValueTypes["Product"]],
update_Profile?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Profile_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Profile_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["Profile_bool_exp"]},ValueTypes["Profile_mutation_response"]],
update_Profile_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Profile_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Profile_set_input"] | undefined | null,	pk_columns: ValueTypes["Profile_pk_columns_input"]},ValueTypes["Profile"]],
update_Role?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Role_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Role_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["Role_bool_exp"]},ValueTypes["Role_mutation_response"]],
update_Role_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["Role_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["Role_set_input"] | undefined | null,	pk_columns: ValueTypes["Role_pk_columns_input"]},ValueTypes["Role"]],
update_RolesOfProfile?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["RolesOfProfile_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["RolesOfProfile_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["RolesOfProfile_bool_exp"]},ValueTypes["RolesOfProfile_mutation_response"]],
update_RolesOfProfile_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["RolesOfProfile_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["RolesOfProfile_set_input"] | undefined | null,	pk_columns: ValueTypes["RolesOfProfile_pk_columns_input"]},ValueTypes["RolesOfProfile"]],
update__prisma_migrations?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["_prisma_migrations_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["_prisma_migrations_set_input"] | undefined | null,	/** filter the rows which have to be updated */
	where: ValueTypes["_prisma_migrations_bool_exp"]},ValueTypes["_prisma_migrations_mutation_response"]],
update__prisma_migrations_by_pk?: [{	/** increments the numeric columns with given value of the filtered values */
	_inc?: ValueTypes["_prisma_migrations_inc_input"] | undefined | null,	/** sets the columns of the filtered rows to the given values */
	_set?: ValueTypes["_prisma_migrations_set_input"] | undefined | null,	pk_columns: ValueTypes["_prisma_migrations_pk_columns_input"]},ValueTypes["_prisma_migrations"]],
		__typename?: boolean | `@${string}`
}>;
	["numeric"]:unknown;
	/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
["numeric_comparison_exp"]: {
	_eq?: ValueTypes["numeric"] | undefined | null,
	_gt?: ValueTypes["numeric"] | undefined | null,
	_gte?: ValueTypes["numeric"] | undefined | null,
	_in?: Array<ValueTypes["numeric"]> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: ValueTypes["numeric"] | undefined | null,
	_lte?: ValueTypes["numeric"] | undefined | null,
	_neq?: ValueTypes["numeric"] | undefined | null,
	_nin?: Array<ValueTypes["numeric"]> | undefined | null
};
	/** column ordering options */
["order_by"]:order_by;
	["query_root"]: AliasType<{
Business?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Business_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Business_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Business_bool_exp"] | undefined | null},ValueTypes["Business"]],
BusinessCategory?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory"]],
BusinessCategory_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory_aggregate"]],
BusinessCategory_by_pk?: [{	id: number},ValueTypes["BusinessCategory"]],
BusinessWorker?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker"]],
BusinessWorker_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker_aggregate"]],
BusinessWorker_by_pk?: [{	id: number},ValueTypes["BusinessWorker"]],
Business_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Business_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Business_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Business_bool_exp"] | undefined | null},ValueTypes["Business_aggregate"]],
Business_by_pk?: [{	id: number},ValueTypes["Business"]],
Category?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Category_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Category_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Category_bool_exp"] | undefined | null},ValueTypes["Category"]],
CategoryField?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryField_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryField_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryField_bool_exp"] | undefined | null},ValueTypes["CategoryField"]],
CategoryFieldValue?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue"]],
CategoryFieldValue_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue_aggregate"]],
CategoryFieldValue_by_pk?: [{	id: number},ValueTypes["CategoryFieldValue"]],
CategoryField_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryField_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryField_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryField_bool_exp"] | undefined | null},ValueTypes["CategoryField_aggregate"]],
CategoryField_by_pk?: [{	id: number},ValueTypes["CategoryField"]],
Category_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Category_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Category_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Category_bool_exp"] | undefined | null},ValueTypes["Category_aggregate"]],
Category_by_pk?: [{	id: number},ValueTypes["Category"]],
City?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["City_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["City_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["City_bool_exp"] | undefined | null},ValueTypes["City"]],
City_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["City_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["City_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["City_bool_exp"] | undefined | null},ValueTypes["City_aggregate"]],
City_by_pk?: [{	id: number},ValueTypes["City"]],
Product?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Product_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Product_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Product_bool_exp"] | undefined | null},ValueTypes["Product"]],
ProductCategory?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory"]],
ProductCategory_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory_aggregate"]],
ProductCategory_by_pk?: [{	id: number},ValueTypes["ProductCategory"]],
Product_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Product_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Product_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Product_bool_exp"] | undefined | null},ValueTypes["Product_aggregate"]],
Product_by_pk?: [{	id: number},ValueTypes["Product"]],
Profile?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Profile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Profile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Profile_bool_exp"] | undefined | null},ValueTypes["Profile"]],
Profile_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Profile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Profile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Profile_bool_exp"] | undefined | null},ValueTypes["Profile_aggregate"]],
Profile_by_pk?: [{	id: number},ValueTypes["Profile"]],
Role?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Role_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Role_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Role_bool_exp"] | undefined | null},ValueTypes["Role"]],
Role_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Role_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Role_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Role_bool_exp"] | undefined | null},ValueTypes["Role_aggregate"]],
Role_by_pk?: [{	id: number},ValueTypes["Role"]],
RolesOfProfile?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile"]],
RolesOfProfile_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile_aggregate"]],
RolesOfProfile_by_pk?: [{	id: number},ValueTypes["RolesOfProfile"]],
_prisma_migrations?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["_prisma_migrations_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["_prisma_migrations_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["_prisma_migrations_bool_exp"] | undefined | null},ValueTypes["_prisma_migrations"]],
_prisma_migrations_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["_prisma_migrations_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["_prisma_migrations_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["_prisma_migrations_bool_exp"] | undefined | null},ValueTypes["_prisma_migrations_aggregate"]],
_prisma_migrations_by_pk?: [{	id: string},ValueTypes["_prisma_migrations"]],
		__typename?: boolean | `@${string}`
}>;
	["subscription_root"]: AliasType<{
Business?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Business_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Business_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Business_bool_exp"] | undefined | null},ValueTypes["Business"]],
BusinessCategory?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory"]],
BusinessCategory_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessCategory_bool_exp"] | undefined | null},ValueTypes["BusinessCategory_aggregate"]],
BusinessCategory_by_pk?: [{	id: number},ValueTypes["BusinessCategory"]],
BusinessWorker?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker"]],
BusinessWorker_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["BusinessWorker_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["BusinessWorker_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["BusinessWorker_bool_exp"] | undefined | null},ValueTypes["BusinessWorker_aggregate"]],
BusinessWorker_by_pk?: [{	id: number},ValueTypes["BusinessWorker"]],
Business_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Business_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Business_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Business_bool_exp"] | undefined | null},ValueTypes["Business_aggregate"]],
Business_by_pk?: [{	id: number},ValueTypes["Business"]],
Category?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Category_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Category_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Category_bool_exp"] | undefined | null},ValueTypes["Category"]],
CategoryField?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryField_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryField_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryField_bool_exp"] | undefined | null},ValueTypes["CategoryField"]],
CategoryFieldValue?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue"]],
CategoryFieldValue_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryFieldValue_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryFieldValue_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryFieldValue_bool_exp"] | undefined | null},ValueTypes["CategoryFieldValue_aggregate"]],
CategoryFieldValue_by_pk?: [{	id: number},ValueTypes["CategoryFieldValue"]],
CategoryField_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["CategoryField_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["CategoryField_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["CategoryField_bool_exp"] | undefined | null},ValueTypes["CategoryField_aggregate"]],
CategoryField_by_pk?: [{	id: number},ValueTypes["CategoryField"]],
Category_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Category_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Category_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Category_bool_exp"] | undefined | null},ValueTypes["Category_aggregate"]],
Category_by_pk?: [{	id: number},ValueTypes["Category"]],
City?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["City_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["City_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["City_bool_exp"] | undefined | null},ValueTypes["City"]],
City_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["City_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["City_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["City_bool_exp"] | undefined | null},ValueTypes["City_aggregate"]],
City_by_pk?: [{	id: number},ValueTypes["City"]],
Product?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Product_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Product_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Product_bool_exp"] | undefined | null},ValueTypes["Product"]],
ProductCategory?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory"]],
ProductCategory_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["ProductCategory_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["ProductCategory_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["ProductCategory_bool_exp"] | undefined | null},ValueTypes["ProductCategory_aggregate"]],
ProductCategory_by_pk?: [{	id: number},ValueTypes["ProductCategory"]],
Product_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Product_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Product_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Product_bool_exp"] | undefined | null},ValueTypes["Product_aggregate"]],
Product_by_pk?: [{	id: number},ValueTypes["Product"]],
Profile?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Profile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Profile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Profile_bool_exp"] | undefined | null},ValueTypes["Profile"]],
Profile_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Profile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Profile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Profile_bool_exp"] | undefined | null},ValueTypes["Profile_aggregate"]],
Profile_by_pk?: [{	id: number},ValueTypes["Profile"]],
Role?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Role_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Role_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Role_bool_exp"] | undefined | null},ValueTypes["Role"]],
Role_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["Role_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["Role_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["Role_bool_exp"] | undefined | null},ValueTypes["Role_aggregate"]],
Role_by_pk?: [{	id: number},ValueTypes["Role"]],
RolesOfProfile?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile"]],
RolesOfProfile_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["RolesOfProfile_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["RolesOfProfile_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["RolesOfProfile_bool_exp"] | undefined | null},ValueTypes["RolesOfProfile_aggregate"]],
RolesOfProfile_by_pk?: [{	id: number},ValueTypes["RolesOfProfile"]],
_prisma_migrations?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["_prisma_migrations_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["_prisma_migrations_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["_prisma_migrations_bool_exp"] | undefined | null},ValueTypes["_prisma_migrations"]],
_prisma_migrations_aggregate?: [{	/** distinct select on columns */
	distinct_on?: Array<ValueTypes["_prisma_migrations_select_column"]> | undefined | null,	/** limit the number of rows returned */
	limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
	offset?: number | undefined | null,	/** sort the rows by one or more columns */
	order_by?: Array<ValueTypes["_prisma_migrations_order_by"]> | undefined | null,	/** filter the rows returned */
	where?: ValueTypes["_prisma_migrations_bool_exp"] | undefined | null},ValueTypes["_prisma_migrations_aggregate"]],
_prisma_migrations_by_pk?: [{	id: string},ValueTypes["_prisma_migrations"]],
		__typename?: boolean | `@${string}`
}>;
	["timestamp"]:unknown;
	/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
["timestamp_comparison_exp"]: {
	_eq?: ValueTypes["timestamp"] | undefined | null,
	_gt?: ValueTypes["timestamp"] | undefined | null,
	_gte?: ValueTypes["timestamp"] | undefined | null,
	_in?: Array<ValueTypes["timestamp"]> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: ValueTypes["timestamp"] | undefined | null,
	_lte?: ValueTypes["timestamp"] | undefined | null,
	_neq?: ValueTypes["timestamp"] | undefined | null,
	_nin?: Array<ValueTypes["timestamp"]> | undefined | null
};
	["timestamptz"]:unknown;
	/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
["timestamptz_comparison_exp"]: {
	_eq?: ValueTypes["timestamptz"] | undefined | null,
	_gt?: ValueTypes["timestamptz"] | undefined | null,
	_gte?: ValueTypes["timestamptz"] | undefined | null,
	_in?: Array<ValueTypes["timestamptz"]> | undefined | null,
	_is_null?: boolean | undefined | null,
	_lt?: ValueTypes["timestamptz"] | undefined | null,
	_lte?: ValueTypes["timestamptz"] | undefined | null,
	_neq?: ValueTypes["timestamptz"] | undefined | null,
	_nin?: Array<ValueTypes["timestamptz"]> | undefined | null
}
  }

export type ModelTypes = {
    /** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
["Boolean_comparison_exp"]: GraphQLTypes["Boolean_comparison_exp"];
	/** columns and relationships of "Business" */
["Business"]: {
		/** An array relationship */
	BusinessCategories: Array<GraphQLTypes["BusinessCategory"]>,
	/** An aggregate relationship */
	BusinessCategories_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** An array relationship */
	BusinessWorkers: Array<GraphQLTypes["BusinessWorker"]>,
	/** An aggregate relationship */
	BusinessWorkers_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** An array relationship */
	CategoryFieldValues: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** An aggregate relationship */
	CategoryFieldValues_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	/** An object relationship */
	City: GraphQLTypes["City"],
	/** An array relationship */
	Products: Array<GraphQLTypes["Product"]>,
	/** An aggregate relationship */
	Products_aggregate: GraphQLTypes["Product_aggregate"],
	cityId: number,
	createdAt: GraphQLTypes["timestamp"],
	email?: string | undefined,
	id: number,
	name: string,
	phone: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "BusinessCategory" */
["BusinessCategory"]: {
		/** An object relationship */
	Business?: GraphQLTypes["Business"] | undefined,
	/** An object relationship */
	Category?: GraphQLTypes["Category"] | undefined,
	businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number
};
	/** aggregated selection of "BusinessCategory" */
["BusinessCategory_aggregate"]: {
		aggregate?: GraphQLTypes["BusinessCategory_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["BusinessCategory"]>
};
	/** aggregate fields of "BusinessCategory" */
["BusinessCategory_aggregate_fields"]: {
		avg?: GraphQLTypes["BusinessCategory_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["BusinessCategory_max_fields"] | undefined,
	min?: GraphQLTypes["BusinessCategory_min_fields"] | undefined,
	stddev?: GraphQLTypes["BusinessCategory_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["BusinessCategory_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["BusinessCategory_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["BusinessCategory_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["BusinessCategory_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["BusinessCategory_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["BusinessCategory_variance_fields"] | undefined
};
	/** order by aggregate values of table "BusinessCategory" */
["BusinessCategory_aggregate_order_by"]: GraphQLTypes["BusinessCategory_aggregate_order_by"];
	/** input type for inserting array relation for remote table "BusinessCategory" */
["BusinessCategory_arr_rel_insert_input"]: GraphQLTypes["BusinessCategory_arr_rel_insert_input"];
	/** aggregate avg on columns */
["BusinessCategory_avg_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "BusinessCategory" */
["BusinessCategory_avg_order_by"]: GraphQLTypes["BusinessCategory_avg_order_by"];
	/** Boolean expression to filter rows from the table "BusinessCategory". All fields are combined with a logical 'AND'. */
["BusinessCategory_bool_exp"]: GraphQLTypes["BusinessCategory_bool_exp"];
	/** unique or primary key constraints on table "BusinessCategory" */
["BusinessCategory_constraint"]: GraphQLTypes["BusinessCategory_constraint"];
	/** input type for incrementing numeric columns in table "BusinessCategory" */
["BusinessCategory_inc_input"]: GraphQLTypes["BusinessCategory_inc_input"];
	/** input type for inserting data into table "BusinessCategory" */
["BusinessCategory_insert_input"]: GraphQLTypes["BusinessCategory_insert_input"];
	/** aggregate max on columns */
["BusinessCategory_max_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined
};
	/** order by max() on columns of table "BusinessCategory" */
["BusinessCategory_max_order_by"]: GraphQLTypes["BusinessCategory_max_order_by"];
	/** aggregate min on columns */
["BusinessCategory_min_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined
};
	/** order by min() on columns of table "BusinessCategory" */
["BusinessCategory_min_order_by"]: GraphQLTypes["BusinessCategory_min_order_by"];
	/** response of any mutation on the table "BusinessCategory" */
["BusinessCategory_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["BusinessCategory"]>
};
	/** on_conflict condition type for table "BusinessCategory" */
["BusinessCategory_on_conflict"]: GraphQLTypes["BusinessCategory_on_conflict"];
	/** Ordering options when selecting data from "BusinessCategory". */
["BusinessCategory_order_by"]: GraphQLTypes["BusinessCategory_order_by"];
	/** primary key columns input for table: BusinessCategory */
["BusinessCategory_pk_columns_input"]: GraphQLTypes["BusinessCategory_pk_columns_input"];
	/** select columns of table "BusinessCategory" */
["BusinessCategory_select_column"]: GraphQLTypes["BusinessCategory_select_column"];
	/** input type for updating data in table "BusinessCategory" */
["BusinessCategory_set_input"]: GraphQLTypes["BusinessCategory_set_input"];
	/** aggregate stddev on columns */
["BusinessCategory_stddev_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_order_by"]: GraphQLTypes["BusinessCategory_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["BusinessCategory_stddev_pop_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_pop_order_by"]: GraphQLTypes["BusinessCategory_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["BusinessCategory_stddev_samp_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_samp_order_by"]: GraphQLTypes["BusinessCategory_stddev_samp_order_by"];
	/** aggregate sum on columns */
["BusinessCategory_sum_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "BusinessCategory" */
["BusinessCategory_sum_order_by"]: GraphQLTypes["BusinessCategory_sum_order_by"];
	/** update columns of table "BusinessCategory" */
["BusinessCategory_update_column"]: GraphQLTypes["BusinessCategory_update_column"];
	/** aggregate var_pop on columns */
["BusinessCategory_var_pop_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "BusinessCategory" */
["BusinessCategory_var_pop_order_by"]: GraphQLTypes["BusinessCategory_var_pop_order_by"];
	/** aggregate var_samp on columns */
["BusinessCategory_var_samp_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "BusinessCategory" */
["BusinessCategory_var_samp_order_by"]: GraphQLTypes["BusinessCategory_var_samp_order_by"];
	/** aggregate variance on columns */
["BusinessCategory_variance_fields"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "BusinessCategory" */
["BusinessCategory_variance_order_by"]: GraphQLTypes["BusinessCategory_variance_order_by"];
	/** columns and relationships of "BusinessWorker" */
["BusinessWorker"]: {
		/** An object relationship */
	Business?: GraphQLTypes["Business"] | undefined,
	/** An object relationship */
	Profile?: GraphQLTypes["Profile"] | undefined,
	businessId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	duty: GraphQLTypes["Duty"],
	id: number,
	profileId?: number | undefined,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "BusinessWorker" */
["BusinessWorker_aggregate"]: {
		aggregate?: GraphQLTypes["BusinessWorker_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["BusinessWorker"]>
};
	/** aggregate fields of "BusinessWorker" */
["BusinessWorker_aggregate_fields"]: {
		avg?: GraphQLTypes["BusinessWorker_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["BusinessWorker_max_fields"] | undefined,
	min?: GraphQLTypes["BusinessWorker_min_fields"] | undefined,
	stddev?: GraphQLTypes["BusinessWorker_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["BusinessWorker_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["BusinessWorker_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["BusinessWorker_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["BusinessWorker_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["BusinessWorker_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["BusinessWorker_variance_fields"] | undefined
};
	/** order by aggregate values of table "BusinessWorker" */
["BusinessWorker_aggregate_order_by"]: GraphQLTypes["BusinessWorker_aggregate_order_by"];
	/** input type for inserting array relation for remote table "BusinessWorker" */
["BusinessWorker_arr_rel_insert_input"]: GraphQLTypes["BusinessWorker_arr_rel_insert_input"];
	/** aggregate avg on columns */
["BusinessWorker_avg_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by avg() on columns of table "BusinessWorker" */
["BusinessWorker_avg_order_by"]: GraphQLTypes["BusinessWorker_avg_order_by"];
	/** Boolean expression to filter rows from the table "BusinessWorker". All fields are combined with a logical 'AND'. */
["BusinessWorker_bool_exp"]: GraphQLTypes["BusinessWorker_bool_exp"];
	/** unique or primary key constraints on table "BusinessWorker" */
["BusinessWorker_constraint"]: GraphQLTypes["BusinessWorker_constraint"];
	/** input type for incrementing numeric columns in table "BusinessWorker" */
["BusinessWorker_inc_input"]: GraphQLTypes["BusinessWorker_inc_input"];
	/** input type for inserting data into table "BusinessWorker" */
["BusinessWorker_insert_input"]: GraphQLTypes["BusinessWorker_insert_input"];
	/** aggregate max on columns */
["BusinessWorker_max_fields"]: {
		businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	duty?: GraphQLTypes["Duty"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "BusinessWorker" */
["BusinessWorker_max_order_by"]: GraphQLTypes["BusinessWorker_max_order_by"];
	/** aggregate min on columns */
["BusinessWorker_min_fields"]: {
		businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	duty?: GraphQLTypes["Duty"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "BusinessWorker" */
["BusinessWorker_min_order_by"]: GraphQLTypes["BusinessWorker_min_order_by"];
	/** response of any mutation on the table "BusinessWorker" */
["BusinessWorker_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["BusinessWorker"]>
};
	/** on_conflict condition type for table "BusinessWorker" */
["BusinessWorker_on_conflict"]: GraphQLTypes["BusinessWorker_on_conflict"];
	/** Ordering options when selecting data from "BusinessWorker". */
["BusinessWorker_order_by"]: GraphQLTypes["BusinessWorker_order_by"];
	/** primary key columns input for table: BusinessWorker */
["BusinessWorker_pk_columns_input"]: GraphQLTypes["BusinessWorker_pk_columns_input"];
	/** select columns of table "BusinessWorker" */
["BusinessWorker_select_column"]: GraphQLTypes["BusinessWorker_select_column"];
	/** input type for updating data in table "BusinessWorker" */
["BusinessWorker_set_input"]: GraphQLTypes["BusinessWorker_set_input"];
	/** aggregate stddev on columns */
["BusinessWorker_stddev_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by stddev() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_order_by"]: GraphQLTypes["BusinessWorker_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["BusinessWorker_stddev_pop_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by stddev_pop() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_pop_order_by"]: GraphQLTypes["BusinessWorker_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["BusinessWorker_stddev_samp_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by stddev_samp() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_samp_order_by"]: GraphQLTypes["BusinessWorker_stddev_samp_order_by"];
	/** aggregate sum on columns */
["BusinessWorker_sum_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by sum() on columns of table "BusinessWorker" */
["BusinessWorker_sum_order_by"]: GraphQLTypes["BusinessWorker_sum_order_by"];
	/** update columns of table "BusinessWorker" */
["BusinessWorker_update_column"]: GraphQLTypes["BusinessWorker_update_column"];
	/** aggregate var_pop on columns */
["BusinessWorker_var_pop_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by var_pop() on columns of table "BusinessWorker" */
["BusinessWorker_var_pop_order_by"]: GraphQLTypes["BusinessWorker_var_pop_order_by"];
	/** aggregate var_samp on columns */
["BusinessWorker_var_samp_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by var_samp() on columns of table "BusinessWorker" */
["BusinessWorker_var_samp_order_by"]: GraphQLTypes["BusinessWorker_var_samp_order_by"];
	/** aggregate variance on columns */
["BusinessWorker_variance_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by variance() on columns of table "BusinessWorker" */
["BusinessWorker_variance_order_by"]: GraphQLTypes["BusinessWorker_variance_order_by"];
	/** aggregated selection of "Business" */
["Business_aggregate"]: {
		aggregate?: GraphQLTypes["Business_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Business"]>
};
	/** aggregate fields of "Business" */
["Business_aggregate_fields"]: {
		avg?: GraphQLTypes["Business_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Business_max_fields"] | undefined,
	min?: GraphQLTypes["Business_min_fields"] | undefined,
	stddev?: GraphQLTypes["Business_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Business_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Business_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Business_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Business_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Business_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Business_variance_fields"] | undefined
};
	/** order by aggregate values of table "Business" */
["Business_aggregate_order_by"]: GraphQLTypes["Business_aggregate_order_by"];
	/** input type for inserting array relation for remote table "Business" */
["Business_arr_rel_insert_input"]: GraphQLTypes["Business_arr_rel_insert_input"];
	/** aggregate avg on columns */
["Business_avg_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "Business" */
["Business_avg_order_by"]: GraphQLTypes["Business_avg_order_by"];
	/** Boolean expression to filter rows from the table "Business". All fields are combined with a logical 'AND'. */
["Business_bool_exp"]: GraphQLTypes["Business_bool_exp"];
	/** unique or primary key constraints on table "Business" */
["Business_constraint"]: GraphQLTypes["Business_constraint"];
	/** input type for incrementing numeric columns in table "Business" */
["Business_inc_input"]: GraphQLTypes["Business_inc_input"];
	/** input type for inserting data into table "Business" */
["Business_insert_input"]: GraphQLTypes["Business_insert_input"];
	/** aggregate max on columns */
["Business_max_fields"]: {
		cityId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	email?: string | undefined,
	id?: number | undefined,
	name?: string | undefined,
	phone?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "Business" */
["Business_max_order_by"]: GraphQLTypes["Business_max_order_by"];
	/** aggregate min on columns */
["Business_min_fields"]: {
		cityId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	email?: string | undefined,
	id?: number | undefined,
	name?: string | undefined,
	phone?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "Business" */
["Business_min_order_by"]: GraphQLTypes["Business_min_order_by"];
	/** response of any mutation on the table "Business" */
["Business_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Business"]>
};
	/** input type for inserting object relation for remote table "Business" */
["Business_obj_rel_insert_input"]: GraphQLTypes["Business_obj_rel_insert_input"];
	/** on_conflict condition type for table "Business" */
["Business_on_conflict"]: GraphQLTypes["Business_on_conflict"];
	/** Ordering options when selecting data from "Business". */
["Business_order_by"]: GraphQLTypes["Business_order_by"];
	/** primary key columns input for table: Business */
["Business_pk_columns_input"]: GraphQLTypes["Business_pk_columns_input"];
	/** select columns of table "Business" */
["Business_select_column"]: GraphQLTypes["Business_select_column"];
	/** input type for updating data in table "Business" */
["Business_set_input"]: GraphQLTypes["Business_set_input"];
	/** aggregate stddev on columns */
["Business_stddev_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "Business" */
["Business_stddev_order_by"]: GraphQLTypes["Business_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["Business_stddev_pop_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "Business" */
["Business_stddev_pop_order_by"]: GraphQLTypes["Business_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["Business_stddev_samp_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "Business" */
["Business_stddev_samp_order_by"]: GraphQLTypes["Business_stddev_samp_order_by"];
	/** aggregate sum on columns */
["Business_sum_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "Business" */
["Business_sum_order_by"]: GraphQLTypes["Business_sum_order_by"];
	/** update columns of table "Business" */
["Business_update_column"]: GraphQLTypes["Business_update_column"];
	/** aggregate var_pop on columns */
["Business_var_pop_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "Business" */
["Business_var_pop_order_by"]: GraphQLTypes["Business_var_pop_order_by"];
	/** aggregate var_samp on columns */
["Business_var_samp_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "Business" */
["Business_var_samp_order_by"]: GraphQLTypes["Business_var_samp_order_by"];
	/** aggregate variance on columns */
["Business_variance_fields"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "Business" */
["Business_variance_order_by"]: GraphQLTypes["Business_variance_order_by"];
	/** columns and relationships of "Category" */
["Category"]: {
		/** An array relationship */
	BusinessCategories: Array<GraphQLTypes["BusinessCategory"]>,
	/** An aggregate relationship */
	BusinessCategories_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** An array relationship */
	CategoryFields: Array<GraphQLTypes["CategoryField"]>,
	/** An aggregate relationship */
	CategoryFields_aggregate: GraphQLTypes["CategoryField_aggregate"],
	/** An array relationship */
	ProductCategories: Array<GraphQLTypes["ProductCategory"]>,
	/** An aggregate relationship */
	ProductCategories_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	name: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "CategoryField" */
["CategoryField"]: {
		/** An object relationship */
	Category?: GraphQLTypes["Category"] | undefined,
	/** An array relationship */
	CategoryFieldValues: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** An aggregate relationship */
	CategoryFieldValues_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	categoryId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	options?: GraphQLTypes["_text"] | undefined,
	required: boolean,
	type: GraphQLTypes["FieldType"],
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "CategoryFieldValue" */
["CategoryFieldValue"]: {
		/** An object relationship */
	Business: GraphQLTypes["Business"],
	/** An object relationship */
	CategoryField: GraphQLTypes["CategoryField"],
	businessId: number,
	categoryFieldId: number,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	updatedAt: GraphQLTypes["timestamp"],
	value: string
};
	/** aggregated selection of "CategoryFieldValue" */
["CategoryFieldValue_aggregate"]: {
		aggregate?: GraphQLTypes["CategoryFieldValue_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["CategoryFieldValue"]>
};
	/** aggregate fields of "CategoryFieldValue" */
["CategoryFieldValue_aggregate_fields"]: {
		avg?: GraphQLTypes["CategoryFieldValue_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["CategoryFieldValue_max_fields"] | undefined,
	min?: GraphQLTypes["CategoryFieldValue_min_fields"] | undefined,
	stddev?: GraphQLTypes["CategoryFieldValue_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["CategoryFieldValue_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["CategoryFieldValue_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["CategoryFieldValue_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["CategoryFieldValue_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["CategoryFieldValue_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["CategoryFieldValue_variance_fields"] | undefined
};
	/** order by aggregate values of table "CategoryFieldValue" */
["CategoryFieldValue_aggregate_order_by"]: GraphQLTypes["CategoryFieldValue_aggregate_order_by"];
	/** input type for inserting array relation for remote table "CategoryFieldValue" */
["CategoryFieldValue_arr_rel_insert_input"]: GraphQLTypes["CategoryFieldValue_arr_rel_insert_input"];
	/** aggregate avg on columns */
["CategoryFieldValue_avg_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_avg_order_by"]: GraphQLTypes["CategoryFieldValue_avg_order_by"];
	/** Boolean expression to filter rows from the table "CategoryFieldValue". All fields are combined with a logical 'AND'. */
["CategoryFieldValue_bool_exp"]: GraphQLTypes["CategoryFieldValue_bool_exp"];
	/** unique or primary key constraints on table "CategoryFieldValue" */
["CategoryFieldValue_constraint"]: GraphQLTypes["CategoryFieldValue_constraint"];
	/** input type for incrementing numeric columns in table "CategoryFieldValue" */
["CategoryFieldValue_inc_input"]: GraphQLTypes["CategoryFieldValue_inc_input"];
	/** input type for inserting data into table "CategoryFieldValue" */
["CategoryFieldValue_insert_input"]: GraphQLTypes["CategoryFieldValue_insert_input"];
	/** aggregate max on columns */
["CategoryFieldValue_max_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	value?: string | undefined
};
	/** order by max() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_max_order_by"]: GraphQLTypes["CategoryFieldValue_max_order_by"];
	/** aggregate min on columns */
["CategoryFieldValue_min_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	value?: string | undefined
};
	/** order by min() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_min_order_by"]: GraphQLTypes["CategoryFieldValue_min_order_by"];
	/** response of any mutation on the table "CategoryFieldValue" */
["CategoryFieldValue_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["CategoryFieldValue"]>
};
	/** on_conflict condition type for table "CategoryFieldValue" */
["CategoryFieldValue_on_conflict"]: GraphQLTypes["CategoryFieldValue_on_conflict"];
	/** Ordering options when selecting data from "CategoryFieldValue". */
["CategoryFieldValue_order_by"]: GraphQLTypes["CategoryFieldValue_order_by"];
	/** primary key columns input for table: CategoryFieldValue */
["CategoryFieldValue_pk_columns_input"]: GraphQLTypes["CategoryFieldValue_pk_columns_input"];
	/** select columns of table "CategoryFieldValue" */
["CategoryFieldValue_select_column"]: GraphQLTypes["CategoryFieldValue_select_column"];
	/** input type for updating data in table "CategoryFieldValue" */
["CategoryFieldValue_set_input"]: GraphQLTypes["CategoryFieldValue_set_input"];
	/** aggregate stddev on columns */
["CategoryFieldValue_stddev_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_order_by"]: GraphQLTypes["CategoryFieldValue_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["CategoryFieldValue_stddev_pop_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_pop_order_by"]: GraphQLTypes["CategoryFieldValue_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["CategoryFieldValue_stddev_samp_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_samp_order_by"]: GraphQLTypes["CategoryFieldValue_stddev_samp_order_by"];
	/** aggregate sum on columns */
["CategoryFieldValue_sum_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_sum_order_by"]: GraphQLTypes["CategoryFieldValue_sum_order_by"];
	/** update columns of table "CategoryFieldValue" */
["CategoryFieldValue_update_column"]: GraphQLTypes["CategoryFieldValue_update_column"];
	/** aggregate var_pop on columns */
["CategoryFieldValue_var_pop_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_var_pop_order_by"]: GraphQLTypes["CategoryFieldValue_var_pop_order_by"];
	/** aggregate var_samp on columns */
["CategoryFieldValue_var_samp_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_var_samp_order_by"]: GraphQLTypes["CategoryFieldValue_var_samp_order_by"];
	/** aggregate variance on columns */
["CategoryFieldValue_variance_fields"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_variance_order_by"]: GraphQLTypes["CategoryFieldValue_variance_order_by"];
	/** aggregated selection of "CategoryField" */
["CategoryField_aggregate"]: {
		aggregate?: GraphQLTypes["CategoryField_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["CategoryField"]>
};
	/** aggregate fields of "CategoryField" */
["CategoryField_aggregate_fields"]: {
		avg?: GraphQLTypes["CategoryField_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["CategoryField_max_fields"] | undefined,
	min?: GraphQLTypes["CategoryField_min_fields"] | undefined,
	stddev?: GraphQLTypes["CategoryField_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["CategoryField_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["CategoryField_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["CategoryField_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["CategoryField_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["CategoryField_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["CategoryField_variance_fields"] | undefined
};
	/** order by aggregate values of table "CategoryField" */
["CategoryField_aggregate_order_by"]: GraphQLTypes["CategoryField_aggregate_order_by"];
	/** input type for inserting array relation for remote table "CategoryField" */
["CategoryField_arr_rel_insert_input"]: GraphQLTypes["CategoryField_arr_rel_insert_input"];
	/** aggregate avg on columns */
["CategoryField_avg_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "CategoryField" */
["CategoryField_avg_order_by"]: GraphQLTypes["CategoryField_avg_order_by"];
	/** Boolean expression to filter rows from the table "CategoryField". All fields are combined with a logical 'AND'. */
["CategoryField_bool_exp"]: GraphQLTypes["CategoryField_bool_exp"];
	/** unique or primary key constraints on table "CategoryField" */
["CategoryField_constraint"]: GraphQLTypes["CategoryField_constraint"];
	/** input type for incrementing numeric columns in table "CategoryField" */
["CategoryField_inc_input"]: GraphQLTypes["CategoryField_inc_input"];
	/** input type for inserting data into table "CategoryField" */
["CategoryField_insert_input"]: GraphQLTypes["CategoryField_insert_input"];
	/** aggregate max on columns */
["CategoryField_max_fields"]: {
		categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	type?: GraphQLTypes["FieldType"] | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "CategoryField" */
["CategoryField_max_order_by"]: GraphQLTypes["CategoryField_max_order_by"];
	/** aggregate min on columns */
["CategoryField_min_fields"]: {
		categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	type?: GraphQLTypes["FieldType"] | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "CategoryField" */
["CategoryField_min_order_by"]: GraphQLTypes["CategoryField_min_order_by"];
	/** response of any mutation on the table "CategoryField" */
["CategoryField_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["CategoryField"]>
};
	/** input type for inserting object relation for remote table "CategoryField" */
["CategoryField_obj_rel_insert_input"]: GraphQLTypes["CategoryField_obj_rel_insert_input"];
	/** on_conflict condition type for table "CategoryField" */
["CategoryField_on_conflict"]: GraphQLTypes["CategoryField_on_conflict"];
	/** Ordering options when selecting data from "CategoryField". */
["CategoryField_order_by"]: GraphQLTypes["CategoryField_order_by"];
	/** primary key columns input for table: CategoryField */
["CategoryField_pk_columns_input"]: GraphQLTypes["CategoryField_pk_columns_input"];
	/** select columns of table "CategoryField" */
["CategoryField_select_column"]: GraphQLTypes["CategoryField_select_column"];
	/** input type for updating data in table "CategoryField" */
["CategoryField_set_input"]: GraphQLTypes["CategoryField_set_input"];
	/** aggregate stddev on columns */
["CategoryField_stddev_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "CategoryField" */
["CategoryField_stddev_order_by"]: GraphQLTypes["CategoryField_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["CategoryField_stddev_pop_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "CategoryField" */
["CategoryField_stddev_pop_order_by"]: GraphQLTypes["CategoryField_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["CategoryField_stddev_samp_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "CategoryField" */
["CategoryField_stddev_samp_order_by"]: GraphQLTypes["CategoryField_stddev_samp_order_by"];
	/** aggregate sum on columns */
["CategoryField_sum_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "CategoryField" */
["CategoryField_sum_order_by"]: GraphQLTypes["CategoryField_sum_order_by"];
	/** update columns of table "CategoryField" */
["CategoryField_update_column"]: GraphQLTypes["CategoryField_update_column"];
	/** aggregate var_pop on columns */
["CategoryField_var_pop_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "CategoryField" */
["CategoryField_var_pop_order_by"]: GraphQLTypes["CategoryField_var_pop_order_by"];
	/** aggregate var_samp on columns */
["CategoryField_var_samp_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "CategoryField" */
["CategoryField_var_samp_order_by"]: GraphQLTypes["CategoryField_var_samp_order_by"];
	/** aggregate variance on columns */
["CategoryField_variance_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "CategoryField" */
["CategoryField_variance_order_by"]: GraphQLTypes["CategoryField_variance_order_by"];
	/** aggregated selection of "Category" */
["Category_aggregate"]: {
		aggregate?: GraphQLTypes["Category_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Category"]>
};
	/** aggregate fields of "Category" */
["Category_aggregate_fields"]: {
		avg?: GraphQLTypes["Category_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Category_max_fields"] | undefined,
	min?: GraphQLTypes["Category_min_fields"] | undefined,
	stddev?: GraphQLTypes["Category_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Category_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Category_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Category_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Category_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Category_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Category_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["Category_avg_fields"]: {
		id?: number | undefined
};
	/** Boolean expression to filter rows from the table "Category". All fields are combined with a logical 'AND'. */
["Category_bool_exp"]: GraphQLTypes["Category_bool_exp"];
	/** unique or primary key constraints on table "Category" */
["Category_constraint"]: GraphQLTypes["Category_constraint"];
	/** input type for incrementing numeric columns in table "Category" */
["Category_inc_input"]: GraphQLTypes["Category_inc_input"];
	/** input type for inserting data into table "Category" */
["Category_insert_input"]: GraphQLTypes["Category_insert_input"];
	/** aggregate max on columns */
["Category_max_fields"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate min on columns */
["Category_min_fields"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** response of any mutation on the table "Category" */
["Category_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Category"]>
};
	/** input type for inserting object relation for remote table "Category" */
["Category_obj_rel_insert_input"]: GraphQLTypes["Category_obj_rel_insert_input"];
	/** on_conflict condition type for table "Category" */
["Category_on_conflict"]: GraphQLTypes["Category_on_conflict"];
	/** Ordering options when selecting data from "Category". */
["Category_order_by"]: GraphQLTypes["Category_order_by"];
	/** primary key columns input for table: Category */
["Category_pk_columns_input"]: GraphQLTypes["Category_pk_columns_input"];
	/** select columns of table "Category" */
["Category_select_column"]: GraphQLTypes["Category_select_column"];
	/** input type for updating data in table "Category" */
["Category_set_input"]: GraphQLTypes["Category_set_input"];
	/** aggregate stddev on columns */
["Category_stddev_fields"]: {
		id?: number | undefined
};
	/** aggregate stddev_pop on columns */
["Category_stddev_pop_fields"]: {
		id?: number | undefined
};
	/** aggregate stddev_samp on columns */
["Category_stddev_samp_fields"]: {
		id?: number | undefined
};
	/** aggregate sum on columns */
["Category_sum_fields"]: {
		id?: number | undefined
};
	/** update columns of table "Category" */
["Category_update_column"]: GraphQLTypes["Category_update_column"];
	/** aggregate var_pop on columns */
["Category_var_pop_fields"]: {
		id?: number | undefined
};
	/** aggregate var_samp on columns */
["Category_var_samp_fields"]: {
		id?: number | undefined
};
	/** aggregate variance on columns */
["Category_variance_fields"]: {
		id?: number | undefined
};
	/** columns and relationships of "City" */
["City"]: {
		/** An array relationship */
	Businesses: Array<GraphQLTypes["Business"]>,
	/** An aggregate relationship */
	Businesses_aggregate: GraphQLTypes["Business_aggregate"],
	countryCode: string,
	countryId: number,
	createdAt: GraphQLTypes["timestamp"],
	flag: number,
	id: number,
	latitude: GraphQLTypes["numeric"],
	longitude: GraphQLTypes["numeric"],
	name: string,
	stateCode: string,
	stateId: number,
	updatedAt: GraphQLTypes["timestamp"],
	wikiDataId: string
};
	/** aggregated selection of "City" */
["City_aggregate"]: {
		aggregate?: GraphQLTypes["City_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["City"]>
};
	/** aggregate fields of "City" */
["City_aggregate_fields"]: {
		avg?: GraphQLTypes["City_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["City_max_fields"] | undefined,
	min?: GraphQLTypes["City_min_fields"] | undefined,
	stddev?: GraphQLTypes["City_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["City_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["City_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["City_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["City_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["City_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["City_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["City_avg_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** Boolean expression to filter rows from the table "City". All fields are combined with a logical 'AND'. */
["City_bool_exp"]: GraphQLTypes["City_bool_exp"];
	/** unique or primary key constraints on table "City" */
["City_constraint"]: GraphQLTypes["City_constraint"];
	/** input type for incrementing numeric columns in table "City" */
["City_inc_input"]: GraphQLTypes["City_inc_input"];
	/** input type for inserting data into table "City" */
["City_insert_input"]: GraphQLTypes["City_insert_input"];
	/** aggregate max on columns */
["City_max_fields"]: {
		countryCode?: string | undefined,
	countryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	name?: string | undefined,
	stateCode?: string | undefined,
	stateId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	wikiDataId?: string | undefined
};
	/** aggregate min on columns */
["City_min_fields"]: {
		countryCode?: string | undefined,
	countryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	name?: string | undefined,
	stateCode?: string | undefined,
	stateId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	wikiDataId?: string | undefined
};
	/** response of any mutation on the table "City" */
["City_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["City"]>
};
	/** input type for inserting object relation for remote table "City" */
["City_obj_rel_insert_input"]: GraphQLTypes["City_obj_rel_insert_input"];
	/** on_conflict condition type for table "City" */
["City_on_conflict"]: GraphQLTypes["City_on_conflict"];
	/** Ordering options when selecting data from "City". */
["City_order_by"]: GraphQLTypes["City_order_by"];
	/** primary key columns input for table: City */
["City_pk_columns_input"]: GraphQLTypes["City_pk_columns_input"];
	/** select columns of table "City" */
["City_select_column"]: GraphQLTypes["City_select_column"];
	/** input type for updating data in table "City" */
["City_set_input"]: GraphQLTypes["City_set_input"];
	/** aggregate stddev on columns */
["City_stddev_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate stddev_pop on columns */
["City_stddev_pop_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate stddev_samp on columns */
["City_stddev_samp_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate sum on columns */
["City_sum_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	stateId?: number | undefined
};
	/** update columns of table "City" */
["City_update_column"]: GraphQLTypes["City_update_column"];
	/** aggregate var_pop on columns */
["City_var_pop_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate var_samp on columns */
["City_var_samp_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate variance on columns */
["City_variance_fields"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	["Duty"]:any;
	/** Boolean expression to compare columns of type "Duty". All fields are combined with logical 'AND'. */
["Duty_comparison_exp"]: GraphQLTypes["Duty_comparison_exp"];
	["FieldType"]:any;
	/** Boolean expression to compare columns of type "FieldType". All fields are combined with logical 'AND'. */
["FieldType_comparison_exp"]: GraphQLTypes["FieldType_comparison_exp"];
	/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
["Int_comparison_exp"]: GraphQLTypes["Int_comparison_exp"];
	/** columns and relationships of "Product" */
["Product"]: {
		/** An object relationship */
	Business: GraphQLTypes["Business"],
	ImagesUrls?: GraphQLTypes["_text"] | undefined,
	/** An array relationship */
	ProductCategories: Array<GraphQLTypes["ProductCategory"]>,
	/** An aggregate relationship */
	ProductCategories_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	businessId: number,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	mainImageUrl: string,
	name: string,
	price: number,
	quota: number,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "ProductCategory" */
["ProductCategory"]: {
		/** An object relationship */
	Category?: GraphQLTypes["Category"] | undefined,
	/** An object relationship */
	Product?: GraphQLTypes["Product"] | undefined,
	categoryId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	productId?: number | undefined,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "ProductCategory" */
["ProductCategory_aggregate"]: {
		aggregate?: GraphQLTypes["ProductCategory_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["ProductCategory"]>
};
	/** aggregate fields of "ProductCategory" */
["ProductCategory_aggregate_fields"]: {
		avg?: GraphQLTypes["ProductCategory_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["ProductCategory_max_fields"] | undefined,
	min?: GraphQLTypes["ProductCategory_min_fields"] | undefined,
	stddev?: GraphQLTypes["ProductCategory_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["ProductCategory_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["ProductCategory_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["ProductCategory_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["ProductCategory_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["ProductCategory_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["ProductCategory_variance_fields"] | undefined
};
	/** order by aggregate values of table "ProductCategory" */
["ProductCategory_aggregate_order_by"]: GraphQLTypes["ProductCategory_aggregate_order_by"];
	/** input type for inserting array relation for remote table "ProductCategory" */
["ProductCategory_arr_rel_insert_input"]: GraphQLTypes["ProductCategory_arr_rel_insert_input"];
	/** aggregate avg on columns */
["ProductCategory_avg_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by avg() on columns of table "ProductCategory" */
["ProductCategory_avg_order_by"]: GraphQLTypes["ProductCategory_avg_order_by"];
	/** Boolean expression to filter rows from the table "ProductCategory". All fields are combined with a logical 'AND'. */
["ProductCategory_bool_exp"]: GraphQLTypes["ProductCategory_bool_exp"];
	/** unique or primary key constraints on table "ProductCategory" */
["ProductCategory_constraint"]: GraphQLTypes["ProductCategory_constraint"];
	/** input type for incrementing numeric columns in table "ProductCategory" */
["ProductCategory_inc_input"]: GraphQLTypes["ProductCategory_inc_input"];
	/** input type for inserting data into table "ProductCategory" */
["ProductCategory_insert_input"]: GraphQLTypes["ProductCategory_insert_input"];
	/** aggregate max on columns */
["ProductCategory_max_fields"]: {
		categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	productId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "ProductCategory" */
["ProductCategory_max_order_by"]: GraphQLTypes["ProductCategory_max_order_by"];
	/** aggregate min on columns */
["ProductCategory_min_fields"]: {
		categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	productId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "ProductCategory" */
["ProductCategory_min_order_by"]: GraphQLTypes["ProductCategory_min_order_by"];
	/** response of any mutation on the table "ProductCategory" */
["ProductCategory_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["ProductCategory"]>
};
	/** on_conflict condition type for table "ProductCategory" */
["ProductCategory_on_conflict"]: GraphQLTypes["ProductCategory_on_conflict"];
	/** Ordering options when selecting data from "ProductCategory". */
["ProductCategory_order_by"]: GraphQLTypes["ProductCategory_order_by"];
	/** primary key columns input for table: ProductCategory */
["ProductCategory_pk_columns_input"]: GraphQLTypes["ProductCategory_pk_columns_input"];
	/** select columns of table "ProductCategory" */
["ProductCategory_select_column"]: GraphQLTypes["ProductCategory_select_column"];
	/** input type for updating data in table "ProductCategory" */
["ProductCategory_set_input"]: GraphQLTypes["ProductCategory_set_input"];
	/** aggregate stddev on columns */
["ProductCategory_stddev_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by stddev() on columns of table "ProductCategory" */
["ProductCategory_stddev_order_by"]: GraphQLTypes["ProductCategory_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["ProductCategory_stddev_pop_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by stddev_pop() on columns of table "ProductCategory" */
["ProductCategory_stddev_pop_order_by"]: GraphQLTypes["ProductCategory_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["ProductCategory_stddev_samp_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by stddev_samp() on columns of table "ProductCategory" */
["ProductCategory_stddev_samp_order_by"]: GraphQLTypes["ProductCategory_stddev_samp_order_by"];
	/** aggregate sum on columns */
["ProductCategory_sum_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by sum() on columns of table "ProductCategory" */
["ProductCategory_sum_order_by"]: GraphQLTypes["ProductCategory_sum_order_by"];
	/** update columns of table "ProductCategory" */
["ProductCategory_update_column"]: GraphQLTypes["ProductCategory_update_column"];
	/** aggregate var_pop on columns */
["ProductCategory_var_pop_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by var_pop() on columns of table "ProductCategory" */
["ProductCategory_var_pop_order_by"]: GraphQLTypes["ProductCategory_var_pop_order_by"];
	/** aggregate var_samp on columns */
["ProductCategory_var_samp_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by var_samp() on columns of table "ProductCategory" */
["ProductCategory_var_samp_order_by"]: GraphQLTypes["ProductCategory_var_samp_order_by"];
	/** aggregate variance on columns */
["ProductCategory_variance_fields"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by variance() on columns of table "ProductCategory" */
["ProductCategory_variance_order_by"]: GraphQLTypes["ProductCategory_variance_order_by"];
	/** aggregated selection of "Product" */
["Product_aggregate"]: {
		aggregate?: GraphQLTypes["Product_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Product"]>
};
	/** aggregate fields of "Product" */
["Product_aggregate_fields"]: {
		avg?: GraphQLTypes["Product_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Product_max_fields"] | undefined,
	min?: GraphQLTypes["Product_min_fields"] | undefined,
	stddev?: GraphQLTypes["Product_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Product_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Product_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Product_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Product_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Product_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Product_variance_fields"] | undefined
};
	/** order by aggregate values of table "Product" */
["Product_aggregate_order_by"]: GraphQLTypes["Product_aggregate_order_by"];
	/** input type for inserting array relation for remote table "Product" */
["Product_arr_rel_insert_input"]: GraphQLTypes["Product_arr_rel_insert_input"];
	/** aggregate avg on columns */
["Product_avg_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by avg() on columns of table "Product" */
["Product_avg_order_by"]: GraphQLTypes["Product_avg_order_by"];
	/** Boolean expression to filter rows from the table "Product". All fields are combined with a logical 'AND'. */
["Product_bool_exp"]: GraphQLTypes["Product_bool_exp"];
	/** unique or primary key constraints on table "Product" */
["Product_constraint"]: GraphQLTypes["Product_constraint"];
	/** input type for incrementing numeric columns in table "Product" */
["Product_inc_input"]: GraphQLTypes["Product_inc_input"];
	/** input type for inserting data into table "Product" */
["Product_insert_input"]: GraphQLTypes["Product_insert_input"];
	/** aggregate max on columns */
["Product_max_fields"]: {
		businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	mainImageUrl?: string | undefined,
	name?: string | undefined,
	price?: number | undefined,
	quota?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "Product" */
["Product_max_order_by"]: GraphQLTypes["Product_max_order_by"];
	/** aggregate min on columns */
["Product_min_fields"]: {
		businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	mainImageUrl?: string | undefined,
	name?: string | undefined,
	price?: number | undefined,
	quota?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "Product" */
["Product_min_order_by"]: GraphQLTypes["Product_min_order_by"];
	/** response of any mutation on the table "Product" */
["Product_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Product"]>
};
	/** input type for inserting object relation for remote table "Product" */
["Product_obj_rel_insert_input"]: GraphQLTypes["Product_obj_rel_insert_input"];
	/** on_conflict condition type for table "Product" */
["Product_on_conflict"]: GraphQLTypes["Product_on_conflict"];
	/** Ordering options when selecting data from "Product". */
["Product_order_by"]: GraphQLTypes["Product_order_by"];
	/** primary key columns input for table: Product */
["Product_pk_columns_input"]: GraphQLTypes["Product_pk_columns_input"];
	/** select columns of table "Product" */
["Product_select_column"]: GraphQLTypes["Product_select_column"];
	/** input type for updating data in table "Product" */
["Product_set_input"]: GraphQLTypes["Product_set_input"];
	/** aggregate stddev on columns */
["Product_stddev_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by stddev() on columns of table "Product" */
["Product_stddev_order_by"]: GraphQLTypes["Product_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["Product_stddev_pop_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by stddev_pop() on columns of table "Product" */
["Product_stddev_pop_order_by"]: GraphQLTypes["Product_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["Product_stddev_samp_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by stddev_samp() on columns of table "Product" */
["Product_stddev_samp_order_by"]: GraphQLTypes["Product_stddev_samp_order_by"];
	/** aggregate sum on columns */
["Product_sum_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by sum() on columns of table "Product" */
["Product_sum_order_by"]: GraphQLTypes["Product_sum_order_by"];
	/** update columns of table "Product" */
["Product_update_column"]: GraphQLTypes["Product_update_column"];
	/** aggregate var_pop on columns */
["Product_var_pop_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by var_pop() on columns of table "Product" */
["Product_var_pop_order_by"]: GraphQLTypes["Product_var_pop_order_by"];
	/** aggregate var_samp on columns */
["Product_var_samp_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by var_samp() on columns of table "Product" */
["Product_var_samp_order_by"]: GraphQLTypes["Product_var_samp_order_by"];
	/** aggregate variance on columns */
["Product_variance_fields"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by variance() on columns of table "Product" */
["Product_variance_order_by"]: GraphQLTypes["Product_variance_order_by"];
	/** columns and relationships of "Profile" */
["Profile"]: {
		/** An array relationship */
	BusinessWorkers: Array<GraphQLTypes["BusinessWorker"]>,
	/** An aggregate relationship */
	BusinessWorkers_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** An array relationship */
	RolesOfProfiles: Array<GraphQLTypes["RolesOfProfile"]>,
	/** An aggregate relationship */
	RolesOfProfiles_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	auth: string,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	name: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "Profile" */
["Profile_aggregate"]: {
		aggregate?: GraphQLTypes["Profile_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Profile"]>
};
	/** aggregate fields of "Profile" */
["Profile_aggregate_fields"]: {
		avg?: GraphQLTypes["Profile_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Profile_max_fields"] | undefined,
	min?: GraphQLTypes["Profile_min_fields"] | undefined,
	stddev?: GraphQLTypes["Profile_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Profile_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Profile_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Profile_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Profile_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Profile_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Profile_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["Profile_avg_fields"]: {
		id?: number | undefined
};
	/** Boolean expression to filter rows from the table "Profile". All fields are combined with a logical 'AND'. */
["Profile_bool_exp"]: GraphQLTypes["Profile_bool_exp"];
	/** unique or primary key constraints on table "Profile" */
["Profile_constraint"]: GraphQLTypes["Profile_constraint"];
	/** input type for incrementing numeric columns in table "Profile" */
["Profile_inc_input"]: GraphQLTypes["Profile_inc_input"];
	/** input type for inserting data into table "Profile" */
["Profile_insert_input"]: GraphQLTypes["Profile_insert_input"];
	/** aggregate max on columns */
["Profile_max_fields"]: {
		auth?: string | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate min on columns */
["Profile_min_fields"]: {
		auth?: string | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** response of any mutation on the table "Profile" */
["Profile_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Profile"]>
};
	/** input type for inserting object relation for remote table "Profile" */
["Profile_obj_rel_insert_input"]: GraphQLTypes["Profile_obj_rel_insert_input"];
	/** on_conflict condition type for table "Profile" */
["Profile_on_conflict"]: GraphQLTypes["Profile_on_conflict"];
	/** Ordering options when selecting data from "Profile". */
["Profile_order_by"]: GraphQLTypes["Profile_order_by"];
	/** primary key columns input for table: Profile */
["Profile_pk_columns_input"]: GraphQLTypes["Profile_pk_columns_input"];
	/** select columns of table "Profile" */
["Profile_select_column"]: GraphQLTypes["Profile_select_column"];
	/** input type for updating data in table "Profile" */
["Profile_set_input"]: GraphQLTypes["Profile_set_input"];
	/** aggregate stddev on columns */
["Profile_stddev_fields"]: {
		id?: number | undefined
};
	/** aggregate stddev_pop on columns */
["Profile_stddev_pop_fields"]: {
		id?: number | undefined
};
	/** aggregate stddev_samp on columns */
["Profile_stddev_samp_fields"]: {
		id?: number | undefined
};
	/** aggregate sum on columns */
["Profile_sum_fields"]: {
		id?: number | undefined
};
	/** update columns of table "Profile" */
["Profile_update_column"]: GraphQLTypes["Profile_update_column"];
	/** aggregate var_pop on columns */
["Profile_var_pop_fields"]: {
		id?: number | undefined
};
	/** aggregate var_samp on columns */
["Profile_var_samp_fields"]: {
		id?: number | undefined
};
	/** aggregate variance on columns */
["Profile_variance_fields"]: {
		id?: number | undefined
};
	/** columns and relationships of "Role" */
["Role"]: {
		/** An array relationship */
	RolesOfProfiles: Array<GraphQLTypes["RolesOfProfile"]>,
	/** An aggregate relationship */
	RolesOfProfiles_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	title: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "Role" */
["Role_aggregate"]: {
		aggregate?: GraphQLTypes["Role_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Role"]>
};
	/** aggregate fields of "Role" */
["Role_aggregate_fields"]: {
		avg?: GraphQLTypes["Role_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Role_max_fields"] | undefined,
	min?: GraphQLTypes["Role_min_fields"] | undefined,
	stddev?: GraphQLTypes["Role_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Role_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Role_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Role_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Role_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Role_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Role_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["Role_avg_fields"]: {
		id?: number | undefined
};
	/** Boolean expression to filter rows from the table "Role". All fields are combined with a logical 'AND'. */
["Role_bool_exp"]: GraphQLTypes["Role_bool_exp"];
	/** unique or primary key constraints on table "Role" */
["Role_constraint"]: GraphQLTypes["Role_constraint"];
	/** input type for incrementing numeric columns in table "Role" */
["Role_inc_input"]: GraphQLTypes["Role_inc_input"];
	/** input type for inserting data into table "Role" */
["Role_insert_input"]: GraphQLTypes["Role_insert_input"];
	/** aggregate max on columns */
["Role_max_fields"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	title?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate min on columns */
["Role_min_fields"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	title?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** response of any mutation on the table "Role" */
["Role_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Role"]>
};
	/** input type for inserting object relation for remote table "Role" */
["Role_obj_rel_insert_input"]: GraphQLTypes["Role_obj_rel_insert_input"];
	/** on_conflict condition type for table "Role" */
["Role_on_conflict"]: GraphQLTypes["Role_on_conflict"];
	/** Ordering options when selecting data from "Role". */
["Role_order_by"]: GraphQLTypes["Role_order_by"];
	/** primary key columns input for table: Role */
["Role_pk_columns_input"]: GraphQLTypes["Role_pk_columns_input"];
	/** select columns of table "Role" */
["Role_select_column"]: GraphQLTypes["Role_select_column"];
	/** input type for updating data in table "Role" */
["Role_set_input"]: GraphQLTypes["Role_set_input"];
	/** aggregate stddev on columns */
["Role_stddev_fields"]: {
		id?: number | undefined
};
	/** aggregate stddev_pop on columns */
["Role_stddev_pop_fields"]: {
		id?: number | undefined
};
	/** aggregate stddev_samp on columns */
["Role_stddev_samp_fields"]: {
		id?: number | undefined
};
	/** aggregate sum on columns */
["Role_sum_fields"]: {
		id?: number | undefined
};
	/** update columns of table "Role" */
["Role_update_column"]: GraphQLTypes["Role_update_column"];
	/** aggregate var_pop on columns */
["Role_var_pop_fields"]: {
		id?: number | undefined
};
	/** aggregate var_samp on columns */
["Role_var_samp_fields"]: {
		id?: number | undefined
};
	/** aggregate variance on columns */
["Role_variance_fields"]: {
		id?: number | undefined
};
	/** columns and relationships of "RolesOfProfile" */
["RolesOfProfile"]: {
		/** An object relationship */
	Profile?: GraphQLTypes["Profile"] | undefined,
	/** An object relationship */
	Role?: GraphQLTypes["Role"] | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "RolesOfProfile" */
["RolesOfProfile_aggregate"]: {
		aggregate?: GraphQLTypes["RolesOfProfile_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["RolesOfProfile"]>
};
	/** aggregate fields of "RolesOfProfile" */
["RolesOfProfile_aggregate_fields"]: {
		avg?: GraphQLTypes["RolesOfProfile_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["RolesOfProfile_max_fields"] | undefined,
	min?: GraphQLTypes["RolesOfProfile_min_fields"] | undefined,
	stddev?: GraphQLTypes["RolesOfProfile_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["RolesOfProfile_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["RolesOfProfile_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["RolesOfProfile_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["RolesOfProfile_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["RolesOfProfile_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["RolesOfProfile_variance_fields"] | undefined
};
	/** order by aggregate values of table "RolesOfProfile" */
["RolesOfProfile_aggregate_order_by"]: GraphQLTypes["RolesOfProfile_aggregate_order_by"];
	/** input type for inserting array relation for remote table "RolesOfProfile" */
["RolesOfProfile_arr_rel_insert_input"]: GraphQLTypes["RolesOfProfile_arr_rel_insert_input"];
	/** aggregate avg on columns */
["RolesOfProfile_avg_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by avg() on columns of table "RolesOfProfile" */
["RolesOfProfile_avg_order_by"]: GraphQLTypes["RolesOfProfile_avg_order_by"];
	/** Boolean expression to filter rows from the table "RolesOfProfile". All fields are combined with a logical 'AND'. */
["RolesOfProfile_bool_exp"]: GraphQLTypes["RolesOfProfile_bool_exp"];
	/** unique or primary key constraints on table "RolesOfProfile" */
["RolesOfProfile_constraint"]: GraphQLTypes["RolesOfProfile_constraint"];
	/** input type for incrementing numeric columns in table "RolesOfProfile" */
["RolesOfProfile_inc_input"]: GraphQLTypes["RolesOfProfile_inc_input"];
	/** input type for inserting data into table "RolesOfProfile" */
["RolesOfProfile_insert_input"]: GraphQLTypes["RolesOfProfile_insert_input"];
	/** aggregate max on columns */
["RolesOfProfile_max_fields"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "RolesOfProfile" */
["RolesOfProfile_max_order_by"]: GraphQLTypes["RolesOfProfile_max_order_by"];
	/** aggregate min on columns */
["RolesOfProfile_min_fields"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "RolesOfProfile" */
["RolesOfProfile_min_order_by"]: GraphQLTypes["RolesOfProfile_min_order_by"];
	/** response of any mutation on the table "RolesOfProfile" */
["RolesOfProfile_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["RolesOfProfile"]>
};
	/** on_conflict condition type for table "RolesOfProfile" */
["RolesOfProfile_on_conflict"]: GraphQLTypes["RolesOfProfile_on_conflict"];
	/** Ordering options when selecting data from "RolesOfProfile". */
["RolesOfProfile_order_by"]: GraphQLTypes["RolesOfProfile_order_by"];
	/** primary key columns input for table: RolesOfProfile */
["RolesOfProfile_pk_columns_input"]: GraphQLTypes["RolesOfProfile_pk_columns_input"];
	/** select columns of table "RolesOfProfile" */
["RolesOfProfile_select_column"]: GraphQLTypes["RolesOfProfile_select_column"];
	/** input type for updating data in table "RolesOfProfile" */
["RolesOfProfile_set_input"]: GraphQLTypes["RolesOfProfile_set_input"];
	/** aggregate stddev on columns */
["RolesOfProfile_stddev_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by stddev() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_order_by"]: GraphQLTypes["RolesOfProfile_stddev_order_by"];
	/** aggregate stddev_pop on columns */
["RolesOfProfile_stddev_pop_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by stddev_pop() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_pop_order_by"]: GraphQLTypes["RolesOfProfile_stddev_pop_order_by"];
	/** aggregate stddev_samp on columns */
["RolesOfProfile_stddev_samp_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by stddev_samp() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_samp_order_by"]: GraphQLTypes["RolesOfProfile_stddev_samp_order_by"];
	/** aggregate sum on columns */
["RolesOfProfile_sum_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by sum() on columns of table "RolesOfProfile" */
["RolesOfProfile_sum_order_by"]: GraphQLTypes["RolesOfProfile_sum_order_by"];
	/** update columns of table "RolesOfProfile" */
["RolesOfProfile_update_column"]: GraphQLTypes["RolesOfProfile_update_column"];
	/** aggregate var_pop on columns */
["RolesOfProfile_var_pop_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by var_pop() on columns of table "RolesOfProfile" */
["RolesOfProfile_var_pop_order_by"]: GraphQLTypes["RolesOfProfile_var_pop_order_by"];
	/** aggregate var_samp on columns */
["RolesOfProfile_var_samp_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by var_samp() on columns of table "RolesOfProfile" */
["RolesOfProfile_var_samp_order_by"]: GraphQLTypes["RolesOfProfile_var_samp_order_by"];
	/** aggregate variance on columns */
["RolesOfProfile_variance_fields"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by variance() on columns of table "RolesOfProfile" */
["RolesOfProfile_variance_order_by"]: GraphQLTypes["RolesOfProfile_variance_order_by"];
	/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
["String_comparison_exp"]: GraphQLTypes["String_comparison_exp"];
	/** columns and relationships of "_prisma_migrations" */
["_prisma_migrations"]: {
		applied_steps_count: number,
	checksum: string,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id: string,
	logs?: string | undefined,
	migration_name: string,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at: GraphQLTypes["timestamptz"]
};
	/** aggregated selection of "_prisma_migrations" */
["_prisma_migrations_aggregate"]: {
		aggregate?: GraphQLTypes["_prisma_migrations_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["_prisma_migrations"]>
};
	/** aggregate fields of "_prisma_migrations" */
["_prisma_migrations_aggregate_fields"]: {
		avg?: GraphQLTypes["_prisma_migrations_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["_prisma_migrations_max_fields"] | undefined,
	min?: GraphQLTypes["_prisma_migrations_min_fields"] | undefined,
	stddev?: GraphQLTypes["_prisma_migrations_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["_prisma_migrations_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["_prisma_migrations_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["_prisma_migrations_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["_prisma_migrations_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["_prisma_migrations_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["_prisma_migrations_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["_prisma_migrations_avg_fields"]: {
		applied_steps_count?: number | undefined
};
	/** Boolean expression to filter rows from the table "_prisma_migrations". All fields are combined with a logical 'AND'. */
["_prisma_migrations_bool_exp"]: GraphQLTypes["_prisma_migrations_bool_exp"];
	/** unique or primary key constraints on table "_prisma_migrations" */
["_prisma_migrations_constraint"]: GraphQLTypes["_prisma_migrations_constraint"];
	/** input type for incrementing numeric columns in table "_prisma_migrations" */
["_prisma_migrations_inc_input"]: GraphQLTypes["_prisma_migrations_inc_input"];
	/** input type for inserting data into table "_prisma_migrations" */
["_prisma_migrations_insert_input"]: GraphQLTypes["_prisma_migrations_insert_input"];
	/** aggregate max on columns */
["_prisma_migrations_max_fields"]: {
		applied_steps_count?: number | undefined,
	checksum?: string | undefined,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id?: string | undefined,
	logs?: string | undefined,
	migration_name?: string | undefined,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at?: GraphQLTypes["timestamptz"] | undefined
};
	/** aggregate min on columns */
["_prisma_migrations_min_fields"]: {
		applied_steps_count?: number | undefined,
	checksum?: string | undefined,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id?: string | undefined,
	logs?: string | undefined,
	migration_name?: string | undefined,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at?: GraphQLTypes["timestamptz"] | undefined
};
	/** response of any mutation on the table "_prisma_migrations" */
["_prisma_migrations_mutation_response"]: {
		/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["_prisma_migrations"]>
};
	/** on_conflict condition type for table "_prisma_migrations" */
["_prisma_migrations_on_conflict"]: GraphQLTypes["_prisma_migrations_on_conflict"];
	/** Ordering options when selecting data from "_prisma_migrations". */
["_prisma_migrations_order_by"]: GraphQLTypes["_prisma_migrations_order_by"];
	/** primary key columns input for table: _prisma_migrations */
["_prisma_migrations_pk_columns_input"]: GraphQLTypes["_prisma_migrations_pk_columns_input"];
	/** select columns of table "_prisma_migrations" */
["_prisma_migrations_select_column"]: GraphQLTypes["_prisma_migrations_select_column"];
	/** input type for updating data in table "_prisma_migrations" */
["_prisma_migrations_set_input"]: GraphQLTypes["_prisma_migrations_set_input"];
	/** aggregate stddev on columns */
["_prisma_migrations_stddev_fields"]: {
		applied_steps_count?: number | undefined
};
	/** aggregate stddev_pop on columns */
["_prisma_migrations_stddev_pop_fields"]: {
		applied_steps_count?: number | undefined
};
	/** aggregate stddev_samp on columns */
["_prisma_migrations_stddev_samp_fields"]: {
		applied_steps_count?: number | undefined
};
	/** aggregate sum on columns */
["_prisma_migrations_sum_fields"]: {
		applied_steps_count?: number | undefined
};
	/** update columns of table "_prisma_migrations" */
["_prisma_migrations_update_column"]: GraphQLTypes["_prisma_migrations_update_column"];
	/** aggregate var_pop on columns */
["_prisma_migrations_var_pop_fields"]: {
		applied_steps_count?: number | undefined
};
	/** aggregate var_samp on columns */
["_prisma_migrations_var_samp_fields"]: {
		applied_steps_count?: number | undefined
};
	/** aggregate variance on columns */
["_prisma_migrations_variance_fields"]: {
		applied_steps_count?: number | undefined
};
	["_text"]:any;
	/** Boolean expression to compare columns of type "_text". All fields are combined with logical 'AND'. */
["_text_comparison_exp"]: GraphQLTypes["_text_comparison_exp"];
	/** mutation root */
["mutation_root"]: {
		/** delete data from the table: "Business" */
	delete_Business?: GraphQLTypes["Business_mutation_response"] | undefined,
	/** delete data from the table: "BusinessCategory" */
	delete_BusinessCategory?: GraphQLTypes["BusinessCategory_mutation_response"] | undefined,
	/** delete single row from the table: "BusinessCategory" */
	delete_BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** delete data from the table: "BusinessWorker" */
	delete_BusinessWorker?: GraphQLTypes["BusinessWorker_mutation_response"] | undefined,
	/** delete single row from the table: "BusinessWorker" */
	delete_BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** delete single row from the table: "Business" */
	delete_Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** delete data from the table: "Category" */
	delete_Category?: GraphQLTypes["Category_mutation_response"] | undefined,
	/** delete data from the table: "CategoryField" */
	delete_CategoryField?: GraphQLTypes["CategoryField_mutation_response"] | undefined,
	/** delete data from the table: "CategoryFieldValue" */
	delete_CategoryFieldValue?: GraphQLTypes["CategoryFieldValue_mutation_response"] | undefined,
	/** delete single row from the table: "CategoryFieldValue" */
	delete_CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** delete single row from the table: "CategoryField" */
	delete_CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** delete single row from the table: "Category" */
	delete_Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** delete data from the table: "City" */
	delete_City?: GraphQLTypes["City_mutation_response"] | undefined,
	/** delete single row from the table: "City" */
	delete_City_by_pk?: GraphQLTypes["City"] | undefined,
	/** delete data from the table: "Product" */
	delete_Product?: GraphQLTypes["Product_mutation_response"] | undefined,
	/** delete data from the table: "ProductCategory" */
	delete_ProductCategory?: GraphQLTypes["ProductCategory_mutation_response"] | undefined,
	/** delete single row from the table: "ProductCategory" */
	delete_ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** delete single row from the table: "Product" */
	delete_Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** delete data from the table: "Profile" */
	delete_Profile?: GraphQLTypes["Profile_mutation_response"] | undefined,
	/** delete single row from the table: "Profile" */
	delete_Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** delete data from the table: "Role" */
	delete_Role?: GraphQLTypes["Role_mutation_response"] | undefined,
	/** delete single row from the table: "Role" */
	delete_Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** delete data from the table: "RolesOfProfile" */
	delete_RolesOfProfile?: GraphQLTypes["RolesOfProfile_mutation_response"] | undefined,
	/** delete single row from the table: "RolesOfProfile" */
	delete_RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** delete data from the table: "_prisma_migrations" */
	delete__prisma_migrations?: GraphQLTypes["_prisma_migrations_mutation_response"] | undefined,
	/** delete single row from the table: "_prisma_migrations" */
	delete__prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined,
	/** insert data into the table: "Business" */
	insert_Business?: GraphQLTypes["Business_mutation_response"] | undefined,
	/** insert data into the table: "BusinessCategory" */
	insert_BusinessCategory?: GraphQLTypes["BusinessCategory_mutation_response"] | undefined,
	/** insert a single row into the table: "BusinessCategory" */
	insert_BusinessCategory_one?: GraphQLTypes["BusinessCategory"] | undefined,
	/** insert data into the table: "BusinessWorker" */
	insert_BusinessWorker?: GraphQLTypes["BusinessWorker_mutation_response"] | undefined,
	/** insert a single row into the table: "BusinessWorker" */
	insert_BusinessWorker_one?: GraphQLTypes["BusinessWorker"] | undefined,
	/** insert a single row into the table: "Business" */
	insert_Business_one?: GraphQLTypes["Business"] | undefined,
	/** insert data into the table: "Category" */
	insert_Category?: GraphQLTypes["Category_mutation_response"] | undefined,
	/** insert data into the table: "CategoryField" */
	insert_CategoryField?: GraphQLTypes["CategoryField_mutation_response"] | undefined,
	/** insert data into the table: "CategoryFieldValue" */
	insert_CategoryFieldValue?: GraphQLTypes["CategoryFieldValue_mutation_response"] | undefined,
	/** insert a single row into the table: "CategoryFieldValue" */
	insert_CategoryFieldValue_one?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** insert a single row into the table: "CategoryField" */
	insert_CategoryField_one?: GraphQLTypes["CategoryField"] | undefined,
	/** insert a single row into the table: "Category" */
	insert_Category_one?: GraphQLTypes["Category"] | undefined,
	/** insert data into the table: "City" */
	insert_City?: GraphQLTypes["City_mutation_response"] | undefined,
	/** insert a single row into the table: "City" */
	insert_City_one?: GraphQLTypes["City"] | undefined,
	/** insert data into the table: "Product" */
	insert_Product?: GraphQLTypes["Product_mutation_response"] | undefined,
	/** insert data into the table: "ProductCategory" */
	insert_ProductCategory?: GraphQLTypes["ProductCategory_mutation_response"] | undefined,
	/** insert a single row into the table: "ProductCategory" */
	insert_ProductCategory_one?: GraphQLTypes["ProductCategory"] | undefined,
	/** insert a single row into the table: "Product" */
	insert_Product_one?: GraphQLTypes["Product"] | undefined,
	/** insert data into the table: "Profile" */
	insert_Profile?: GraphQLTypes["Profile_mutation_response"] | undefined,
	/** insert a single row into the table: "Profile" */
	insert_Profile_one?: GraphQLTypes["Profile"] | undefined,
	/** insert data into the table: "Role" */
	insert_Role?: GraphQLTypes["Role_mutation_response"] | undefined,
	/** insert a single row into the table: "Role" */
	insert_Role_one?: GraphQLTypes["Role"] | undefined,
	/** insert data into the table: "RolesOfProfile" */
	insert_RolesOfProfile?: GraphQLTypes["RolesOfProfile_mutation_response"] | undefined,
	/** insert a single row into the table: "RolesOfProfile" */
	insert_RolesOfProfile_one?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** insert data into the table: "_prisma_migrations" */
	insert__prisma_migrations?: GraphQLTypes["_prisma_migrations_mutation_response"] | undefined,
	/** insert a single row into the table: "_prisma_migrations" */
	insert__prisma_migrations_one?: GraphQLTypes["_prisma_migrations"] | undefined,
	/** update data of the table: "Business" */
	update_Business?: GraphQLTypes["Business_mutation_response"] | undefined,
	/** update data of the table: "BusinessCategory" */
	update_BusinessCategory?: GraphQLTypes["BusinessCategory_mutation_response"] | undefined,
	/** update single row of the table: "BusinessCategory" */
	update_BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** update data of the table: "BusinessWorker" */
	update_BusinessWorker?: GraphQLTypes["BusinessWorker_mutation_response"] | undefined,
	/** update single row of the table: "BusinessWorker" */
	update_BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** update single row of the table: "Business" */
	update_Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** update data of the table: "Category" */
	update_Category?: GraphQLTypes["Category_mutation_response"] | undefined,
	/** update data of the table: "CategoryField" */
	update_CategoryField?: GraphQLTypes["CategoryField_mutation_response"] | undefined,
	/** update data of the table: "CategoryFieldValue" */
	update_CategoryFieldValue?: GraphQLTypes["CategoryFieldValue_mutation_response"] | undefined,
	/** update single row of the table: "CategoryFieldValue" */
	update_CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** update single row of the table: "CategoryField" */
	update_CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** update single row of the table: "Category" */
	update_Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** update data of the table: "City" */
	update_City?: GraphQLTypes["City_mutation_response"] | undefined,
	/** update single row of the table: "City" */
	update_City_by_pk?: GraphQLTypes["City"] | undefined,
	/** update data of the table: "Product" */
	update_Product?: GraphQLTypes["Product_mutation_response"] | undefined,
	/** update data of the table: "ProductCategory" */
	update_ProductCategory?: GraphQLTypes["ProductCategory_mutation_response"] | undefined,
	/** update single row of the table: "ProductCategory" */
	update_ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** update single row of the table: "Product" */
	update_Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** update data of the table: "Profile" */
	update_Profile?: GraphQLTypes["Profile_mutation_response"] | undefined,
	/** update single row of the table: "Profile" */
	update_Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** update data of the table: "Role" */
	update_Role?: GraphQLTypes["Role_mutation_response"] | undefined,
	/** update single row of the table: "Role" */
	update_Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** update data of the table: "RolesOfProfile" */
	update_RolesOfProfile?: GraphQLTypes["RolesOfProfile_mutation_response"] | undefined,
	/** update single row of the table: "RolesOfProfile" */
	update_RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** update data of the table: "_prisma_migrations" */
	update__prisma_migrations?: GraphQLTypes["_prisma_migrations_mutation_response"] | undefined,
	/** update single row of the table: "_prisma_migrations" */
	update__prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined
};
	["numeric"]:any;
	/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
["numeric_comparison_exp"]: GraphQLTypes["numeric_comparison_exp"];
	/** column ordering options */
["order_by"]: GraphQLTypes["order_by"];
	["query_root"]: {
		/** fetch data from the table: "Business" */
	Business: Array<GraphQLTypes["Business"]>,
	/** fetch data from the table: "BusinessCategory" */
	BusinessCategory: Array<GraphQLTypes["BusinessCategory"]>,
	/** fetch aggregated fields from the table: "BusinessCategory" */
	BusinessCategory_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** fetch data from the table: "BusinessCategory" using primary key columns */
	BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** fetch data from the table: "BusinessWorker" */
	BusinessWorker: Array<GraphQLTypes["BusinessWorker"]>,
	/** fetch aggregated fields from the table: "BusinessWorker" */
	BusinessWorker_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** fetch data from the table: "BusinessWorker" using primary key columns */
	BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** fetch aggregated fields from the table: "Business" */
	Business_aggregate: GraphQLTypes["Business_aggregate"],
	/** fetch data from the table: "Business" using primary key columns */
	Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** fetch data from the table: "Category" */
	Category: Array<GraphQLTypes["Category"]>,
	/** fetch data from the table: "CategoryField" */
	CategoryField: Array<GraphQLTypes["CategoryField"]>,
	/** fetch data from the table: "CategoryFieldValue" */
	CategoryFieldValue: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** fetch aggregated fields from the table: "CategoryFieldValue" */
	CategoryFieldValue_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	/** fetch data from the table: "CategoryFieldValue" using primary key columns */
	CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** fetch aggregated fields from the table: "CategoryField" */
	CategoryField_aggregate: GraphQLTypes["CategoryField_aggregate"],
	/** fetch data from the table: "CategoryField" using primary key columns */
	CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** fetch aggregated fields from the table: "Category" */
	Category_aggregate: GraphQLTypes["Category_aggregate"],
	/** fetch data from the table: "Category" using primary key columns */
	Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** fetch data from the table: "City" */
	City: Array<GraphQLTypes["City"]>,
	/** fetch aggregated fields from the table: "City" */
	City_aggregate: GraphQLTypes["City_aggregate"],
	/** fetch data from the table: "City" using primary key columns */
	City_by_pk?: GraphQLTypes["City"] | undefined,
	/** fetch data from the table: "Product" */
	Product: Array<GraphQLTypes["Product"]>,
	/** fetch data from the table: "ProductCategory" */
	ProductCategory: Array<GraphQLTypes["ProductCategory"]>,
	/** fetch aggregated fields from the table: "ProductCategory" */
	ProductCategory_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	/** fetch data from the table: "ProductCategory" using primary key columns */
	ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** fetch aggregated fields from the table: "Product" */
	Product_aggregate: GraphQLTypes["Product_aggregate"],
	/** fetch data from the table: "Product" using primary key columns */
	Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** fetch data from the table: "Profile" */
	Profile: Array<GraphQLTypes["Profile"]>,
	/** fetch aggregated fields from the table: "Profile" */
	Profile_aggregate: GraphQLTypes["Profile_aggregate"],
	/** fetch data from the table: "Profile" using primary key columns */
	Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** fetch data from the table: "Role" */
	Role: Array<GraphQLTypes["Role"]>,
	/** fetch aggregated fields from the table: "Role" */
	Role_aggregate: GraphQLTypes["Role_aggregate"],
	/** fetch data from the table: "Role" using primary key columns */
	Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** fetch data from the table: "RolesOfProfile" */
	RolesOfProfile: Array<GraphQLTypes["RolesOfProfile"]>,
	/** fetch aggregated fields from the table: "RolesOfProfile" */
	RolesOfProfile_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	/** fetch data from the table: "RolesOfProfile" using primary key columns */
	RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** fetch data from the table: "_prisma_migrations" */
	_prisma_migrations: Array<GraphQLTypes["_prisma_migrations"]>,
	/** fetch aggregated fields from the table: "_prisma_migrations" */
	_prisma_migrations_aggregate: GraphQLTypes["_prisma_migrations_aggregate"],
	/** fetch data from the table: "_prisma_migrations" using primary key columns */
	_prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined
};
	["subscription_root"]: {
		/** fetch data from the table: "Business" */
	Business: Array<GraphQLTypes["Business"]>,
	/** fetch data from the table: "BusinessCategory" */
	BusinessCategory: Array<GraphQLTypes["BusinessCategory"]>,
	/** fetch aggregated fields from the table: "BusinessCategory" */
	BusinessCategory_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** fetch data from the table: "BusinessCategory" using primary key columns */
	BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** fetch data from the table: "BusinessWorker" */
	BusinessWorker: Array<GraphQLTypes["BusinessWorker"]>,
	/** fetch aggregated fields from the table: "BusinessWorker" */
	BusinessWorker_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** fetch data from the table: "BusinessWorker" using primary key columns */
	BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** fetch aggregated fields from the table: "Business" */
	Business_aggregate: GraphQLTypes["Business_aggregate"],
	/** fetch data from the table: "Business" using primary key columns */
	Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** fetch data from the table: "Category" */
	Category: Array<GraphQLTypes["Category"]>,
	/** fetch data from the table: "CategoryField" */
	CategoryField: Array<GraphQLTypes["CategoryField"]>,
	/** fetch data from the table: "CategoryFieldValue" */
	CategoryFieldValue: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** fetch aggregated fields from the table: "CategoryFieldValue" */
	CategoryFieldValue_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	/** fetch data from the table: "CategoryFieldValue" using primary key columns */
	CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** fetch aggregated fields from the table: "CategoryField" */
	CategoryField_aggregate: GraphQLTypes["CategoryField_aggregate"],
	/** fetch data from the table: "CategoryField" using primary key columns */
	CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** fetch aggregated fields from the table: "Category" */
	Category_aggregate: GraphQLTypes["Category_aggregate"],
	/** fetch data from the table: "Category" using primary key columns */
	Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** fetch data from the table: "City" */
	City: Array<GraphQLTypes["City"]>,
	/** fetch aggregated fields from the table: "City" */
	City_aggregate: GraphQLTypes["City_aggregate"],
	/** fetch data from the table: "City" using primary key columns */
	City_by_pk?: GraphQLTypes["City"] | undefined,
	/** fetch data from the table: "Product" */
	Product: Array<GraphQLTypes["Product"]>,
	/** fetch data from the table: "ProductCategory" */
	ProductCategory: Array<GraphQLTypes["ProductCategory"]>,
	/** fetch aggregated fields from the table: "ProductCategory" */
	ProductCategory_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	/** fetch data from the table: "ProductCategory" using primary key columns */
	ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** fetch aggregated fields from the table: "Product" */
	Product_aggregate: GraphQLTypes["Product_aggregate"],
	/** fetch data from the table: "Product" using primary key columns */
	Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** fetch data from the table: "Profile" */
	Profile: Array<GraphQLTypes["Profile"]>,
	/** fetch aggregated fields from the table: "Profile" */
	Profile_aggregate: GraphQLTypes["Profile_aggregate"],
	/** fetch data from the table: "Profile" using primary key columns */
	Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** fetch data from the table: "Role" */
	Role: Array<GraphQLTypes["Role"]>,
	/** fetch aggregated fields from the table: "Role" */
	Role_aggregate: GraphQLTypes["Role_aggregate"],
	/** fetch data from the table: "Role" using primary key columns */
	Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** fetch data from the table: "RolesOfProfile" */
	RolesOfProfile: Array<GraphQLTypes["RolesOfProfile"]>,
	/** fetch aggregated fields from the table: "RolesOfProfile" */
	RolesOfProfile_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	/** fetch data from the table: "RolesOfProfile" using primary key columns */
	RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** fetch data from the table: "_prisma_migrations" */
	_prisma_migrations: Array<GraphQLTypes["_prisma_migrations"]>,
	/** fetch aggregated fields from the table: "_prisma_migrations" */
	_prisma_migrations_aggregate: GraphQLTypes["_prisma_migrations_aggregate"],
	/** fetch data from the table: "_prisma_migrations" using primary key columns */
	_prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined
};
	["timestamp"]:any;
	/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
["timestamp_comparison_exp"]: GraphQLTypes["timestamp_comparison_exp"];
	["timestamptz"]:any;
	/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
["timestamptz_comparison_exp"]: GraphQLTypes["timestamptz_comparison_exp"]
    }

export type GraphQLTypes = {
    /** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
["Boolean_comparison_exp"]: {
		_eq?: boolean | undefined,
	_gt?: boolean | undefined,
	_gte?: boolean | undefined,
	_in?: Array<boolean> | undefined,
	_is_null?: boolean | undefined,
	_lt?: boolean | undefined,
	_lte?: boolean | undefined,
	_neq?: boolean | undefined,
	_nin?: Array<boolean> | undefined
};
	/** columns and relationships of "Business" */
["Business"]: {
	__typename: "Business",
	/** An array relationship */
	BusinessCategories: Array<GraphQLTypes["BusinessCategory"]>,
	/** An aggregate relationship */
	BusinessCategories_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** An array relationship */
	BusinessWorkers: Array<GraphQLTypes["BusinessWorker"]>,
	/** An aggregate relationship */
	BusinessWorkers_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** An array relationship */
	CategoryFieldValues: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** An aggregate relationship */
	CategoryFieldValues_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	/** An object relationship */
	City: GraphQLTypes["City"],
	/** An array relationship */
	Products: Array<GraphQLTypes["Product"]>,
	/** An aggregate relationship */
	Products_aggregate: GraphQLTypes["Product_aggregate"],
	cityId: number,
	createdAt: GraphQLTypes["timestamp"],
	email?: string | undefined,
	id: number,
	name: string,
	phone: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "BusinessCategory" */
["BusinessCategory"]: {
	__typename: "BusinessCategory",
	/** An object relationship */
	Business?: GraphQLTypes["Business"] | undefined,
	/** An object relationship */
	Category?: GraphQLTypes["Category"] | undefined,
	businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number
};
	/** aggregated selection of "BusinessCategory" */
["BusinessCategory_aggregate"]: {
	__typename: "BusinessCategory_aggregate",
	aggregate?: GraphQLTypes["BusinessCategory_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["BusinessCategory"]>
};
	/** aggregate fields of "BusinessCategory" */
["BusinessCategory_aggregate_fields"]: {
	__typename: "BusinessCategory_aggregate_fields",
	avg?: GraphQLTypes["BusinessCategory_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["BusinessCategory_max_fields"] | undefined,
	min?: GraphQLTypes["BusinessCategory_min_fields"] | undefined,
	stddev?: GraphQLTypes["BusinessCategory_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["BusinessCategory_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["BusinessCategory_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["BusinessCategory_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["BusinessCategory_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["BusinessCategory_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["BusinessCategory_variance_fields"] | undefined
};
	/** order by aggregate values of table "BusinessCategory" */
["BusinessCategory_aggregate_order_by"]: {
		avg?: GraphQLTypes["BusinessCategory_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["BusinessCategory_max_order_by"] | undefined,
	min?: GraphQLTypes["BusinessCategory_min_order_by"] | undefined,
	stddev?: GraphQLTypes["BusinessCategory_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["BusinessCategory_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["BusinessCategory_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["BusinessCategory_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["BusinessCategory_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["BusinessCategory_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["BusinessCategory_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "BusinessCategory" */
["BusinessCategory_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["BusinessCategory_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["BusinessCategory_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["BusinessCategory_avg_fields"]: {
	__typename: "BusinessCategory_avg_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "BusinessCategory" */
["BusinessCategory_avg_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "BusinessCategory". All fields are combined with a logical 'AND'. */
["BusinessCategory_bool_exp"]: {
		Business?: GraphQLTypes["Business_bool_exp"] | undefined,
	Category?: GraphQLTypes["Category_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["BusinessCategory_bool_exp"]> | undefined,
	_not?: GraphQLTypes["BusinessCategory_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["BusinessCategory_bool_exp"]> | undefined,
	businessId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	categoryId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "BusinessCategory" */
["BusinessCategory_constraint"]: BusinessCategory_constraint;
	/** input type for incrementing numeric columns in table "BusinessCategory" */
["BusinessCategory_inc_input"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** input type for inserting data into table "BusinessCategory" */
["BusinessCategory_insert_input"]: {
		Business?: GraphQLTypes["Business_obj_rel_insert_input"] | undefined,
	Category?: GraphQLTypes["Category_obj_rel_insert_input"] | undefined,
	businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined
};
	/** aggregate max on columns */
["BusinessCategory_max_fields"]: {
	__typename: "BusinessCategory_max_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined
};
	/** order by max() on columns of table "BusinessCategory" */
["BusinessCategory_max_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["BusinessCategory_min_fields"]: {
	__typename: "BusinessCategory_min_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined
};
	/** order by min() on columns of table "BusinessCategory" */
["BusinessCategory_min_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "BusinessCategory" */
["BusinessCategory_mutation_response"]: {
	__typename: "BusinessCategory_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["BusinessCategory"]>
};
	/** on_conflict condition type for table "BusinessCategory" */
["BusinessCategory_on_conflict"]: {
		constraint: GraphQLTypes["BusinessCategory_constraint"],
	update_columns: Array<GraphQLTypes["BusinessCategory_update_column"]>,
	where?: GraphQLTypes["BusinessCategory_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "BusinessCategory". */
["BusinessCategory_order_by"]: {
		Business?: GraphQLTypes["Business_order_by"] | undefined,
	Category?: GraphQLTypes["Category_order_by"] | undefined,
	businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: BusinessCategory */
["BusinessCategory_pk_columns_input"]: {
		id: number
};
	/** select columns of table "BusinessCategory" */
["BusinessCategory_select_column"]: BusinessCategory_select_column;
	/** input type for updating data in table "BusinessCategory" */
["BusinessCategory_set_input"]: {
		businessId?: number | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined
};
	/** aggregate stddev on columns */
["BusinessCategory_stddev_fields"]: {
	__typename: "BusinessCategory_stddev_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["BusinessCategory_stddev_pop_fields"]: {
	__typename: "BusinessCategory_stddev_pop_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["BusinessCategory_stddev_samp_fields"]: {
	__typename: "BusinessCategory_stddev_samp_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "BusinessCategory" */
["BusinessCategory_stddev_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["BusinessCategory_sum_fields"]: {
	__typename: "BusinessCategory_sum_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "BusinessCategory" */
["BusinessCategory_sum_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "BusinessCategory" */
["BusinessCategory_update_column"]: BusinessCategory_update_column;
	/** aggregate var_pop on columns */
["BusinessCategory_var_pop_fields"]: {
	__typename: "BusinessCategory_var_pop_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "BusinessCategory" */
["BusinessCategory_var_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["BusinessCategory_var_samp_fields"]: {
	__typename: "BusinessCategory_var_samp_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "BusinessCategory" */
["BusinessCategory_var_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["BusinessCategory_variance_fields"]: {
	__typename: "BusinessCategory_variance_fields",
	businessId?: number | undefined,
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "BusinessCategory" */
["BusinessCategory_variance_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** columns and relationships of "BusinessWorker" */
["BusinessWorker"]: {
	__typename: "BusinessWorker",
	/** An object relationship */
	Business?: GraphQLTypes["Business"] | undefined,
	/** An object relationship */
	Profile?: GraphQLTypes["Profile"] | undefined,
	businessId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	duty: GraphQLTypes["Duty"],
	id: number,
	profileId?: number | undefined,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "BusinessWorker" */
["BusinessWorker_aggregate"]: {
	__typename: "BusinessWorker_aggregate",
	aggregate?: GraphQLTypes["BusinessWorker_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["BusinessWorker"]>
};
	/** aggregate fields of "BusinessWorker" */
["BusinessWorker_aggregate_fields"]: {
	__typename: "BusinessWorker_aggregate_fields",
	avg?: GraphQLTypes["BusinessWorker_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["BusinessWorker_max_fields"] | undefined,
	min?: GraphQLTypes["BusinessWorker_min_fields"] | undefined,
	stddev?: GraphQLTypes["BusinessWorker_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["BusinessWorker_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["BusinessWorker_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["BusinessWorker_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["BusinessWorker_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["BusinessWorker_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["BusinessWorker_variance_fields"] | undefined
};
	/** order by aggregate values of table "BusinessWorker" */
["BusinessWorker_aggregate_order_by"]: {
		avg?: GraphQLTypes["BusinessWorker_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["BusinessWorker_max_order_by"] | undefined,
	min?: GraphQLTypes["BusinessWorker_min_order_by"] | undefined,
	stddev?: GraphQLTypes["BusinessWorker_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["BusinessWorker_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["BusinessWorker_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["BusinessWorker_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["BusinessWorker_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["BusinessWorker_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["BusinessWorker_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "BusinessWorker" */
["BusinessWorker_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["BusinessWorker_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["BusinessWorker_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["BusinessWorker_avg_fields"]: {
	__typename: "BusinessWorker_avg_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by avg() on columns of table "BusinessWorker" */
["BusinessWorker_avg_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "BusinessWorker". All fields are combined with a logical 'AND'. */
["BusinessWorker_bool_exp"]: {
		Business?: GraphQLTypes["Business_bool_exp"] | undefined,
	Profile?: GraphQLTypes["Profile_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["BusinessWorker_bool_exp"]> | undefined,
	_not?: GraphQLTypes["BusinessWorker_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["BusinessWorker_bool_exp"]> | undefined,
	businessId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	duty?: GraphQLTypes["Duty_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	profileId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "BusinessWorker" */
["BusinessWorker_constraint"]: BusinessWorker_constraint;
	/** input type for incrementing numeric columns in table "BusinessWorker" */
["BusinessWorker_inc_input"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** input type for inserting data into table "BusinessWorker" */
["BusinessWorker_insert_input"]: {
		Business?: GraphQLTypes["Business_obj_rel_insert_input"] | undefined,
	Profile?: GraphQLTypes["Profile_obj_rel_insert_input"] | undefined,
	businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	duty?: GraphQLTypes["Duty"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["BusinessWorker_max_fields"]: {
	__typename: "BusinessWorker_max_fields",
	businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	duty?: GraphQLTypes["Duty"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "BusinessWorker" */
["BusinessWorker_max_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	duty?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["BusinessWorker_min_fields"]: {
	__typename: "BusinessWorker_min_fields",
	businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	duty?: GraphQLTypes["Duty"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "BusinessWorker" */
["BusinessWorker_min_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	duty?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "BusinessWorker" */
["BusinessWorker_mutation_response"]: {
	__typename: "BusinessWorker_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["BusinessWorker"]>
};
	/** on_conflict condition type for table "BusinessWorker" */
["BusinessWorker_on_conflict"]: {
		constraint: GraphQLTypes["BusinessWorker_constraint"],
	update_columns: Array<GraphQLTypes["BusinessWorker_update_column"]>,
	where?: GraphQLTypes["BusinessWorker_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "BusinessWorker". */
["BusinessWorker_order_by"]: {
		Business?: GraphQLTypes["Business_order_by"] | undefined,
	Profile?: GraphQLTypes["Profile_order_by"] | undefined,
	businessId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	duty?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: BusinessWorker */
["BusinessWorker_pk_columns_input"]: {
		id: number
};
	/** select columns of table "BusinessWorker" */
["BusinessWorker_select_column"]: BusinessWorker_select_column;
	/** input type for updating data in table "BusinessWorker" */
["BusinessWorker_set_input"]: {
		businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	duty?: GraphQLTypes["Duty"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["BusinessWorker_stddev_fields"]: {
	__typename: "BusinessWorker_stddev_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by stddev() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["BusinessWorker_stddev_pop_fields"]: {
	__typename: "BusinessWorker_stddev_pop_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by stddev_pop() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["BusinessWorker_stddev_samp_fields"]: {
	__typename: "BusinessWorker_stddev_samp_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by stddev_samp() on columns of table "BusinessWorker" */
["BusinessWorker_stddev_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["BusinessWorker_sum_fields"]: {
	__typename: "BusinessWorker_sum_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by sum() on columns of table "BusinessWorker" */
["BusinessWorker_sum_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "BusinessWorker" */
["BusinessWorker_update_column"]: BusinessWorker_update_column;
	/** aggregate var_pop on columns */
["BusinessWorker_var_pop_fields"]: {
	__typename: "BusinessWorker_var_pop_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by var_pop() on columns of table "BusinessWorker" */
["BusinessWorker_var_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["BusinessWorker_var_samp_fields"]: {
	__typename: "BusinessWorker_var_samp_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by var_samp() on columns of table "BusinessWorker" */
["BusinessWorker_var_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["BusinessWorker_variance_fields"]: {
	__typename: "BusinessWorker_variance_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	profileId?: number | undefined
};
	/** order by variance() on columns of table "BusinessWorker" */
["BusinessWorker_variance_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregated selection of "Business" */
["Business_aggregate"]: {
	__typename: "Business_aggregate",
	aggregate?: GraphQLTypes["Business_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Business"]>
};
	/** aggregate fields of "Business" */
["Business_aggregate_fields"]: {
	__typename: "Business_aggregate_fields",
	avg?: GraphQLTypes["Business_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Business_max_fields"] | undefined,
	min?: GraphQLTypes["Business_min_fields"] | undefined,
	stddev?: GraphQLTypes["Business_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Business_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Business_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Business_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Business_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Business_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Business_variance_fields"] | undefined
};
	/** order by aggregate values of table "Business" */
["Business_aggregate_order_by"]: {
		avg?: GraphQLTypes["Business_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["Business_max_order_by"] | undefined,
	min?: GraphQLTypes["Business_min_order_by"] | undefined,
	stddev?: GraphQLTypes["Business_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["Business_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["Business_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["Business_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["Business_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["Business_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["Business_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "Business" */
["Business_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["Business_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["Business_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["Business_avg_fields"]: {
	__typename: "Business_avg_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "Business" */
["Business_avg_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "Business". All fields are combined with a logical 'AND'. */
["Business_bool_exp"]: {
		BusinessCategories?: GraphQLTypes["BusinessCategory_bool_exp"] | undefined,
	BusinessWorkers?: GraphQLTypes["BusinessWorker_bool_exp"] | undefined,
	CategoryFieldValues?: GraphQLTypes["CategoryFieldValue_bool_exp"] | undefined,
	City?: GraphQLTypes["City_bool_exp"] | undefined,
	Products?: GraphQLTypes["Product_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["Business_bool_exp"]> | undefined,
	_not?: GraphQLTypes["Business_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["Business_bool_exp"]> | undefined,
	cityId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	email?: GraphQLTypes["String_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	name?: GraphQLTypes["String_comparison_exp"] | undefined,
	phone?: GraphQLTypes["String_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "Business" */
["Business_constraint"]: Business_constraint;
	/** input type for incrementing numeric columns in table "Business" */
["Business_inc_input"]: {
		cityId?: number | undefined,
	id?: number | undefined
};
	/** input type for inserting data into table "Business" */
["Business_insert_input"]: {
		BusinessCategories?: GraphQLTypes["BusinessCategory_arr_rel_insert_input"] | undefined,
	BusinessWorkers?: GraphQLTypes["BusinessWorker_arr_rel_insert_input"] | undefined,
	CategoryFieldValues?: GraphQLTypes["CategoryFieldValue_arr_rel_insert_input"] | undefined,
	City?: GraphQLTypes["City_obj_rel_insert_input"] | undefined,
	Products?: GraphQLTypes["Product_arr_rel_insert_input"] | undefined,
	cityId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	email?: string | undefined,
	id?: number | undefined,
	name?: string | undefined,
	phone?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["Business_max_fields"]: {
	__typename: "Business_max_fields",
	cityId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	email?: string | undefined,
	id?: number | undefined,
	name?: string | undefined,
	phone?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "Business" */
["Business_max_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	email?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	phone?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["Business_min_fields"]: {
	__typename: "Business_min_fields",
	cityId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	email?: string | undefined,
	id?: number | undefined,
	name?: string | undefined,
	phone?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "Business" */
["Business_min_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	email?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	phone?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "Business" */
["Business_mutation_response"]: {
	__typename: "Business_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Business"]>
};
	/** input type for inserting object relation for remote table "Business" */
["Business_obj_rel_insert_input"]: {
		data: GraphQLTypes["Business_insert_input"],
	/** upsert condition */
	on_conflict?: GraphQLTypes["Business_on_conflict"] | undefined
};
	/** on_conflict condition type for table "Business" */
["Business_on_conflict"]: {
		constraint: GraphQLTypes["Business_constraint"],
	update_columns: Array<GraphQLTypes["Business_update_column"]>,
	where?: GraphQLTypes["Business_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "Business". */
["Business_order_by"]: {
		BusinessCategories_aggregate?: GraphQLTypes["BusinessCategory_aggregate_order_by"] | undefined,
	BusinessWorkers_aggregate?: GraphQLTypes["BusinessWorker_aggregate_order_by"] | undefined,
	CategoryFieldValues_aggregate?: GraphQLTypes["CategoryFieldValue_aggregate_order_by"] | undefined,
	City?: GraphQLTypes["City_order_by"] | undefined,
	Products_aggregate?: GraphQLTypes["Product_aggregate_order_by"] | undefined,
	cityId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	email?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	phone?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: Business */
["Business_pk_columns_input"]: {
		id: number
};
	/** select columns of table "Business" */
["Business_select_column"]: Business_select_column;
	/** input type for updating data in table "Business" */
["Business_set_input"]: {
		cityId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	email?: string | undefined,
	id?: number | undefined,
	name?: string | undefined,
	phone?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["Business_stddev_fields"]: {
	__typename: "Business_stddev_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "Business" */
["Business_stddev_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["Business_stddev_pop_fields"]: {
	__typename: "Business_stddev_pop_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "Business" */
["Business_stddev_pop_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["Business_stddev_samp_fields"]: {
	__typename: "Business_stddev_samp_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "Business" */
["Business_stddev_samp_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["Business_sum_fields"]: {
	__typename: "Business_sum_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "Business" */
["Business_sum_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "Business" */
["Business_update_column"]: Business_update_column;
	/** aggregate var_pop on columns */
["Business_var_pop_fields"]: {
	__typename: "Business_var_pop_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "Business" */
["Business_var_pop_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["Business_var_samp_fields"]: {
	__typename: "Business_var_samp_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "Business" */
["Business_var_samp_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["Business_variance_fields"]: {
	__typename: "Business_variance_fields",
	cityId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "Business" */
["Business_variance_order_by"]: {
		cityId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** columns and relationships of "Category" */
["Category"]: {
	__typename: "Category",
	/** An array relationship */
	BusinessCategories: Array<GraphQLTypes["BusinessCategory"]>,
	/** An aggregate relationship */
	BusinessCategories_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** An array relationship */
	CategoryFields: Array<GraphQLTypes["CategoryField"]>,
	/** An aggregate relationship */
	CategoryFields_aggregate: GraphQLTypes["CategoryField_aggregate"],
	/** An array relationship */
	ProductCategories: Array<GraphQLTypes["ProductCategory"]>,
	/** An aggregate relationship */
	ProductCategories_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	name: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "CategoryField" */
["CategoryField"]: {
	__typename: "CategoryField",
	/** An object relationship */
	Category?: GraphQLTypes["Category"] | undefined,
	/** An array relationship */
	CategoryFieldValues: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** An aggregate relationship */
	CategoryFieldValues_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	categoryId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	options?: GraphQLTypes["_text"] | undefined,
	required: boolean,
	type: GraphQLTypes["FieldType"],
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "CategoryFieldValue" */
["CategoryFieldValue"]: {
	__typename: "CategoryFieldValue",
	/** An object relationship */
	Business: GraphQLTypes["Business"],
	/** An object relationship */
	CategoryField: GraphQLTypes["CategoryField"],
	businessId: number,
	categoryFieldId: number,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	updatedAt: GraphQLTypes["timestamp"],
	value: string
};
	/** aggregated selection of "CategoryFieldValue" */
["CategoryFieldValue_aggregate"]: {
	__typename: "CategoryFieldValue_aggregate",
	aggregate?: GraphQLTypes["CategoryFieldValue_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["CategoryFieldValue"]>
};
	/** aggregate fields of "CategoryFieldValue" */
["CategoryFieldValue_aggregate_fields"]: {
	__typename: "CategoryFieldValue_aggregate_fields",
	avg?: GraphQLTypes["CategoryFieldValue_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["CategoryFieldValue_max_fields"] | undefined,
	min?: GraphQLTypes["CategoryFieldValue_min_fields"] | undefined,
	stddev?: GraphQLTypes["CategoryFieldValue_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["CategoryFieldValue_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["CategoryFieldValue_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["CategoryFieldValue_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["CategoryFieldValue_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["CategoryFieldValue_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["CategoryFieldValue_variance_fields"] | undefined
};
	/** order by aggregate values of table "CategoryFieldValue" */
["CategoryFieldValue_aggregate_order_by"]: {
		avg?: GraphQLTypes["CategoryFieldValue_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["CategoryFieldValue_max_order_by"] | undefined,
	min?: GraphQLTypes["CategoryFieldValue_min_order_by"] | undefined,
	stddev?: GraphQLTypes["CategoryFieldValue_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["CategoryFieldValue_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["CategoryFieldValue_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["CategoryFieldValue_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["CategoryFieldValue_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["CategoryFieldValue_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["CategoryFieldValue_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "CategoryFieldValue" */
["CategoryFieldValue_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["CategoryFieldValue_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["CategoryFieldValue_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["CategoryFieldValue_avg_fields"]: {
	__typename: "CategoryFieldValue_avg_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_avg_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "CategoryFieldValue". All fields are combined with a logical 'AND'. */
["CategoryFieldValue_bool_exp"]: {
		Business?: GraphQLTypes["Business_bool_exp"] | undefined,
	CategoryField?: GraphQLTypes["CategoryField_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["CategoryFieldValue_bool_exp"]> | undefined,
	_not?: GraphQLTypes["CategoryFieldValue_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["CategoryFieldValue_bool_exp"]> | undefined,
	businessId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	categoryFieldId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	value?: GraphQLTypes["String_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "CategoryFieldValue" */
["CategoryFieldValue_constraint"]: CategoryFieldValue_constraint;
	/** input type for incrementing numeric columns in table "CategoryFieldValue" */
["CategoryFieldValue_inc_input"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** input type for inserting data into table "CategoryFieldValue" */
["CategoryFieldValue_insert_input"]: {
		Business?: GraphQLTypes["Business_obj_rel_insert_input"] | undefined,
	CategoryField?: GraphQLTypes["CategoryField_obj_rel_insert_input"] | undefined,
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	value?: string | undefined
};
	/** aggregate max on columns */
["CategoryFieldValue_max_fields"]: {
	__typename: "CategoryFieldValue_max_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	value?: string | undefined
};
	/** order by max() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_max_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined,
	value?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["CategoryFieldValue_min_fields"]: {
	__typename: "CategoryFieldValue_min_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	value?: string | undefined
};
	/** order by min() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_min_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined,
	value?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "CategoryFieldValue" */
["CategoryFieldValue_mutation_response"]: {
	__typename: "CategoryFieldValue_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["CategoryFieldValue"]>
};
	/** on_conflict condition type for table "CategoryFieldValue" */
["CategoryFieldValue_on_conflict"]: {
		constraint: GraphQLTypes["CategoryFieldValue_constraint"],
	update_columns: Array<GraphQLTypes["CategoryFieldValue_update_column"]>,
	where?: GraphQLTypes["CategoryFieldValue_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "CategoryFieldValue". */
["CategoryFieldValue_order_by"]: {
		Business?: GraphQLTypes["Business_order_by"] | undefined,
	CategoryField?: GraphQLTypes["CategoryField_order_by"] | undefined,
	businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined,
	value?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: CategoryFieldValue */
["CategoryFieldValue_pk_columns_input"]: {
		id: number
};
	/** select columns of table "CategoryFieldValue" */
["CategoryFieldValue_select_column"]: CategoryFieldValue_select_column;
	/** input type for updating data in table "CategoryFieldValue" */
["CategoryFieldValue_set_input"]: {
		businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	value?: string | undefined
};
	/** aggregate stddev on columns */
["CategoryFieldValue_stddev_fields"]: {
	__typename: "CategoryFieldValue_stddev_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["CategoryFieldValue_stddev_pop_fields"]: {
	__typename: "CategoryFieldValue_stddev_pop_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["CategoryFieldValue_stddev_samp_fields"]: {
	__typename: "CategoryFieldValue_stddev_samp_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_stddev_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["CategoryFieldValue_sum_fields"]: {
	__typename: "CategoryFieldValue_sum_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_sum_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "CategoryFieldValue" */
["CategoryFieldValue_update_column"]: CategoryFieldValue_update_column;
	/** aggregate var_pop on columns */
["CategoryFieldValue_var_pop_fields"]: {
	__typename: "CategoryFieldValue_var_pop_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_var_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["CategoryFieldValue_var_samp_fields"]: {
	__typename: "CategoryFieldValue_var_samp_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_var_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["CategoryFieldValue_variance_fields"]: {
	__typename: "CategoryFieldValue_variance_fields",
	businessId?: number | undefined,
	categoryFieldId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "CategoryFieldValue" */
["CategoryFieldValue_variance_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	categoryFieldId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregated selection of "CategoryField" */
["CategoryField_aggregate"]: {
	__typename: "CategoryField_aggregate",
	aggregate?: GraphQLTypes["CategoryField_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["CategoryField"]>
};
	/** aggregate fields of "CategoryField" */
["CategoryField_aggregate_fields"]: {
	__typename: "CategoryField_aggregate_fields",
	avg?: GraphQLTypes["CategoryField_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["CategoryField_max_fields"] | undefined,
	min?: GraphQLTypes["CategoryField_min_fields"] | undefined,
	stddev?: GraphQLTypes["CategoryField_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["CategoryField_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["CategoryField_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["CategoryField_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["CategoryField_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["CategoryField_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["CategoryField_variance_fields"] | undefined
};
	/** order by aggregate values of table "CategoryField" */
["CategoryField_aggregate_order_by"]: {
		avg?: GraphQLTypes["CategoryField_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["CategoryField_max_order_by"] | undefined,
	min?: GraphQLTypes["CategoryField_min_order_by"] | undefined,
	stddev?: GraphQLTypes["CategoryField_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["CategoryField_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["CategoryField_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["CategoryField_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["CategoryField_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["CategoryField_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["CategoryField_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "CategoryField" */
["CategoryField_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["CategoryField_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["CategoryField_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["CategoryField_avg_fields"]: {
	__typename: "CategoryField_avg_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by avg() on columns of table "CategoryField" */
["CategoryField_avg_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "CategoryField". All fields are combined with a logical 'AND'. */
["CategoryField_bool_exp"]: {
		Category?: GraphQLTypes["Category_bool_exp"] | undefined,
	CategoryFieldValues?: GraphQLTypes["CategoryFieldValue_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["CategoryField_bool_exp"]> | undefined,
	_not?: GraphQLTypes["CategoryField_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["CategoryField_bool_exp"]> | undefined,
	categoryId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	options?: GraphQLTypes["_text_comparison_exp"] | undefined,
	required?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
	type?: GraphQLTypes["FieldType_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "CategoryField" */
["CategoryField_constraint"]: CategoryField_constraint;
	/** input type for incrementing numeric columns in table "CategoryField" */
["CategoryField_inc_input"]: {
		categoryId?: number | undefined,
	id?: number | undefined
};
	/** input type for inserting data into table "CategoryField" */
["CategoryField_insert_input"]: {
		Category?: GraphQLTypes["Category_obj_rel_insert_input"] | undefined,
	CategoryFieldValues?: GraphQLTypes["CategoryFieldValue_arr_rel_insert_input"] | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	options?: GraphQLTypes["_text"] | undefined,
	required?: boolean | undefined,
	type?: GraphQLTypes["FieldType"] | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["CategoryField_max_fields"]: {
	__typename: "CategoryField_max_fields",
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	type?: GraphQLTypes["FieldType"] | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "CategoryField" */
["CategoryField_max_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	type?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["CategoryField_min_fields"]: {
	__typename: "CategoryField_min_fields",
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	type?: GraphQLTypes["FieldType"] | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "CategoryField" */
["CategoryField_min_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	type?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "CategoryField" */
["CategoryField_mutation_response"]: {
	__typename: "CategoryField_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["CategoryField"]>
};
	/** input type for inserting object relation for remote table "CategoryField" */
["CategoryField_obj_rel_insert_input"]: {
		data: GraphQLTypes["CategoryField_insert_input"],
	/** upsert condition */
	on_conflict?: GraphQLTypes["CategoryField_on_conflict"] | undefined
};
	/** on_conflict condition type for table "CategoryField" */
["CategoryField_on_conflict"]: {
		constraint: GraphQLTypes["CategoryField_constraint"],
	update_columns: Array<GraphQLTypes["CategoryField_update_column"]>,
	where?: GraphQLTypes["CategoryField_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "CategoryField". */
["CategoryField_order_by"]: {
		Category?: GraphQLTypes["Category_order_by"] | undefined,
	CategoryFieldValues_aggregate?: GraphQLTypes["CategoryFieldValue_aggregate_order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	options?: GraphQLTypes["order_by"] | undefined,
	required?: GraphQLTypes["order_by"] | undefined,
	type?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: CategoryField */
["CategoryField_pk_columns_input"]: {
		id: number
};
	/** select columns of table "CategoryField" */
["CategoryField_select_column"]: CategoryField_select_column;
	/** input type for updating data in table "CategoryField" */
["CategoryField_set_input"]: {
		categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	options?: GraphQLTypes["_text"] | undefined,
	required?: boolean | undefined,
	type?: GraphQLTypes["FieldType"] | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["CategoryField_stddev_fields"]: {
	__typename: "CategoryField_stddev_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev() on columns of table "CategoryField" */
["CategoryField_stddev_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["CategoryField_stddev_pop_fields"]: {
	__typename: "CategoryField_stddev_pop_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_pop() on columns of table "CategoryField" */
["CategoryField_stddev_pop_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["CategoryField_stddev_samp_fields"]: {
	__typename: "CategoryField_stddev_samp_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by stddev_samp() on columns of table "CategoryField" */
["CategoryField_stddev_samp_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["CategoryField_sum_fields"]: {
	__typename: "CategoryField_sum_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by sum() on columns of table "CategoryField" */
["CategoryField_sum_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "CategoryField" */
["CategoryField_update_column"]: CategoryField_update_column;
	/** aggregate var_pop on columns */
["CategoryField_var_pop_fields"]: {
	__typename: "CategoryField_var_pop_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_pop() on columns of table "CategoryField" */
["CategoryField_var_pop_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["CategoryField_var_samp_fields"]: {
	__typename: "CategoryField_var_samp_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by var_samp() on columns of table "CategoryField" */
["CategoryField_var_samp_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["CategoryField_variance_fields"]: {
	__typename: "CategoryField_variance_fields",
	categoryId?: number | undefined,
	id?: number | undefined
};
	/** order by variance() on columns of table "CategoryField" */
["CategoryField_variance_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined
};
	/** aggregated selection of "Category" */
["Category_aggregate"]: {
	__typename: "Category_aggregate",
	aggregate?: GraphQLTypes["Category_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Category"]>
};
	/** aggregate fields of "Category" */
["Category_aggregate_fields"]: {
	__typename: "Category_aggregate_fields",
	avg?: GraphQLTypes["Category_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Category_max_fields"] | undefined,
	min?: GraphQLTypes["Category_min_fields"] | undefined,
	stddev?: GraphQLTypes["Category_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Category_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Category_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Category_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Category_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Category_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Category_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["Category_avg_fields"]: {
	__typename: "Category_avg_fields",
	id?: number | undefined
};
	/** Boolean expression to filter rows from the table "Category". All fields are combined with a logical 'AND'. */
["Category_bool_exp"]: {
		BusinessCategories?: GraphQLTypes["BusinessCategory_bool_exp"] | undefined,
	CategoryFields?: GraphQLTypes["CategoryField_bool_exp"] | undefined,
	ProductCategories?: GraphQLTypes["ProductCategory_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["Category_bool_exp"]> | undefined,
	_not?: GraphQLTypes["Category_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["Category_bool_exp"]> | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	name?: GraphQLTypes["String_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "Category" */
["Category_constraint"]: Category_constraint;
	/** input type for incrementing numeric columns in table "Category" */
["Category_inc_input"]: {
		id?: number | undefined
};
	/** input type for inserting data into table "Category" */
["Category_insert_input"]: {
		BusinessCategories?: GraphQLTypes["BusinessCategory_arr_rel_insert_input"] | undefined,
	CategoryFields?: GraphQLTypes["CategoryField_arr_rel_insert_input"] | undefined,
	ProductCategories?: GraphQLTypes["ProductCategory_arr_rel_insert_input"] | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["Category_max_fields"]: {
	__typename: "Category_max_fields",
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate min on columns */
["Category_min_fields"]: {
	__typename: "Category_min_fields",
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** response of any mutation on the table "Category" */
["Category_mutation_response"]: {
	__typename: "Category_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Category"]>
};
	/** input type for inserting object relation for remote table "Category" */
["Category_obj_rel_insert_input"]: {
		data: GraphQLTypes["Category_insert_input"],
	/** upsert condition */
	on_conflict?: GraphQLTypes["Category_on_conflict"] | undefined
};
	/** on_conflict condition type for table "Category" */
["Category_on_conflict"]: {
		constraint: GraphQLTypes["Category_constraint"],
	update_columns: Array<GraphQLTypes["Category_update_column"]>,
	where?: GraphQLTypes["Category_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "Category". */
["Category_order_by"]: {
		BusinessCategories_aggregate?: GraphQLTypes["BusinessCategory_aggregate_order_by"] | undefined,
	CategoryFields_aggregate?: GraphQLTypes["CategoryField_aggregate_order_by"] | undefined,
	ProductCategories_aggregate?: GraphQLTypes["ProductCategory_aggregate_order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: Category */
["Category_pk_columns_input"]: {
		id: number
};
	/** select columns of table "Category" */
["Category_select_column"]: Category_select_column;
	/** input type for updating data in table "Category" */
["Category_set_input"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["Category_stddev_fields"]: {
	__typename: "Category_stddev_fields",
	id?: number | undefined
};
	/** aggregate stddev_pop on columns */
["Category_stddev_pop_fields"]: {
	__typename: "Category_stddev_pop_fields",
	id?: number | undefined
};
	/** aggregate stddev_samp on columns */
["Category_stddev_samp_fields"]: {
	__typename: "Category_stddev_samp_fields",
	id?: number | undefined
};
	/** aggregate sum on columns */
["Category_sum_fields"]: {
	__typename: "Category_sum_fields",
	id?: number | undefined
};
	/** update columns of table "Category" */
["Category_update_column"]: Category_update_column;
	/** aggregate var_pop on columns */
["Category_var_pop_fields"]: {
	__typename: "Category_var_pop_fields",
	id?: number | undefined
};
	/** aggregate var_samp on columns */
["Category_var_samp_fields"]: {
	__typename: "Category_var_samp_fields",
	id?: number | undefined
};
	/** aggregate variance on columns */
["Category_variance_fields"]: {
	__typename: "Category_variance_fields",
	id?: number | undefined
};
	/** columns and relationships of "City" */
["City"]: {
	__typename: "City",
	/** An array relationship */
	Businesses: Array<GraphQLTypes["Business"]>,
	/** An aggregate relationship */
	Businesses_aggregate: GraphQLTypes["Business_aggregate"],
	countryCode: string,
	countryId: number,
	createdAt: GraphQLTypes["timestamp"],
	flag: number,
	id: number,
	latitude: GraphQLTypes["numeric"],
	longitude: GraphQLTypes["numeric"],
	name: string,
	stateCode: string,
	stateId: number,
	updatedAt: GraphQLTypes["timestamp"],
	wikiDataId: string
};
	/** aggregated selection of "City" */
["City_aggregate"]: {
	__typename: "City_aggregate",
	aggregate?: GraphQLTypes["City_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["City"]>
};
	/** aggregate fields of "City" */
["City_aggregate_fields"]: {
	__typename: "City_aggregate_fields",
	avg?: GraphQLTypes["City_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["City_max_fields"] | undefined,
	min?: GraphQLTypes["City_min_fields"] | undefined,
	stddev?: GraphQLTypes["City_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["City_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["City_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["City_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["City_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["City_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["City_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["City_avg_fields"]: {
	__typename: "City_avg_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** Boolean expression to filter rows from the table "City". All fields are combined with a logical 'AND'. */
["City_bool_exp"]: {
		Businesses?: GraphQLTypes["Business_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["City_bool_exp"]> | undefined,
	_not?: GraphQLTypes["City_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["City_bool_exp"]> | undefined,
	countryCode?: GraphQLTypes["String_comparison_exp"] | undefined,
	countryId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	flag?: GraphQLTypes["Int_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	latitude?: GraphQLTypes["numeric_comparison_exp"] | undefined,
	longitude?: GraphQLTypes["numeric_comparison_exp"] | undefined,
	name?: GraphQLTypes["String_comparison_exp"] | undefined,
	stateCode?: GraphQLTypes["String_comparison_exp"] | undefined,
	stateId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	wikiDataId?: GraphQLTypes["String_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "City" */
["City_constraint"]: City_constraint;
	/** input type for incrementing numeric columns in table "City" */
["City_inc_input"]: {
		countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	stateId?: number | undefined
};
	/** input type for inserting data into table "City" */
["City_insert_input"]: {
		Businesses?: GraphQLTypes["Business_arr_rel_insert_input"] | undefined,
	countryCode?: string | undefined,
	countryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	name?: string | undefined,
	stateCode?: string | undefined,
	stateId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	wikiDataId?: string | undefined
};
	/** aggregate max on columns */
["City_max_fields"]: {
	__typename: "City_max_fields",
	countryCode?: string | undefined,
	countryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	name?: string | undefined,
	stateCode?: string | undefined,
	stateId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	wikiDataId?: string | undefined
};
	/** aggregate min on columns */
["City_min_fields"]: {
	__typename: "City_min_fields",
	countryCode?: string | undefined,
	countryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	name?: string | undefined,
	stateCode?: string | undefined,
	stateId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	wikiDataId?: string | undefined
};
	/** response of any mutation on the table "City" */
["City_mutation_response"]: {
	__typename: "City_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["City"]>
};
	/** input type for inserting object relation for remote table "City" */
["City_obj_rel_insert_input"]: {
		data: GraphQLTypes["City_insert_input"],
	/** upsert condition */
	on_conflict?: GraphQLTypes["City_on_conflict"] | undefined
};
	/** on_conflict condition type for table "City" */
["City_on_conflict"]: {
		constraint: GraphQLTypes["City_constraint"],
	update_columns: Array<GraphQLTypes["City_update_column"]>,
	where?: GraphQLTypes["City_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "City". */
["City_order_by"]: {
		Businesses_aggregate?: GraphQLTypes["Business_aggregate_order_by"] | undefined,
	countryCode?: GraphQLTypes["order_by"] | undefined,
	countryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	flag?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	latitude?: GraphQLTypes["order_by"] | undefined,
	longitude?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	stateCode?: GraphQLTypes["order_by"] | undefined,
	stateId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined,
	wikiDataId?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: City */
["City_pk_columns_input"]: {
		id: number
};
	/** select columns of table "City" */
["City_select_column"]: City_select_column;
	/** input type for updating data in table "City" */
["City_set_input"]: {
		countryCode?: string | undefined,
	countryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	name?: string | undefined,
	stateCode?: string | undefined,
	stateId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined,
	wikiDataId?: string | undefined
};
	/** aggregate stddev on columns */
["City_stddev_fields"]: {
	__typename: "City_stddev_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate stddev_pop on columns */
["City_stddev_pop_fields"]: {
	__typename: "City_stddev_pop_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate stddev_samp on columns */
["City_stddev_samp_fields"]: {
	__typename: "City_stddev_samp_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate sum on columns */
["City_sum_fields"]: {
	__typename: "City_sum_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: GraphQLTypes["numeric"] | undefined,
	longitude?: GraphQLTypes["numeric"] | undefined,
	stateId?: number | undefined
};
	/** update columns of table "City" */
["City_update_column"]: City_update_column;
	/** aggregate var_pop on columns */
["City_var_pop_fields"]: {
	__typename: "City_var_pop_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate var_samp on columns */
["City_var_samp_fields"]: {
	__typename: "City_var_samp_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	/** aggregate variance on columns */
["City_variance_fields"]: {
	__typename: "City_variance_fields",
	countryId?: number | undefined,
	flag?: number | undefined,
	id?: number | undefined,
	latitude?: number | undefined,
	longitude?: number | undefined,
	stateId?: number | undefined
};
	["Duty"]: any;
	/** Boolean expression to compare columns of type "Duty". All fields are combined with logical 'AND'. */
["Duty_comparison_exp"]: {
		_eq?: GraphQLTypes["Duty"] | undefined,
	_gt?: GraphQLTypes["Duty"] | undefined,
	_gte?: GraphQLTypes["Duty"] | undefined,
	_in?: Array<GraphQLTypes["Duty"]> | undefined,
	_is_null?: boolean | undefined,
	_lt?: GraphQLTypes["Duty"] | undefined,
	_lte?: GraphQLTypes["Duty"] | undefined,
	_neq?: GraphQLTypes["Duty"] | undefined,
	_nin?: Array<GraphQLTypes["Duty"]> | undefined
};
	["FieldType"]: any;
	/** Boolean expression to compare columns of type "FieldType". All fields are combined with logical 'AND'. */
["FieldType_comparison_exp"]: {
		_eq?: GraphQLTypes["FieldType"] | undefined,
	_gt?: GraphQLTypes["FieldType"] | undefined,
	_gte?: GraphQLTypes["FieldType"] | undefined,
	_in?: Array<GraphQLTypes["FieldType"]> | undefined,
	_is_null?: boolean | undefined,
	_lt?: GraphQLTypes["FieldType"] | undefined,
	_lte?: GraphQLTypes["FieldType"] | undefined,
	_neq?: GraphQLTypes["FieldType"] | undefined,
	_nin?: Array<GraphQLTypes["FieldType"]> | undefined
};
	/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
["Int_comparison_exp"]: {
		_eq?: number | undefined,
	_gt?: number | undefined,
	_gte?: number | undefined,
	_in?: Array<number> | undefined,
	_is_null?: boolean | undefined,
	_lt?: number | undefined,
	_lte?: number | undefined,
	_neq?: number | undefined,
	_nin?: Array<number> | undefined
};
	/** columns and relationships of "Product" */
["Product"]: {
	__typename: "Product",
	/** An object relationship */
	Business: GraphQLTypes["Business"],
	ImagesUrls?: GraphQLTypes["_text"] | undefined,
	/** An array relationship */
	ProductCategories: Array<GraphQLTypes["ProductCategory"]>,
	/** An aggregate relationship */
	ProductCategories_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	businessId: number,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	mainImageUrl: string,
	name: string,
	price: number,
	quota: number,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** columns and relationships of "ProductCategory" */
["ProductCategory"]: {
	__typename: "ProductCategory",
	/** An object relationship */
	Category?: GraphQLTypes["Category"] | undefined,
	/** An object relationship */
	Product?: GraphQLTypes["Product"] | undefined,
	categoryId?: number | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	productId?: number | undefined,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "ProductCategory" */
["ProductCategory_aggregate"]: {
	__typename: "ProductCategory_aggregate",
	aggregate?: GraphQLTypes["ProductCategory_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["ProductCategory"]>
};
	/** aggregate fields of "ProductCategory" */
["ProductCategory_aggregate_fields"]: {
	__typename: "ProductCategory_aggregate_fields",
	avg?: GraphQLTypes["ProductCategory_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["ProductCategory_max_fields"] | undefined,
	min?: GraphQLTypes["ProductCategory_min_fields"] | undefined,
	stddev?: GraphQLTypes["ProductCategory_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["ProductCategory_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["ProductCategory_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["ProductCategory_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["ProductCategory_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["ProductCategory_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["ProductCategory_variance_fields"] | undefined
};
	/** order by aggregate values of table "ProductCategory" */
["ProductCategory_aggregate_order_by"]: {
		avg?: GraphQLTypes["ProductCategory_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["ProductCategory_max_order_by"] | undefined,
	min?: GraphQLTypes["ProductCategory_min_order_by"] | undefined,
	stddev?: GraphQLTypes["ProductCategory_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["ProductCategory_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["ProductCategory_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["ProductCategory_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["ProductCategory_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["ProductCategory_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["ProductCategory_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "ProductCategory" */
["ProductCategory_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["ProductCategory_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["ProductCategory_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["ProductCategory_avg_fields"]: {
	__typename: "ProductCategory_avg_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by avg() on columns of table "ProductCategory" */
["ProductCategory_avg_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "ProductCategory". All fields are combined with a logical 'AND'. */
["ProductCategory_bool_exp"]: {
		Category?: GraphQLTypes["Category_bool_exp"] | undefined,
	Product?: GraphQLTypes["Product_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["ProductCategory_bool_exp"]> | undefined,
	_not?: GraphQLTypes["ProductCategory_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["ProductCategory_bool_exp"]> | undefined,
	categoryId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	productId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "ProductCategory" */
["ProductCategory_constraint"]: ProductCategory_constraint;
	/** input type for incrementing numeric columns in table "ProductCategory" */
["ProductCategory_inc_input"]: {
		categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** input type for inserting data into table "ProductCategory" */
["ProductCategory_insert_input"]: {
		Category?: GraphQLTypes["Category_obj_rel_insert_input"] | undefined,
	Product?: GraphQLTypes["Product_obj_rel_insert_input"] | undefined,
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	productId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["ProductCategory_max_fields"]: {
	__typename: "ProductCategory_max_fields",
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	productId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "ProductCategory" */
["ProductCategory_max_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["ProductCategory_min_fields"]: {
	__typename: "ProductCategory_min_fields",
	categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	productId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "ProductCategory" */
["ProductCategory_min_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "ProductCategory" */
["ProductCategory_mutation_response"]: {
	__typename: "ProductCategory_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["ProductCategory"]>
};
	/** on_conflict condition type for table "ProductCategory" */
["ProductCategory_on_conflict"]: {
		constraint: GraphQLTypes["ProductCategory_constraint"],
	update_columns: Array<GraphQLTypes["ProductCategory_update_column"]>,
	where?: GraphQLTypes["ProductCategory_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "ProductCategory". */
["ProductCategory_order_by"]: {
		Category?: GraphQLTypes["Category_order_by"] | undefined,
	Product?: GraphQLTypes["Product_order_by"] | undefined,
	categoryId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: ProductCategory */
["ProductCategory_pk_columns_input"]: {
		id: number
};
	/** select columns of table "ProductCategory" */
["ProductCategory_select_column"]: ProductCategory_select_column;
	/** input type for updating data in table "ProductCategory" */
["ProductCategory_set_input"]: {
		categoryId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	productId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["ProductCategory_stddev_fields"]: {
	__typename: "ProductCategory_stddev_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by stddev() on columns of table "ProductCategory" */
["ProductCategory_stddev_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["ProductCategory_stddev_pop_fields"]: {
	__typename: "ProductCategory_stddev_pop_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by stddev_pop() on columns of table "ProductCategory" */
["ProductCategory_stddev_pop_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["ProductCategory_stddev_samp_fields"]: {
	__typename: "ProductCategory_stddev_samp_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by stddev_samp() on columns of table "ProductCategory" */
["ProductCategory_stddev_samp_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["ProductCategory_sum_fields"]: {
	__typename: "ProductCategory_sum_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by sum() on columns of table "ProductCategory" */
["ProductCategory_sum_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "ProductCategory" */
["ProductCategory_update_column"]: ProductCategory_update_column;
	/** aggregate var_pop on columns */
["ProductCategory_var_pop_fields"]: {
	__typename: "ProductCategory_var_pop_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by var_pop() on columns of table "ProductCategory" */
["ProductCategory_var_pop_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["ProductCategory_var_samp_fields"]: {
	__typename: "ProductCategory_var_samp_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by var_samp() on columns of table "ProductCategory" */
["ProductCategory_var_samp_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["ProductCategory_variance_fields"]: {
	__typename: "ProductCategory_variance_fields",
	categoryId?: number | undefined,
	id?: number | undefined,
	productId?: number | undefined
};
	/** order by variance() on columns of table "ProductCategory" */
["ProductCategory_variance_order_by"]: {
		categoryId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	productId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregated selection of "Product" */
["Product_aggregate"]: {
	__typename: "Product_aggregate",
	aggregate?: GraphQLTypes["Product_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Product"]>
};
	/** aggregate fields of "Product" */
["Product_aggregate_fields"]: {
	__typename: "Product_aggregate_fields",
	avg?: GraphQLTypes["Product_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Product_max_fields"] | undefined,
	min?: GraphQLTypes["Product_min_fields"] | undefined,
	stddev?: GraphQLTypes["Product_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Product_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Product_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Product_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Product_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Product_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Product_variance_fields"] | undefined
};
	/** order by aggregate values of table "Product" */
["Product_aggregate_order_by"]: {
		avg?: GraphQLTypes["Product_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["Product_max_order_by"] | undefined,
	min?: GraphQLTypes["Product_min_order_by"] | undefined,
	stddev?: GraphQLTypes["Product_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["Product_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["Product_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["Product_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["Product_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["Product_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["Product_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "Product" */
["Product_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["Product_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["Product_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["Product_avg_fields"]: {
	__typename: "Product_avg_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by avg() on columns of table "Product" */
["Product_avg_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "Product". All fields are combined with a logical 'AND'. */
["Product_bool_exp"]: {
		Business?: GraphQLTypes["Business_bool_exp"] | undefined,
	ImagesUrls?: GraphQLTypes["_text_comparison_exp"] | undefined,
	ProductCategories?: GraphQLTypes["ProductCategory_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["Product_bool_exp"]> | undefined,
	_not?: GraphQLTypes["Product_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["Product_bool_exp"]> | undefined,
	businessId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	mainImageUrl?: GraphQLTypes["String_comparison_exp"] | undefined,
	name?: GraphQLTypes["String_comparison_exp"] | undefined,
	price?: GraphQLTypes["Int_comparison_exp"] | undefined,
	quota?: GraphQLTypes["Int_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "Product" */
["Product_constraint"]: Product_constraint;
	/** input type for incrementing numeric columns in table "Product" */
["Product_inc_input"]: {
		businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** input type for inserting data into table "Product" */
["Product_insert_input"]: {
		Business?: GraphQLTypes["Business_obj_rel_insert_input"] | undefined,
	ImagesUrls?: GraphQLTypes["_text"] | undefined,
	ProductCategories?: GraphQLTypes["ProductCategory_arr_rel_insert_input"] | undefined,
	businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	mainImageUrl?: string | undefined,
	name?: string | undefined,
	price?: number | undefined,
	quota?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["Product_max_fields"]: {
	__typename: "Product_max_fields",
	businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	mainImageUrl?: string | undefined,
	name?: string | undefined,
	price?: number | undefined,
	quota?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "Product" */
["Product_max_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	mainImageUrl?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["Product_min_fields"]: {
	__typename: "Product_min_fields",
	businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	mainImageUrl?: string | undefined,
	name?: string | undefined,
	price?: number | undefined,
	quota?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "Product" */
["Product_min_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	mainImageUrl?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "Product" */
["Product_mutation_response"]: {
	__typename: "Product_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Product"]>
};
	/** input type for inserting object relation for remote table "Product" */
["Product_obj_rel_insert_input"]: {
		data: GraphQLTypes["Product_insert_input"],
	/** upsert condition */
	on_conflict?: GraphQLTypes["Product_on_conflict"] | undefined
};
	/** on_conflict condition type for table "Product" */
["Product_on_conflict"]: {
		constraint: GraphQLTypes["Product_constraint"],
	update_columns: Array<GraphQLTypes["Product_update_column"]>,
	where?: GraphQLTypes["Product_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "Product". */
["Product_order_by"]: {
		Business?: GraphQLTypes["Business_order_by"] | undefined,
	ImagesUrls?: GraphQLTypes["order_by"] | undefined,
	ProductCategories_aggregate?: GraphQLTypes["ProductCategory_aggregate_order_by"] | undefined,
	businessId?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	mainImageUrl?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: Product */
["Product_pk_columns_input"]: {
		id: number
};
	/** select columns of table "Product" */
["Product_select_column"]: Product_select_column;
	/** input type for updating data in table "Product" */
["Product_set_input"]: {
		ImagesUrls?: GraphQLTypes["_text"] | undefined,
	businessId?: number | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	mainImageUrl?: string | undefined,
	name?: string | undefined,
	price?: number | undefined,
	quota?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["Product_stddev_fields"]: {
	__typename: "Product_stddev_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by stddev() on columns of table "Product" */
["Product_stddev_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["Product_stddev_pop_fields"]: {
	__typename: "Product_stddev_pop_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by stddev_pop() on columns of table "Product" */
["Product_stddev_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["Product_stddev_samp_fields"]: {
	__typename: "Product_stddev_samp_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by stddev_samp() on columns of table "Product" */
["Product_stddev_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["Product_sum_fields"]: {
	__typename: "Product_sum_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by sum() on columns of table "Product" */
["Product_sum_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "Product" */
["Product_update_column"]: Product_update_column;
	/** aggregate var_pop on columns */
["Product_var_pop_fields"]: {
	__typename: "Product_var_pop_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by var_pop() on columns of table "Product" */
["Product_var_pop_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["Product_var_samp_fields"]: {
	__typename: "Product_var_samp_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by var_samp() on columns of table "Product" */
["Product_var_samp_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["Product_variance_fields"]: {
	__typename: "Product_variance_fields",
	businessId?: number | undefined,
	id?: number | undefined,
	price?: number | undefined,
	quota?: number | undefined
};
	/** order by variance() on columns of table "Product" */
["Product_variance_order_by"]: {
		businessId?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	price?: GraphQLTypes["order_by"] | undefined,
	quota?: GraphQLTypes["order_by"] | undefined
};
	/** columns and relationships of "Profile" */
["Profile"]: {
	__typename: "Profile",
	/** An array relationship */
	BusinessWorkers: Array<GraphQLTypes["BusinessWorker"]>,
	/** An aggregate relationship */
	BusinessWorkers_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** An array relationship */
	RolesOfProfiles: Array<GraphQLTypes["RolesOfProfile"]>,
	/** An aggregate relationship */
	RolesOfProfiles_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	auth: string,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	name: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "Profile" */
["Profile_aggregate"]: {
	__typename: "Profile_aggregate",
	aggregate?: GraphQLTypes["Profile_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Profile"]>
};
	/** aggregate fields of "Profile" */
["Profile_aggregate_fields"]: {
	__typename: "Profile_aggregate_fields",
	avg?: GraphQLTypes["Profile_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Profile_max_fields"] | undefined,
	min?: GraphQLTypes["Profile_min_fields"] | undefined,
	stddev?: GraphQLTypes["Profile_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Profile_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Profile_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Profile_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Profile_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Profile_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Profile_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["Profile_avg_fields"]: {
	__typename: "Profile_avg_fields",
	id?: number | undefined
};
	/** Boolean expression to filter rows from the table "Profile". All fields are combined with a logical 'AND'. */
["Profile_bool_exp"]: {
		BusinessWorkers?: GraphQLTypes["BusinessWorker_bool_exp"] | undefined,
	RolesOfProfiles?: GraphQLTypes["RolesOfProfile_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["Profile_bool_exp"]> | undefined,
	_not?: GraphQLTypes["Profile_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["Profile_bool_exp"]> | undefined,
	auth?: GraphQLTypes["String_comparison_exp"] | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	name?: GraphQLTypes["String_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "Profile" */
["Profile_constraint"]: Profile_constraint;
	/** input type for incrementing numeric columns in table "Profile" */
["Profile_inc_input"]: {
		id?: number | undefined
};
	/** input type for inserting data into table "Profile" */
["Profile_insert_input"]: {
		BusinessWorkers?: GraphQLTypes["BusinessWorker_arr_rel_insert_input"] | undefined,
	RolesOfProfiles?: GraphQLTypes["RolesOfProfile_arr_rel_insert_input"] | undefined,
	auth?: string | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["Profile_max_fields"]: {
	__typename: "Profile_max_fields",
	auth?: string | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate min on columns */
["Profile_min_fields"]: {
	__typename: "Profile_min_fields",
	auth?: string | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** response of any mutation on the table "Profile" */
["Profile_mutation_response"]: {
	__typename: "Profile_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Profile"]>
};
	/** input type for inserting object relation for remote table "Profile" */
["Profile_obj_rel_insert_input"]: {
		data: GraphQLTypes["Profile_insert_input"],
	/** upsert condition */
	on_conflict?: GraphQLTypes["Profile_on_conflict"] | undefined
};
	/** on_conflict condition type for table "Profile" */
["Profile_on_conflict"]: {
		constraint: GraphQLTypes["Profile_constraint"],
	update_columns: Array<GraphQLTypes["Profile_update_column"]>,
	where?: GraphQLTypes["Profile_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "Profile". */
["Profile_order_by"]: {
		BusinessWorkers_aggregate?: GraphQLTypes["BusinessWorker_aggregate_order_by"] | undefined,
	RolesOfProfiles_aggregate?: GraphQLTypes["RolesOfProfile_aggregate_order_by"] | undefined,
	auth?: GraphQLTypes["order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	name?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: Profile */
["Profile_pk_columns_input"]: {
		id: number
};
	/** select columns of table "Profile" */
["Profile_select_column"]: Profile_select_column;
	/** input type for updating data in table "Profile" */
["Profile_set_input"]: {
		auth?: string | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	name?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["Profile_stddev_fields"]: {
	__typename: "Profile_stddev_fields",
	id?: number | undefined
};
	/** aggregate stddev_pop on columns */
["Profile_stddev_pop_fields"]: {
	__typename: "Profile_stddev_pop_fields",
	id?: number | undefined
};
	/** aggregate stddev_samp on columns */
["Profile_stddev_samp_fields"]: {
	__typename: "Profile_stddev_samp_fields",
	id?: number | undefined
};
	/** aggregate sum on columns */
["Profile_sum_fields"]: {
	__typename: "Profile_sum_fields",
	id?: number | undefined
};
	/** update columns of table "Profile" */
["Profile_update_column"]: Profile_update_column;
	/** aggregate var_pop on columns */
["Profile_var_pop_fields"]: {
	__typename: "Profile_var_pop_fields",
	id?: number | undefined
};
	/** aggregate var_samp on columns */
["Profile_var_samp_fields"]: {
	__typename: "Profile_var_samp_fields",
	id?: number | undefined
};
	/** aggregate variance on columns */
["Profile_variance_fields"]: {
	__typename: "Profile_variance_fields",
	id?: number | undefined
};
	/** columns and relationships of "Role" */
["Role"]: {
	__typename: "Role",
	/** An array relationship */
	RolesOfProfiles: Array<GraphQLTypes["RolesOfProfile"]>,
	/** An aggregate relationship */
	RolesOfProfiles_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	title: string,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "Role" */
["Role_aggregate"]: {
	__typename: "Role_aggregate",
	aggregate?: GraphQLTypes["Role_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["Role"]>
};
	/** aggregate fields of "Role" */
["Role_aggregate_fields"]: {
	__typename: "Role_aggregate_fields",
	avg?: GraphQLTypes["Role_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["Role_max_fields"] | undefined,
	min?: GraphQLTypes["Role_min_fields"] | undefined,
	stddev?: GraphQLTypes["Role_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["Role_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["Role_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["Role_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["Role_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["Role_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["Role_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["Role_avg_fields"]: {
	__typename: "Role_avg_fields",
	id?: number | undefined
};
	/** Boolean expression to filter rows from the table "Role". All fields are combined with a logical 'AND'. */
["Role_bool_exp"]: {
		RolesOfProfiles?: GraphQLTypes["RolesOfProfile_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["Role_bool_exp"]> | undefined,
	_not?: GraphQLTypes["Role_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["Role_bool_exp"]> | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	title?: GraphQLTypes["String_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "Role" */
["Role_constraint"]: Role_constraint;
	/** input type for incrementing numeric columns in table "Role" */
["Role_inc_input"]: {
		id?: number | undefined
};
	/** input type for inserting data into table "Role" */
["Role_insert_input"]: {
		RolesOfProfiles?: GraphQLTypes["RolesOfProfile_arr_rel_insert_input"] | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	title?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["Role_max_fields"]: {
	__typename: "Role_max_fields",
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	title?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate min on columns */
["Role_min_fields"]: {
	__typename: "Role_min_fields",
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	title?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** response of any mutation on the table "Role" */
["Role_mutation_response"]: {
	__typename: "Role_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["Role"]>
};
	/** input type for inserting object relation for remote table "Role" */
["Role_obj_rel_insert_input"]: {
		data: GraphQLTypes["Role_insert_input"],
	/** upsert condition */
	on_conflict?: GraphQLTypes["Role_on_conflict"] | undefined
};
	/** on_conflict condition type for table "Role" */
["Role_on_conflict"]: {
		constraint: GraphQLTypes["Role_constraint"],
	update_columns: Array<GraphQLTypes["Role_update_column"]>,
	where?: GraphQLTypes["Role_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "Role". */
["Role_order_by"]: {
		RolesOfProfiles_aggregate?: GraphQLTypes["RolesOfProfile_aggregate_order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	title?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: Role */
["Role_pk_columns_input"]: {
		id: number
};
	/** select columns of table "Role" */
["Role_select_column"]: Role_select_column;
	/** input type for updating data in table "Role" */
["Role_set_input"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	title?: string | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["Role_stddev_fields"]: {
	__typename: "Role_stddev_fields",
	id?: number | undefined
};
	/** aggregate stddev_pop on columns */
["Role_stddev_pop_fields"]: {
	__typename: "Role_stddev_pop_fields",
	id?: number | undefined
};
	/** aggregate stddev_samp on columns */
["Role_stddev_samp_fields"]: {
	__typename: "Role_stddev_samp_fields",
	id?: number | undefined
};
	/** aggregate sum on columns */
["Role_sum_fields"]: {
	__typename: "Role_sum_fields",
	id?: number | undefined
};
	/** update columns of table "Role" */
["Role_update_column"]: Role_update_column;
	/** aggregate var_pop on columns */
["Role_var_pop_fields"]: {
	__typename: "Role_var_pop_fields",
	id?: number | undefined
};
	/** aggregate var_samp on columns */
["Role_var_samp_fields"]: {
	__typename: "Role_var_samp_fields",
	id?: number | undefined
};
	/** aggregate variance on columns */
["Role_variance_fields"]: {
	__typename: "Role_variance_fields",
	id?: number | undefined
};
	/** columns and relationships of "RolesOfProfile" */
["RolesOfProfile"]: {
	__typename: "RolesOfProfile",
	/** An object relationship */
	Profile?: GraphQLTypes["Profile"] | undefined,
	/** An object relationship */
	Role?: GraphQLTypes["Role"] | undefined,
	createdAt: GraphQLTypes["timestamp"],
	id: number,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt: GraphQLTypes["timestamp"]
};
	/** aggregated selection of "RolesOfProfile" */
["RolesOfProfile_aggregate"]: {
	__typename: "RolesOfProfile_aggregate",
	aggregate?: GraphQLTypes["RolesOfProfile_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["RolesOfProfile"]>
};
	/** aggregate fields of "RolesOfProfile" */
["RolesOfProfile_aggregate_fields"]: {
	__typename: "RolesOfProfile_aggregate_fields",
	avg?: GraphQLTypes["RolesOfProfile_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["RolesOfProfile_max_fields"] | undefined,
	min?: GraphQLTypes["RolesOfProfile_min_fields"] | undefined,
	stddev?: GraphQLTypes["RolesOfProfile_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["RolesOfProfile_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["RolesOfProfile_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["RolesOfProfile_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["RolesOfProfile_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["RolesOfProfile_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["RolesOfProfile_variance_fields"] | undefined
};
	/** order by aggregate values of table "RolesOfProfile" */
["RolesOfProfile_aggregate_order_by"]: {
		avg?: GraphQLTypes["RolesOfProfile_avg_order_by"] | undefined,
	count?: GraphQLTypes["order_by"] | undefined,
	max?: GraphQLTypes["RolesOfProfile_max_order_by"] | undefined,
	min?: GraphQLTypes["RolesOfProfile_min_order_by"] | undefined,
	stddev?: GraphQLTypes["RolesOfProfile_stddev_order_by"] | undefined,
	stddev_pop?: GraphQLTypes["RolesOfProfile_stddev_pop_order_by"] | undefined,
	stddev_samp?: GraphQLTypes["RolesOfProfile_stddev_samp_order_by"] | undefined,
	sum?: GraphQLTypes["RolesOfProfile_sum_order_by"] | undefined,
	var_pop?: GraphQLTypes["RolesOfProfile_var_pop_order_by"] | undefined,
	var_samp?: GraphQLTypes["RolesOfProfile_var_samp_order_by"] | undefined,
	variance?: GraphQLTypes["RolesOfProfile_variance_order_by"] | undefined
};
	/** input type for inserting array relation for remote table "RolesOfProfile" */
["RolesOfProfile_arr_rel_insert_input"]: {
		data: Array<GraphQLTypes["RolesOfProfile_insert_input"]>,
	/** upsert condition */
	on_conflict?: GraphQLTypes["RolesOfProfile_on_conflict"] | undefined
};
	/** aggregate avg on columns */
["RolesOfProfile_avg_fields"]: {
	__typename: "RolesOfProfile_avg_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by avg() on columns of table "RolesOfProfile" */
["RolesOfProfile_avg_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to filter rows from the table "RolesOfProfile". All fields are combined with a logical 'AND'. */
["RolesOfProfile_bool_exp"]: {
		Profile?: GraphQLTypes["Profile_bool_exp"] | undefined,
	Role?: GraphQLTypes["Role_bool_exp"] | undefined,
	_and?: Array<GraphQLTypes["RolesOfProfile_bool_exp"]> | undefined,
	_not?: GraphQLTypes["RolesOfProfile_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["RolesOfProfile_bool_exp"]> | undefined,
	createdAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
	id?: GraphQLTypes["Int_comparison_exp"] | undefined,
	profileId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	roleId?: GraphQLTypes["Int_comparison_exp"] | undefined,
	updatedAt?: GraphQLTypes["timestamp_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "RolesOfProfile" */
["RolesOfProfile_constraint"]: RolesOfProfile_constraint;
	/** input type for incrementing numeric columns in table "RolesOfProfile" */
["RolesOfProfile_inc_input"]: {
		id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** input type for inserting data into table "RolesOfProfile" */
["RolesOfProfile_insert_input"]: {
		Profile?: GraphQLTypes["Profile_obj_rel_insert_input"] | undefined,
	Role?: GraphQLTypes["Role_obj_rel_insert_input"] | undefined,
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate max on columns */
["RolesOfProfile_max_fields"]: {
	__typename: "RolesOfProfile_max_fields",
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by max() on columns of table "RolesOfProfile" */
["RolesOfProfile_max_order_by"]: {
		createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate min on columns */
["RolesOfProfile_min_fields"]: {
	__typename: "RolesOfProfile_min_fields",
	createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** order by min() on columns of table "RolesOfProfile" */
["RolesOfProfile_min_order_by"]: {
		createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** response of any mutation on the table "RolesOfProfile" */
["RolesOfProfile_mutation_response"]: {
	__typename: "RolesOfProfile_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["RolesOfProfile"]>
};
	/** on_conflict condition type for table "RolesOfProfile" */
["RolesOfProfile_on_conflict"]: {
		constraint: GraphQLTypes["RolesOfProfile_constraint"],
	update_columns: Array<GraphQLTypes["RolesOfProfile_update_column"]>,
	where?: GraphQLTypes["RolesOfProfile_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "RolesOfProfile". */
["RolesOfProfile_order_by"]: {
		Profile?: GraphQLTypes["Profile_order_by"] | undefined,
	Role?: GraphQLTypes["Role_order_by"] | undefined,
	createdAt?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined,
	updatedAt?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: RolesOfProfile */
["RolesOfProfile_pk_columns_input"]: {
		id: number
};
	/** select columns of table "RolesOfProfile" */
["RolesOfProfile_select_column"]: RolesOfProfile_select_column;
	/** input type for updating data in table "RolesOfProfile" */
["RolesOfProfile_set_input"]: {
		createdAt?: GraphQLTypes["timestamp"] | undefined,
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined,
	updatedAt?: GraphQLTypes["timestamp"] | undefined
};
	/** aggregate stddev on columns */
["RolesOfProfile_stddev_fields"]: {
	__typename: "RolesOfProfile_stddev_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by stddev() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_pop on columns */
["RolesOfProfile_stddev_pop_fields"]: {
	__typename: "RolesOfProfile_stddev_pop_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by stddev_pop() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_pop_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate stddev_samp on columns */
["RolesOfProfile_stddev_samp_fields"]: {
	__typename: "RolesOfProfile_stddev_samp_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by stddev_samp() on columns of table "RolesOfProfile" */
["RolesOfProfile_stddev_samp_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate sum on columns */
["RolesOfProfile_sum_fields"]: {
	__typename: "RolesOfProfile_sum_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by sum() on columns of table "RolesOfProfile" */
["RolesOfProfile_sum_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** update columns of table "RolesOfProfile" */
["RolesOfProfile_update_column"]: RolesOfProfile_update_column;
	/** aggregate var_pop on columns */
["RolesOfProfile_var_pop_fields"]: {
	__typename: "RolesOfProfile_var_pop_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by var_pop() on columns of table "RolesOfProfile" */
["RolesOfProfile_var_pop_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate var_samp on columns */
["RolesOfProfile_var_samp_fields"]: {
	__typename: "RolesOfProfile_var_samp_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by var_samp() on columns of table "RolesOfProfile" */
["RolesOfProfile_var_samp_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** aggregate variance on columns */
["RolesOfProfile_variance_fields"]: {
	__typename: "RolesOfProfile_variance_fields",
	id?: number | undefined,
	profileId?: number | undefined,
	roleId?: number | undefined
};
	/** order by variance() on columns of table "RolesOfProfile" */
["RolesOfProfile_variance_order_by"]: {
		id?: GraphQLTypes["order_by"] | undefined,
	profileId?: GraphQLTypes["order_by"] | undefined,
	roleId?: GraphQLTypes["order_by"] | undefined
};
	/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
["String_comparison_exp"]: {
		_eq?: string | undefined,
	_gt?: string | undefined,
	_gte?: string | undefined,
	/** does the column match the given case-insensitive pattern */
	_ilike?: string | undefined,
	_in?: Array<string> | undefined,
	/** does the column match the given POSIX regular expression, case insensitive */
	_iregex?: string | undefined,
	_is_null?: boolean | undefined,
	/** does the column match the given pattern */
	_like?: string | undefined,
	_lt?: string | undefined,
	_lte?: string | undefined,
	_neq?: string | undefined,
	/** does the column NOT match the given case-insensitive pattern */
	_nilike?: string | undefined,
	_nin?: Array<string> | undefined,
	/** does the column NOT match the given POSIX regular expression, case insensitive */
	_niregex?: string | undefined,
	/** does the column NOT match the given pattern */
	_nlike?: string | undefined,
	/** does the column NOT match the given POSIX regular expression, case sensitive */
	_nregex?: string | undefined,
	/** does the column NOT match the given SQL regular expression */
	_nsimilar?: string | undefined,
	/** does the column match the given POSIX regular expression, case sensitive */
	_regex?: string | undefined,
	/** does the column match the given SQL regular expression */
	_similar?: string | undefined
};
	/** columns and relationships of "_prisma_migrations" */
["_prisma_migrations"]: {
	__typename: "_prisma_migrations",
	applied_steps_count: number,
	checksum: string,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id: string,
	logs?: string | undefined,
	migration_name: string,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at: GraphQLTypes["timestamptz"]
};
	/** aggregated selection of "_prisma_migrations" */
["_prisma_migrations_aggregate"]: {
	__typename: "_prisma_migrations_aggregate",
	aggregate?: GraphQLTypes["_prisma_migrations_aggregate_fields"] | undefined,
	nodes: Array<GraphQLTypes["_prisma_migrations"]>
};
	/** aggregate fields of "_prisma_migrations" */
["_prisma_migrations_aggregate_fields"]: {
	__typename: "_prisma_migrations_aggregate_fields",
	avg?: GraphQLTypes["_prisma_migrations_avg_fields"] | undefined,
	count: number,
	max?: GraphQLTypes["_prisma_migrations_max_fields"] | undefined,
	min?: GraphQLTypes["_prisma_migrations_min_fields"] | undefined,
	stddev?: GraphQLTypes["_prisma_migrations_stddev_fields"] | undefined,
	stddev_pop?: GraphQLTypes["_prisma_migrations_stddev_pop_fields"] | undefined,
	stddev_samp?: GraphQLTypes["_prisma_migrations_stddev_samp_fields"] | undefined,
	sum?: GraphQLTypes["_prisma_migrations_sum_fields"] | undefined,
	var_pop?: GraphQLTypes["_prisma_migrations_var_pop_fields"] | undefined,
	var_samp?: GraphQLTypes["_prisma_migrations_var_samp_fields"] | undefined,
	variance?: GraphQLTypes["_prisma_migrations_variance_fields"] | undefined
};
	/** aggregate avg on columns */
["_prisma_migrations_avg_fields"]: {
	__typename: "_prisma_migrations_avg_fields",
	applied_steps_count?: number | undefined
};
	/** Boolean expression to filter rows from the table "_prisma_migrations". All fields are combined with a logical 'AND'. */
["_prisma_migrations_bool_exp"]: {
		_and?: Array<GraphQLTypes["_prisma_migrations_bool_exp"]> | undefined,
	_not?: GraphQLTypes["_prisma_migrations_bool_exp"] | undefined,
	_or?: Array<GraphQLTypes["_prisma_migrations_bool_exp"]> | undefined,
	applied_steps_count?: GraphQLTypes["Int_comparison_exp"] | undefined,
	checksum?: GraphQLTypes["String_comparison_exp"] | undefined,
	finished_at?: GraphQLTypes["timestamptz_comparison_exp"] | undefined,
	id?: GraphQLTypes["String_comparison_exp"] | undefined,
	logs?: GraphQLTypes["String_comparison_exp"] | undefined,
	migration_name?: GraphQLTypes["String_comparison_exp"] | undefined,
	rolled_back_at?: GraphQLTypes["timestamptz_comparison_exp"] | undefined,
	started_at?: GraphQLTypes["timestamptz_comparison_exp"] | undefined
};
	/** unique or primary key constraints on table "_prisma_migrations" */
["_prisma_migrations_constraint"]: _prisma_migrations_constraint;
	/** input type for incrementing numeric columns in table "_prisma_migrations" */
["_prisma_migrations_inc_input"]: {
		applied_steps_count?: number | undefined
};
	/** input type for inserting data into table "_prisma_migrations" */
["_prisma_migrations_insert_input"]: {
		applied_steps_count?: number | undefined,
	checksum?: string | undefined,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id?: string | undefined,
	logs?: string | undefined,
	migration_name?: string | undefined,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at?: GraphQLTypes["timestamptz"] | undefined
};
	/** aggregate max on columns */
["_prisma_migrations_max_fields"]: {
	__typename: "_prisma_migrations_max_fields",
	applied_steps_count?: number | undefined,
	checksum?: string | undefined,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id?: string | undefined,
	logs?: string | undefined,
	migration_name?: string | undefined,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at?: GraphQLTypes["timestamptz"] | undefined
};
	/** aggregate min on columns */
["_prisma_migrations_min_fields"]: {
	__typename: "_prisma_migrations_min_fields",
	applied_steps_count?: number | undefined,
	checksum?: string | undefined,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id?: string | undefined,
	logs?: string | undefined,
	migration_name?: string | undefined,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at?: GraphQLTypes["timestamptz"] | undefined
};
	/** response of any mutation on the table "_prisma_migrations" */
["_prisma_migrations_mutation_response"]: {
	__typename: "_prisma_migrations_mutation_response",
	/** number of rows affected by the mutation */
	affected_rows: number,
	/** data from the rows affected by the mutation */
	returning: Array<GraphQLTypes["_prisma_migrations"]>
};
	/** on_conflict condition type for table "_prisma_migrations" */
["_prisma_migrations_on_conflict"]: {
		constraint: GraphQLTypes["_prisma_migrations_constraint"],
	update_columns: Array<GraphQLTypes["_prisma_migrations_update_column"]>,
	where?: GraphQLTypes["_prisma_migrations_bool_exp"] | undefined
};
	/** Ordering options when selecting data from "_prisma_migrations". */
["_prisma_migrations_order_by"]: {
		applied_steps_count?: GraphQLTypes["order_by"] | undefined,
	checksum?: GraphQLTypes["order_by"] | undefined,
	finished_at?: GraphQLTypes["order_by"] | undefined,
	id?: GraphQLTypes["order_by"] | undefined,
	logs?: GraphQLTypes["order_by"] | undefined,
	migration_name?: GraphQLTypes["order_by"] | undefined,
	rolled_back_at?: GraphQLTypes["order_by"] | undefined,
	started_at?: GraphQLTypes["order_by"] | undefined
};
	/** primary key columns input for table: _prisma_migrations */
["_prisma_migrations_pk_columns_input"]: {
		id: string
};
	/** select columns of table "_prisma_migrations" */
["_prisma_migrations_select_column"]: _prisma_migrations_select_column;
	/** input type for updating data in table "_prisma_migrations" */
["_prisma_migrations_set_input"]: {
		applied_steps_count?: number | undefined,
	checksum?: string | undefined,
	finished_at?: GraphQLTypes["timestamptz"] | undefined,
	id?: string | undefined,
	logs?: string | undefined,
	migration_name?: string | undefined,
	rolled_back_at?: GraphQLTypes["timestamptz"] | undefined,
	started_at?: GraphQLTypes["timestamptz"] | undefined
};
	/** aggregate stddev on columns */
["_prisma_migrations_stddev_fields"]: {
	__typename: "_prisma_migrations_stddev_fields",
	applied_steps_count?: number | undefined
};
	/** aggregate stddev_pop on columns */
["_prisma_migrations_stddev_pop_fields"]: {
	__typename: "_prisma_migrations_stddev_pop_fields",
	applied_steps_count?: number | undefined
};
	/** aggregate stddev_samp on columns */
["_prisma_migrations_stddev_samp_fields"]: {
	__typename: "_prisma_migrations_stddev_samp_fields",
	applied_steps_count?: number | undefined
};
	/** aggregate sum on columns */
["_prisma_migrations_sum_fields"]: {
	__typename: "_prisma_migrations_sum_fields",
	applied_steps_count?: number | undefined
};
	/** update columns of table "_prisma_migrations" */
["_prisma_migrations_update_column"]: _prisma_migrations_update_column;
	/** aggregate var_pop on columns */
["_prisma_migrations_var_pop_fields"]: {
	__typename: "_prisma_migrations_var_pop_fields",
	applied_steps_count?: number | undefined
};
	/** aggregate var_samp on columns */
["_prisma_migrations_var_samp_fields"]: {
	__typename: "_prisma_migrations_var_samp_fields",
	applied_steps_count?: number | undefined
};
	/** aggregate variance on columns */
["_prisma_migrations_variance_fields"]: {
	__typename: "_prisma_migrations_variance_fields",
	applied_steps_count?: number | undefined
};
	["_text"]: any;
	/** Boolean expression to compare columns of type "_text". All fields are combined with logical 'AND'. */
["_text_comparison_exp"]: {
		_eq?: GraphQLTypes["_text"] | undefined,
	_gt?: GraphQLTypes["_text"] | undefined,
	_gte?: GraphQLTypes["_text"] | undefined,
	_in?: Array<GraphQLTypes["_text"]> | undefined,
	_is_null?: boolean | undefined,
	_lt?: GraphQLTypes["_text"] | undefined,
	_lte?: GraphQLTypes["_text"] | undefined,
	_neq?: GraphQLTypes["_text"] | undefined,
	_nin?: Array<GraphQLTypes["_text"]> | undefined
};
	/** mutation root */
["mutation_root"]: {
	__typename: "mutation_root",
	/** delete data from the table: "Business" */
	delete_Business?: GraphQLTypes["Business_mutation_response"] | undefined,
	/** delete data from the table: "BusinessCategory" */
	delete_BusinessCategory?: GraphQLTypes["BusinessCategory_mutation_response"] | undefined,
	/** delete single row from the table: "BusinessCategory" */
	delete_BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** delete data from the table: "BusinessWorker" */
	delete_BusinessWorker?: GraphQLTypes["BusinessWorker_mutation_response"] | undefined,
	/** delete single row from the table: "BusinessWorker" */
	delete_BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** delete single row from the table: "Business" */
	delete_Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** delete data from the table: "Category" */
	delete_Category?: GraphQLTypes["Category_mutation_response"] | undefined,
	/** delete data from the table: "CategoryField" */
	delete_CategoryField?: GraphQLTypes["CategoryField_mutation_response"] | undefined,
	/** delete data from the table: "CategoryFieldValue" */
	delete_CategoryFieldValue?: GraphQLTypes["CategoryFieldValue_mutation_response"] | undefined,
	/** delete single row from the table: "CategoryFieldValue" */
	delete_CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** delete single row from the table: "CategoryField" */
	delete_CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** delete single row from the table: "Category" */
	delete_Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** delete data from the table: "City" */
	delete_City?: GraphQLTypes["City_mutation_response"] | undefined,
	/** delete single row from the table: "City" */
	delete_City_by_pk?: GraphQLTypes["City"] | undefined,
	/** delete data from the table: "Product" */
	delete_Product?: GraphQLTypes["Product_mutation_response"] | undefined,
	/** delete data from the table: "ProductCategory" */
	delete_ProductCategory?: GraphQLTypes["ProductCategory_mutation_response"] | undefined,
	/** delete single row from the table: "ProductCategory" */
	delete_ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** delete single row from the table: "Product" */
	delete_Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** delete data from the table: "Profile" */
	delete_Profile?: GraphQLTypes["Profile_mutation_response"] | undefined,
	/** delete single row from the table: "Profile" */
	delete_Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** delete data from the table: "Role" */
	delete_Role?: GraphQLTypes["Role_mutation_response"] | undefined,
	/** delete single row from the table: "Role" */
	delete_Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** delete data from the table: "RolesOfProfile" */
	delete_RolesOfProfile?: GraphQLTypes["RolesOfProfile_mutation_response"] | undefined,
	/** delete single row from the table: "RolesOfProfile" */
	delete_RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** delete data from the table: "_prisma_migrations" */
	delete__prisma_migrations?: GraphQLTypes["_prisma_migrations_mutation_response"] | undefined,
	/** delete single row from the table: "_prisma_migrations" */
	delete__prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined,
	/** insert data into the table: "Business" */
	insert_Business?: GraphQLTypes["Business_mutation_response"] | undefined,
	/** insert data into the table: "BusinessCategory" */
	insert_BusinessCategory?: GraphQLTypes["BusinessCategory_mutation_response"] | undefined,
	/** insert a single row into the table: "BusinessCategory" */
	insert_BusinessCategory_one?: GraphQLTypes["BusinessCategory"] | undefined,
	/** insert data into the table: "BusinessWorker" */
	insert_BusinessWorker?: GraphQLTypes["BusinessWorker_mutation_response"] | undefined,
	/** insert a single row into the table: "BusinessWorker" */
	insert_BusinessWorker_one?: GraphQLTypes["BusinessWorker"] | undefined,
	/** insert a single row into the table: "Business" */
	insert_Business_one?: GraphQLTypes["Business"] | undefined,
	/** insert data into the table: "Category" */
	insert_Category?: GraphQLTypes["Category_mutation_response"] | undefined,
	/** insert data into the table: "CategoryField" */
	insert_CategoryField?: GraphQLTypes["CategoryField_mutation_response"] | undefined,
	/** insert data into the table: "CategoryFieldValue" */
	insert_CategoryFieldValue?: GraphQLTypes["CategoryFieldValue_mutation_response"] | undefined,
	/** insert a single row into the table: "CategoryFieldValue" */
	insert_CategoryFieldValue_one?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** insert a single row into the table: "CategoryField" */
	insert_CategoryField_one?: GraphQLTypes["CategoryField"] | undefined,
	/** insert a single row into the table: "Category" */
	insert_Category_one?: GraphQLTypes["Category"] | undefined,
	/** insert data into the table: "City" */
	insert_City?: GraphQLTypes["City_mutation_response"] | undefined,
	/** insert a single row into the table: "City" */
	insert_City_one?: GraphQLTypes["City"] | undefined,
	/** insert data into the table: "Product" */
	insert_Product?: GraphQLTypes["Product_mutation_response"] | undefined,
	/** insert data into the table: "ProductCategory" */
	insert_ProductCategory?: GraphQLTypes["ProductCategory_mutation_response"] | undefined,
	/** insert a single row into the table: "ProductCategory" */
	insert_ProductCategory_one?: GraphQLTypes["ProductCategory"] | undefined,
	/** insert a single row into the table: "Product" */
	insert_Product_one?: GraphQLTypes["Product"] | undefined,
	/** insert data into the table: "Profile" */
	insert_Profile?: GraphQLTypes["Profile_mutation_response"] | undefined,
	/** insert a single row into the table: "Profile" */
	insert_Profile_one?: GraphQLTypes["Profile"] | undefined,
	/** insert data into the table: "Role" */
	insert_Role?: GraphQLTypes["Role_mutation_response"] | undefined,
	/** insert a single row into the table: "Role" */
	insert_Role_one?: GraphQLTypes["Role"] | undefined,
	/** insert data into the table: "RolesOfProfile" */
	insert_RolesOfProfile?: GraphQLTypes["RolesOfProfile_mutation_response"] | undefined,
	/** insert a single row into the table: "RolesOfProfile" */
	insert_RolesOfProfile_one?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** insert data into the table: "_prisma_migrations" */
	insert__prisma_migrations?: GraphQLTypes["_prisma_migrations_mutation_response"] | undefined,
	/** insert a single row into the table: "_prisma_migrations" */
	insert__prisma_migrations_one?: GraphQLTypes["_prisma_migrations"] | undefined,
	/** update data of the table: "Business" */
	update_Business?: GraphQLTypes["Business_mutation_response"] | undefined,
	/** update data of the table: "BusinessCategory" */
	update_BusinessCategory?: GraphQLTypes["BusinessCategory_mutation_response"] | undefined,
	/** update single row of the table: "BusinessCategory" */
	update_BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** update data of the table: "BusinessWorker" */
	update_BusinessWorker?: GraphQLTypes["BusinessWorker_mutation_response"] | undefined,
	/** update single row of the table: "BusinessWorker" */
	update_BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** update single row of the table: "Business" */
	update_Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** update data of the table: "Category" */
	update_Category?: GraphQLTypes["Category_mutation_response"] | undefined,
	/** update data of the table: "CategoryField" */
	update_CategoryField?: GraphQLTypes["CategoryField_mutation_response"] | undefined,
	/** update data of the table: "CategoryFieldValue" */
	update_CategoryFieldValue?: GraphQLTypes["CategoryFieldValue_mutation_response"] | undefined,
	/** update single row of the table: "CategoryFieldValue" */
	update_CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** update single row of the table: "CategoryField" */
	update_CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** update single row of the table: "Category" */
	update_Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** update data of the table: "City" */
	update_City?: GraphQLTypes["City_mutation_response"] | undefined,
	/** update single row of the table: "City" */
	update_City_by_pk?: GraphQLTypes["City"] | undefined,
	/** update data of the table: "Product" */
	update_Product?: GraphQLTypes["Product_mutation_response"] | undefined,
	/** update data of the table: "ProductCategory" */
	update_ProductCategory?: GraphQLTypes["ProductCategory_mutation_response"] | undefined,
	/** update single row of the table: "ProductCategory" */
	update_ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** update single row of the table: "Product" */
	update_Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** update data of the table: "Profile" */
	update_Profile?: GraphQLTypes["Profile_mutation_response"] | undefined,
	/** update single row of the table: "Profile" */
	update_Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** update data of the table: "Role" */
	update_Role?: GraphQLTypes["Role_mutation_response"] | undefined,
	/** update single row of the table: "Role" */
	update_Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** update data of the table: "RolesOfProfile" */
	update_RolesOfProfile?: GraphQLTypes["RolesOfProfile_mutation_response"] | undefined,
	/** update single row of the table: "RolesOfProfile" */
	update_RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** update data of the table: "_prisma_migrations" */
	update__prisma_migrations?: GraphQLTypes["_prisma_migrations_mutation_response"] | undefined,
	/** update single row of the table: "_prisma_migrations" */
	update__prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined
};
	["numeric"]: any;
	/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
["numeric_comparison_exp"]: {
		_eq?: GraphQLTypes["numeric"] | undefined,
	_gt?: GraphQLTypes["numeric"] | undefined,
	_gte?: GraphQLTypes["numeric"] | undefined,
	_in?: Array<GraphQLTypes["numeric"]> | undefined,
	_is_null?: boolean | undefined,
	_lt?: GraphQLTypes["numeric"] | undefined,
	_lte?: GraphQLTypes["numeric"] | undefined,
	_neq?: GraphQLTypes["numeric"] | undefined,
	_nin?: Array<GraphQLTypes["numeric"]> | undefined
};
	/** column ordering options */
["order_by"]: order_by;
	["query_root"]: {
	__typename: "query_root",
	/** fetch data from the table: "Business" */
	Business: Array<GraphQLTypes["Business"]>,
	/** fetch data from the table: "BusinessCategory" */
	BusinessCategory: Array<GraphQLTypes["BusinessCategory"]>,
	/** fetch aggregated fields from the table: "BusinessCategory" */
	BusinessCategory_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** fetch data from the table: "BusinessCategory" using primary key columns */
	BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** fetch data from the table: "BusinessWorker" */
	BusinessWorker: Array<GraphQLTypes["BusinessWorker"]>,
	/** fetch aggregated fields from the table: "BusinessWorker" */
	BusinessWorker_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** fetch data from the table: "BusinessWorker" using primary key columns */
	BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** fetch aggregated fields from the table: "Business" */
	Business_aggregate: GraphQLTypes["Business_aggregate"],
	/** fetch data from the table: "Business" using primary key columns */
	Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** fetch data from the table: "Category" */
	Category: Array<GraphQLTypes["Category"]>,
	/** fetch data from the table: "CategoryField" */
	CategoryField: Array<GraphQLTypes["CategoryField"]>,
	/** fetch data from the table: "CategoryFieldValue" */
	CategoryFieldValue: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** fetch aggregated fields from the table: "CategoryFieldValue" */
	CategoryFieldValue_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	/** fetch data from the table: "CategoryFieldValue" using primary key columns */
	CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** fetch aggregated fields from the table: "CategoryField" */
	CategoryField_aggregate: GraphQLTypes["CategoryField_aggregate"],
	/** fetch data from the table: "CategoryField" using primary key columns */
	CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** fetch aggregated fields from the table: "Category" */
	Category_aggregate: GraphQLTypes["Category_aggregate"],
	/** fetch data from the table: "Category" using primary key columns */
	Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** fetch data from the table: "City" */
	City: Array<GraphQLTypes["City"]>,
	/** fetch aggregated fields from the table: "City" */
	City_aggregate: GraphQLTypes["City_aggregate"],
	/** fetch data from the table: "City" using primary key columns */
	City_by_pk?: GraphQLTypes["City"] | undefined,
	/** fetch data from the table: "Product" */
	Product: Array<GraphQLTypes["Product"]>,
	/** fetch data from the table: "ProductCategory" */
	ProductCategory: Array<GraphQLTypes["ProductCategory"]>,
	/** fetch aggregated fields from the table: "ProductCategory" */
	ProductCategory_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	/** fetch data from the table: "ProductCategory" using primary key columns */
	ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** fetch aggregated fields from the table: "Product" */
	Product_aggregate: GraphQLTypes["Product_aggregate"],
	/** fetch data from the table: "Product" using primary key columns */
	Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** fetch data from the table: "Profile" */
	Profile: Array<GraphQLTypes["Profile"]>,
	/** fetch aggregated fields from the table: "Profile" */
	Profile_aggregate: GraphQLTypes["Profile_aggregate"],
	/** fetch data from the table: "Profile" using primary key columns */
	Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** fetch data from the table: "Role" */
	Role: Array<GraphQLTypes["Role"]>,
	/** fetch aggregated fields from the table: "Role" */
	Role_aggregate: GraphQLTypes["Role_aggregate"],
	/** fetch data from the table: "Role" using primary key columns */
	Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** fetch data from the table: "RolesOfProfile" */
	RolesOfProfile: Array<GraphQLTypes["RolesOfProfile"]>,
	/** fetch aggregated fields from the table: "RolesOfProfile" */
	RolesOfProfile_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	/** fetch data from the table: "RolesOfProfile" using primary key columns */
	RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** fetch data from the table: "_prisma_migrations" */
	_prisma_migrations: Array<GraphQLTypes["_prisma_migrations"]>,
	/** fetch aggregated fields from the table: "_prisma_migrations" */
	_prisma_migrations_aggregate: GraphQLTypes["_prisma_migrations_aggregate"],
	/** fetch data from the table: "_prisma_migrations" using primary key columns */
	_prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined
};
	["subscription_root"]: {
	__typename: "subscription_root",
	/** fetch data from the table: "Business" */
	Business: Array<GraphQLTypes["Business"]>,
	/** fetch data from the table: "BusinessCategory" */
	BusinessCategory: Array<GraphQLTypes["BusinessCategory"]>,
	/** fetch aggregated fields from the table: "BusinessCategory" */
	BusinessCategory_aggregate: GraphQLTypes["BusinessCategory_aggregate"],
	/** fetch data from the table: "BusinessCategory" using primary key columns */
	BusinessCategory_by_pk?: GraphQLTypes["BusinessCategory"] | undefined,
	/** fetch data from the table: "BusinessWorker" */
	BusinessWorker: Array<GraphQLTypes["BusinessWorker"]>,
	/** fetch aggregated fields from the table: "BusinessWorker" */
	BusinessWorker_aggregate: GraphQLTypes["BusinessWorker_aggregate"],
	/** fetch data from the table: "BusinessWorker" using primary key columns */
	BusinessWorker_by_pk?: GraphQLTypes["BusinessWorker"] | undefined,
	/** fetch aggregated fields from the table: "Business" */
	Business_aggregate: GraphQLTypes["Business_aggregate"],
	/** fetch data from the table: "Business" using primary key columns */
	Business_by_pk?: GraphQLTypes["Business"] | undefined,
	/** fetch data from the table: "Category" */
	Category: Array<GraphQLTypes["Category"]>,
	/** fetch data from the table: "CategoryField" */
	CategoryField: Array<GraphQLTypes["CategoryField"]>,
	/** fetch data from the table: "CategoryFieldValue" */
	CategoryFieldValue: Array<GraphQLTypes["CategoryFieldValue"]>,
	/** fetch aggregated fields from the table: "CategoryFieldValue" */
	CategoryFieldValue_aggregate: GraphQLTypes["CategoryFieldValue_aggregate"],
	/** fetch data from the table: "CategoryFieldValue" using primary key columns */
	CategoryFieldValue_by_pk?: GraphQLTypes["CategoryFieldValue"] | undefined,
	/** fetch aggregated fields from the table: "CategoryField" */
	CategoryField_aggregate: GraphQLTypes["CategoryField_aggregate"],
	/** fetch data from the table: "CategoryField" using primary key columns */
	CategoryField_by_pk?: GraphQLTypes["CategoryField"] | undefined,
	/** fetch aggregated fields from the table: "Category" */
	Category_aggregate: GraphQLTypes["Category_aggregate"],
	/** fetch data from the table: "Category" using primary key columns */
	Category_by_pk?: GraphQLTypes["Category"] | undefined,
	/** fetch data from the table: "City" */
	City: Array<GraphQLTypes["City"]>,
	/** fetch aggregated fields from the table: "City" */
	City_aggregate: GraphQLTypes["City_aggregate"],
	/** fetch data from the table: "City" using primary key columns */
	City_by_pk?: GraphQLTypes["City"] | undefined,
	/** fetch data from the table: "Product" */
	Product: Array<GraphQLTypes["Product"]>,
	/** fetch data from the table: "ProductCategory" */
	ProductCategory: Array<GraphQLTypes["ProductCategory"]>,
	/** fetch aggregated fields from the table: "ProductCategory" */
	ProductCategory_aggregate: GraphQLTypes["ProductCategory_aggregate"],
	/** fetch data from the table: "ProductCategory" using primary key columns */
	ProductCategory_by_pk?: GraphQLTypes["ProductCategory"] | undefined,
	/** fetch aggregated fields from the table: "Product" */
	Product_aggregate: GraphQLTypes["Product_aggregate"],
	/** fetch data from the table: "Product" using primary key columns */
	Product_by_pk?: GraphQLTypes["Product"] | undefined,
	/** fetch data from the table: "Profile" */
	Profile: Array<GraphQLTypes["Profile"]>,
	/** fetch aggregated fields from the table: "Profile" */
	Profile_aggregate: GraphQLTypes["Profile_aggregate"],
	/** fetch data from the table: "Profile" using primary key columns */
	Profile_by_pk?: GraphQLTypes["Profile"] | undefined,
	/** fetch data from the table: "Role" */
	Role: Array<GraphQLTypes["Role"]>,
	/** fetch aggregated fields from the table: "Role" */
	Role_aggregate: GraphQLTypes["Role_aggregate"],
	/** fetch data from the table: "Role" using primary key columns */
	Role_by_pk?: GraphQLTypes["Role"] | undefined,
	/** fetch data from the table: "RolesOfProfile" */
	RolesOfProfile: Array<GraphQLTypes["RolesOfProfile"]>,
	/** fetch aggregated fields from the table: "RolesOfProfile" */
	RolesOfProfile_aggregate: GraphQLTypes["RolesOfProfile_aggregate"],
	/** fetch data from the table: "RolesOfProfile" using primary key columns */
	RolesOfProfile_by_pk?: GraphQLTypes["RolesOfProfile"] | undefined,
	/** fetch data from the table: "_prisma_migrations" */
	_prisma_migrations: Array<GraphQLTypes["_prisma_migrations"]>,
	/** fetch aggregated fields from the table: "_prisma_migrations" */
	_prisma_migrations_aggregate: GraphQLTypes["_prisma_migrations_aggregate"],
	/** fetch data from the table: "_prisma_migrations" using primary key columns */
	_prisma_migrations_by_pk?: GraphQLTypes["_prisma_migrations"] | undefined
};
	["timestamp"]: any;
	/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
["timestamp_comparison_exp"]: {
		_eq?: GraphQLTypes["timestamp"] | undefined,
	_gt?: GraphQLTypes["timestamp"] | undefined,
	_gte?: GraphQLTypes["timestamp"] | undefined,
	_in?: Array<GraphQLTypes["timestamp"]> | undefined,
	_is_null?: boolean | undefined,
	_lt?: GraphQLTypes["timestamp"] | undefined,
	_lte?: GraphQLTypes["timestamp"] | undefined,
	_neq?: GraphQLTypes["timestamp"] | undefined,
	_nin?: Array<GraphQLTypes["timestamp"]> | undefined
};
	["timestamptz"]: any;
	/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
["timestamptz_comparison_exp"]: {
		_eq?: GraphQLTypes["timestamptz"] | undefined,
	_gt?: GraphQLTypes["timestamptz"] | undefined,
	_gte?: GraphQLTypes["timestamptz"] | undefined,
	_in?: Array<GraphQLTypes["timestamptz"]> | undefined,
	_is_null?: boolean | undefined,
	_lt?: GraphQLTypes["timestamptz"] | undefined,
	_lte?: GraphQLTypes["timestamptz"] | undefined,
	_neq?: GraphQLTypes["timestamptz"] | undefined,
	_nin?: Array<GraphQLTypes["timestamptz"]> | undefined
}
    }
/** unique or primary key constraints on table "BusinessCategory" */
export const enum BusinessCategory_constraint {
	BusinessCategory_pkey = "BusinessCategory_pkey"
}
/** select columns of table "BusinessCategory" */
export const enum BusinessCategory_select_column {
	businessId = "businessId",
	categoryId = "categoryId",
	createdAt = "createdAt",
	id = "id"
}
/** update columns of table "BusinessCategory" */
export const enum BusinessCategory_update_column {
	businessId = "businessId",
	categoryId = "categoryId",
	createdAt = "createdAt",
	id = "id"
}
/** unique or primary key constraints on table "BusinessWorker" */
export const enum BusinessWorker_constraint {
	BusinessWorker_pkey = "BusinessWorker_pkey"
}
/** select columns of table "BusinessWorker" */
export const enum BusinessWorker_select_column {
	businessId = "businessId",
	createdAt = "createdAt",
	duty = "duty",
	id = "id",
	profileId = "profileId",
	updatedAt = "updatedAt"
}
/** update columns of table "BusinessWorker" */
export const enum BusinessWorker_update_column {
	businessId = "businessId",
	createdAt = "createdAt",
	duty = "duty",
	id = "id",
	profileId = "profileId",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "Business" */
export const enum Business_constraint {
	Business_pkey = "Business_pkey"
}
/** select columns of table "Business" */
export const enum Business_select_column {
	cityId = "cityId",
	createdAt = "createdAt",
	email = "email",
	id = "id",
	name = "name",
	phone = "phone",
	updatedAt = "updatedAt"
}
/** update columns of table "Business" */
export const enum Business_update_column {
	cityId = "cityId",
	createdAt = "createdAt",
	email = "email",
	id = "id",
	name = "name",
	phone = "phone",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "CategoryFieldValue" */
export const enum CategoryFieldValue_constraint {
	CategoryFieldValue_pkey = "CategoryFieldValue_pkey"
}
/** select columns of table "CategoryFieldValue" */
export const enum CategoryFieldValue_select_column {
	businessId = "businessId",
	categoryFieldId = "categoryFieldId",
	createdAt = "createdAt",
	id = "id",
	updatedAt = "updatedAt",
	value = "value"
}
/** update columns of table "CategoryFieldValue" */
export const enum CategoryFieldValue_update_column {
	businessId = "businessId",
	categoryFieldId = "categoryFieldId",
	createdAt = "createdAt",
	id = "id",
	updatedAt = "updatedAt",
	value = "value"
}
/** unique or primary key constraints on table "CategoryField" */
export const enum CategoryField_constraint {
	CategoryField_pkey = "CategoryField_pkey"
}
/** select columns of table "CategoryField" */
export const enum CategoryField_select_column {
	categoryId = "categoryId",
	createdAt = "createdAt",
	id = "id",
	options = "options",
	required = "required",
	type = "type",
	updatedAt = "updatedAt"
}
/** update columns of table "CategoryField" */
export const enum CategoryField_update_column {
	categoryId = "categoryId",
	createdAt = "createdAt",
	id = "id",
	options = "options",
	required = "required",
	type = "type",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "Category" */
export const enum Category_constraint {
	Category_pkey = "Category_pkey"
}
/** select columns of table "Category" */
export const enum Category_select_column {
	createdAt = "createdAt",
	id = "id",
	name = "name",
	updatedAt = "updatedAt"
}
/** update columns of table "Category" */
export const enum Category_update_column {
	createdAt = "createdAt",
	id = "id",
	name = "name",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "City" */
export const enum City_constraint {
	City_pkey = "City_pkey"
}
/** select columns of table "City" */
export const enum City_select_column {
	countryCode = "countryCode",
	countryId = "countryId",
	createdAt = "createdAt",
	flag = "flag",
	id = "id",
	latitude = "latitude",
	longitude = "longitude",
	name = "name",
	stateCode = "stateCode",
	stateId = "stateId",
	updatedAt = "updatedAt",
	wikiDataId = "wikiDataId"
}
/** update columns of table "City" */
export const enum City_update_column {
	countryCode = "countryCode",
	countryId = "countryId",
	createdAt = "createdAt",
	flag = "flag",
	id = "id",
	latitude = "latitude",
	longitude = "longitude",
	name = "name",
	stateCode = "stateCode",
	stateId = "stateId",
	updatedAt = "updatedAt",
	wikiDataId = "wikiDataId"
}
/** unique or primary key constraints on table "ProductCategory" */
export const enum ProductCategory_constraint {
	ProductCategory_pkey = "ProductCategory_pkey"
}
/** select columns of table "ProductCategory" */
export const enum ProductCategory_select_column {
	categoryId = "categoryId",
	createdAt = "createdAt",
	id = "id",
	productId = "productId",
	updatedAt = "updatedAt"
}
/** update columns of table "ProductCategory" */
export const enum ProductCategory_update_column {
	categoryId = "categoryId",
	createdAt = "createdAt",
	id = "id",
	productId = "productId",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "Product" */
export const enum Product_constraint {
	Product_pkey = "Product_pkey"
}
/** select columns of table "Product" */
export const enum Product_select_column {
	ImagesUrls = "ImagesUrls",
	businessId = "businessId",
	createdAt = "createdAt",
	id = "id",
	mainImageUrl = "mainImageUrl",
	name = "name",
	price = "price",
	quota = "quota",
	updatedAt = "updatedAt"
}
/** update columns of table "Product" */
export const enum Product_update_column {
	ImagesUrls = "ImagesUrls",
	businessId = "businessId",
	createdAt = "createdAt",
	id = "id",
	mainImageUrl = "mainImageUrl",
	name = "name",
	price = "price",
	quota = "quota",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "Profile" */
export const enum Profile_constraint {
	Profile_auth_key = "Profile_auth_key",
	Profile_pkey = "Profile_pkey"
}
/** select columns of table "Profile" */
export const enum Profile_select_column {
	auth = "auth",
	createdAt = "createdAt",
	id = "id",
	name = "name",
	updatedAt = "updatedAt"
}
/** update columns of table "Profile" */
export const enum Profile_update_column {
	auth = "auth",
	createdAt = "createdAt",
	id = "id",
	name = "name",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "Role" */
export const enum Role_constraint {
	Role_pkey = "Role_pkey"
}
/** select columns of table "Role" */
export const enum Role_select_column {
	createdAt = "createdAt",
	id = "id",
	title = "title",
	updatedAt = "updatedAt"
}
/** update columns of table "Role" */
export const enum Role_update_column {
	createdAt = "createdAt",
	id = "id",
	title = "title",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "RolesOfProfile" */
export const enum RolesOfProfile_constraint {
	RolesOfProfile_pkey = "RolesOfProfile_pkey"
}
/** select columns of table "RolesOfProfile" */
export const enum RolesOfProfile_select_column {
	createdAt = "createdAt",
	id = "id",
	profileId = "profileId",
	roleId = "roleId",
	updatedAt = "updatedAt"
}
/** update columns of table "RolesOfProfile" */
export const enum RolesOfProfile_update_column {
	createdAt = "createdAt",
	id = "id",
	profileId = "profileId",
	roleId = "roleId",
	updatedAt = "updatedAt"
}
/** unique or primary key constraints on table "_prisma_migrations" */
export const enum _prisma_migrations_constraint {
	_prisma_migrations_pkey = "_prisma_migrations_pkey"
}
/** select columns of table "_prisma_migrations" */
export const enum _prisma_migrations_select_column {
	applied_steps_count = "applied_steps_count",
	checksum = "checksum",
	finished_at = "finished_at",
	id = "id",
	logs = "logs",
	migration_name = "migration_name",
	rolled_back_at = "rolled_back_at",
	started_at = "started_at"
}
/** update columns of table "_prisma_migrations" */
export const enum _prisma_migrations_update_column {
	applied_steps_count = "applied_steps_count",
	checksum = "checksum",
	finished_at = "finished_at",
	id = "id",
	logs = "logs",
	migration_name = "migration_name",
	rolled_back_at = "rolled_back_at",
	started_at = "started_at"
}
/** column ordering options */
export const enum order_by {
	asc = "asc",
	asc_nulls_first = "asc_nulls_first",
	asc_nulls_last = "asc_nulls_last",
	desc = "desc",
	desc_nulls_first = "desc_nulls_first",
	desc_nulls_last = "desc_nulls_last"
}