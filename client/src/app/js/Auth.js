import { SERVER_URL } from "./config";


export default async function IsAuth() {
  // let categories=[{}]
  try {
    const res = await fetch(`${SERVER_URL}/users/profile`, {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401) {
      return [false, {}];
    }

    const user = await res.json();
    // categories = await getCategories(user.id) ;
   
      return [true, user];
    
      // return [true, user];


  } catch (err) {
    console.error("error A :" ,err.message);
    return [false, {}];
  }
}
