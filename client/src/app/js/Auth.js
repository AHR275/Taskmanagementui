export default async function IsAuth() {
  try {
    const res = await fetch("http://localhost:5122/users/profile", {
      method: "POST",
      credentials: "include",
    });

    if (res.status === 401) {
      return [false, {}];
    }

    const user = await res.json();
    return [true, user];

  } catch (err) {
    return [false, {}];
  }
}
