// server/models/task.model.js

// 1) map DB row -> API object (what you send to frontend)
export function toUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    password: row.password,
    name: row.name,
    email: row.email,
    signup_date: row.signup_date,
    updated_date: row.updated_date,

  };
}

// 2) map request body -> DB columns (for INSERT/UPDATE)
export function fromBody(body) {
  return {
    id: body.id ?? "",
    username: body.username ?? "",
    password: body.password ?? "",
    name: body.name ?? "",
    email: body.email ?? "",
    signup_date: body.signup_date ?? null,
    updated_date: body.updated_date ?? null,
   
  };
}
