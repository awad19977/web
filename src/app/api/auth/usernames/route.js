import sql from "@/app/api/utils/sql";

const MAX_RESULTS = 20;

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const rawTerm = (url.searchParams.get("q") ?? "").toString().slice(0, 100);
    const term = rawTerm.trim().toLowerCase();

    const rows = term
      ? await sql`
          SELECT username, COALESCE(name, username) AS display_name
          FROM auth_users
          WHERE LOWER(username) LIKE ${"%" + term + "%"}
          ORDER BY username ASC
          LIMIT ${MAX_RESULTS}
        `
      : await sql`
          SELECT username, COALESCE(name, username) AS display_name
          FROM auth_users
          ORDER BY username ASC
          LIMIT ${MAX_RESULTS}
        `;

    return Response.json({
      usernames: rows.map((row) => ({
        username: row.username,
        displayName: row.display_name,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch usernames", error);
    return Response.json({ error: "Unable to fetch usernames" }, { status: 500 });
  }
}
