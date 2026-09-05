export const userQueryKey = {
  me: ["user"] as const,
};

export const merchantQueryKey = {
  all: ["merchants"] as const,
  detail: (id: string) => ["merchants", id] as const,
};
