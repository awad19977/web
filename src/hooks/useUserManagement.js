import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const fetchJson = async (input, init) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await response.json().catch(() => null);
    const error = new Error(message?.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return response.json();
};

export function useUserManagement() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchJson("/api/users"),
  });

  const updatePermission = useMutation({
    mutationFn: ({ userId, featureKey, enabled }) =>
      fetchJson(`/api/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey, enabled }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (payload) =>
      fetchJson("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) =>
      fetchJson(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) =>
      fetchJson(`/api/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }) =>
      fetchJson(`/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }),
  });

  return {
    users: usersQuery.data?.users ?? [],
    usersLoading: usersQuery.isLoading,
    usersError: usersQuery.isError,
    updatePermission: updatePermission.mutate,
    updatePermissionLoading: updatePermission.isLoading,
    createUser: createUserMutation.mutateAsync,
    createUserLoading: createUserMutation.isLoading,
    updateUser: updateUserMutation.mutateAsync,
    updateUserLoading: updateUserMutation.isLoading,
    deleteUser: deleteUserMutation.mutateAsync,
    deleteUserLoading: deleteUserMutation.isLoading,
    resetPassword: resetPasswordMutation.mutateAsync,
    resetPasswordLoading: resetPasswordMutation.isLoading,
  };
}
