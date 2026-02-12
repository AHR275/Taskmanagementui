import { SERVER_URL } from "./config"
export default async function verificationEmail({username,email,userId}) {
    const body = {username,email,userId}

    try{
        const res = await fetch(`${SERVER_URL}/users/auth/send-verification`,{
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ),
        })
        if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
        }

        return await res.json();
    } catch (error) {
        console.error(error.message);
        throw error;
    }
} 