/**
 * REACT QUERY HOOKS
 * -----------------
 * Thin wrappers around the api client for use in screens.
 *
 *   const { data, isLoading } = useEndpoint('api.wallet.balances.list')
 *   const mutate = useEndpointMutation('api.auth.login')
 *   await mutate.mutateAsync({ body: { email, password } })
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { api, ApiError } from './client'
import type { EndpointId } from './endpoints'

type CallOpts = {
  pathParams?: Record<string, string | number>
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

export function useEndpoint<T = unknown>(
  endpointId: EndpointId,
  opts: CallOpts = {},
  reactQueryOpts?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, ApiError>({
    queryKey: [endpointId, opts.pathParams ?? {}, opts.query ?? {}],
    queryFn: () => api<T>(endpointId, opts),
    ...reactQueryOpts,
  })
}

export function useEndpointMutation<TIn = CallOpts, TOut = unknown>(
  endpointId: EndpointId,
  options?: {
    invalidates?: EndpointId[]
    onSuccess?: (data: TOut) => void
  },
) {
  const queryClient = useQueryClient()
  return useMutation<TOut, ApiError, TIn>({
    mutationFn: (input) => api<TOut>(endpointId, input as CallOpts),
    onSuccess: (data) => {
      if (options?.invalidates) {
        for (const id of options.invalidates) {
          queryClient.invalidateQueries({ queryKey: [id] })
        }
      }
      options?.onSuccess?.(data)
    },
  })
}
