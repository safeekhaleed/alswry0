import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType, BodyType } from "./custom-fetch";

export interface UserAuthResponse {
  id: number;
  username: string;
  email: string;
  balance: number;
  accountId: string;
  isVip: boolean;
  avatarUrl?: string | null;
}

export interface UserRegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getUserMeUrl = () => `/api/auth/user/me`;
export const getUserMeQueryKey = () => [getUserMeUrl()] as const;

export const getUserMe = async (options?: RequestInit): Promise<UserAuthResponse> => {
  return customFetch<UserAuthResponse>(getUserMeUrl(), { ...options, method: "GET" });
};

export const getUserMeQueryOptions = <
  TData = Awaited<ReturnType<typeof getUserMe>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getUserMe>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getUserMeQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserMe>>> = ({ signal }) =>
    getUserMe({ signal, ...requestOptions });
  return { queryKey, queryFn, retry: false, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getUserMe>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useGetUserMe<
  TData = Awaited<ReturnType<typeof getUserMe>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getUserMe>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getUserMeQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getUserRegisterUrl = () => `/api/auth/user/register`;

export const userRegister = async (
  input: UserRegisterInput,
  options?: RequestInit,
): Promise<UserAuthResponse> => {
  return customFetch<UserAuthResponse>(getUserRegisterUrl(), {
    credentials: "include",
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });
};

export const getUserRegisterMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userRegister>>,
    TError,
    { data: BodyType<UserRegisterInput> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof userRegister>>,
  TError,
  { data: BodyType<UserRegisterInput> },
  TContext
> => {
  const mutationKey = ["userRegister"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof userRegister>>,
    { data: BodyType<UserRegisterInput> }
  > = (props) => {
    const { data } = props ?? {};
    return userRegister(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useUserRegister = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userRegister>>,
    TError,
    { data: BodyType<UserRegisterInput> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof userRegister>>,
  TError,
  { data: BodyType<UserRegisterInput> },
  TContext
> => {
  return useMutation(getUserRegisterMutationOptions(options));
};

export const getUserLoginUrl = () => `/api/auth/user/login`;

export const userLogin = async (
  input: UserLoginInput,
  options?: RequestInit,
): Promise<UserAuthResponse> => {
  return customFetch<UserAuthResponse>(getUserLoginUrl(), {
    credentials: "include",
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });
};

export const getUserLoginMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userLogin>>,
    TError,
    { data: BodyType<UserLoginInput> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof userLogin>>,
  TError,
  { data: BodyType<UserLoginInput> },
  TContext
> => {
  const mutationKey = ["userLogin"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof userLogin>>,
    { data: BodyType<UserLoginInput> }
  > = (props) => {
    const { data } = props ?? {};
    return userLogin(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useUserLogin = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userLogin>>,
    TError,
    { data: BodyType<UserLoginInput> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof userLogin>>,
  TError,
  { data: BodyType<UserLoginInput> },
  TContext
> => {
  return useMutation(getUserLoginMutationOptions(options));
};

export const getUserLogoutUrl = () => `/api/auth/user/logout`;

export const userLogout = async (options?: RequestInit): Promise<void> => {
  return customFetch<void>(getUserLogoutUrl(), { ...options, method: "POST" });
};

export const getUserLogoutMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userLogout>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof userLogout>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = ["userLogout"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<Awaited<ReturnType<typeof userLogout>>, void> = () => {
    return userLogout(requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useUserLogout = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof userLogout>>,
    TError,
    void,
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<Awaited<ReturnType<typeof userLogout>>, TError, void, TContext> => {
  return useMutation(getUserLogoutMutationOptions(options));
};
