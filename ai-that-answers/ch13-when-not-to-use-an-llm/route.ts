const OWNER = {
  checkout: "payments",
  search: "discovery",
  account: "identity",
} as const satisfies Record<string, string>;

export type Service = keyof typeof OWNER;
export const ownerOf = (service: Service) => OWNER[service];
