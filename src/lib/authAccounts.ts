export const LOCAL_AUTH_ACCOUNTS = [
  {
    email: "maxime@local.app",
    firstName: "Maxime",
    displayName: "Maxime",
  },
  {
    email: "jean-marc@local.app",
    firstName: "Jean-Marc",
    displayName: "Jean-Marc",
  },
  {
    email: "tristan@local.app",
    firstName: "Tristan",
    displayName: "Tristan",
  },
  {
    email: "justin@local.app",
    firstName: "Justin",
    displayName: "Justin",
  },
] as const;

function normalizeFirstName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const AUTH_ACCOUNT_BY_FIRST_NAME = new Map(
  LOCAL_AUTH_ACCOUNTS.map((account) => [
    normalizeFirstName(account.firstName),
    account,
  ]),
);

export function getAuthAccountByFirstName(firstName: string) {
  return AUTH_ACCOUNT_BY_FIRST_NAME.get(normalizeFirstName(firstName)) ?? null;
}
