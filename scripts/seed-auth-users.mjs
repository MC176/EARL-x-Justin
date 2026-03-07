import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
  );
}

const users = [
  {
    email: "maxime@local.app",
    first_name: "Maxime",
    display_name: "Maxime",
    password: process.env.AUTH_PASSWORD_MAXIME,
  },
  {
    email: "jean-marc@local.app",
    first_name: "Jean-Marc",
    display_name: "Jean-Marc",
    password: process.env.AUTH_PASSWORD_JEAN_MARC,
  },
  {
    email: "tristan@local.app",
    first_name: "Tristan",
    display_name: "Tristan",
    password: process.env.AUTH_PASSWORD_TRISTAN,
  },
  {
    email: "justin@local.app",
    first_name: "Justin",
    display_name: "Justin",
    password: process.env.AUTH_PASSWORD_JUSTIN,
  },
];

const missingPasswords = users.filter((user) => !user.password).map((user) => user.email);
if (missingPasswords.length > 0) {
  throw new Error(
    `Mots de passe manquants pour: ${missingPasswords.join(", ")}. Définissez AUTH_PASSWORD_MAXIME, AUTH_PASSWORD_JEAN_MARC, AUTH_PASSWORD_TRISTAN, AUTH_PASSWORD_JUSTIN.`,
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: listedUsers, error: listError } = await admin.auth.admin.listUsers();

if (listError) {
  throw listError;
}

for (const user of users) {
  const existingUser = listedUsers.users.find(
    (existing) => existing.email === user.email,
  );

  if (existingUser) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: user.password,
        user_metadata: {
          first_name: user.first_name,
          display_name: user.display_name,
          role: "operator",
        },
      },
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`Compte mis à jour: ${user.email}`);
    continue;
  }

  const { data: createdUser, error: createError } =
    await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        first_name: user.first_name,
        display_name: user.display_name,
        role: "operator",
      },
    });

  if (createError) {
    throw createError;
  }

  console.log(`Compte créé: ${createdUser.user.email}`);
}
