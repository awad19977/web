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

  return {
    users: usersQuery.data?.users ?? [],
    usersLoading: usersQuery.isLoading,
    usersError: usersQuery.isError,
    updatePermission: updatePermission.mutate,
    updatePermissionLoading: updatePermission.isLoading,
  };
}
