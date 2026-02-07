import { useState,useEffect, useRef } from "react";
import uploadAvatar from "../js/uploadAvatar";
import { SERVER_URL } from "../js/config";



export default function SignUp({onClose,setIsLoading}){
    // if(!isOpen)return null; 
    const [name,setName]=useState('');
    const [username,setUsername]=useState('');
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');

    


    const [errors,setErrors]=useState({});

    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true)
        setErrors({});

     
        const file = document.getElementById("avatar-input").files[0];
        const avatar_url=  await uploadAvatar(file); 
        if(!avatar_url) return null ; 



        try {
            const body = { name, username, email, password,avatar_url };

            const res = await fetch(`${SERVER_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
            setErrors(data.errors || {});
            return;
            }

                console.log("Success:", data);
                // onClose();
                window.location.reload();
        } 
        catch (err) {
                console.error("Fetch failed:", err);
        }finally{
            setIsLoading(false)
        }
        

        
    };





    return(
    <>
    
    {/* sign up dialog  */}


        <form className="flex flex-column gap-2 mb-[10px]" >
            <div className="flex flex-column gap-4">
                <div>
                    <label htmlFor='name'>Name</label>
                    <input type="text" name="name" placeholder="Enter your name "   
                    value={name} onChange={(e)=>{setName(e.currentTarget.value)}} 
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    // onInputCapture={isValid}
                    />
                    {errors.name ? <p style={{ color: "red", fontSize: "12px" }}>{errors.name}</p> : null}
                </div>

                <div>
                    <label htmlFor='username'>Username</label>
                    <input type="username" name="username" placeholder="Enter your username "   
                    value={username} onChange={(e)=>{setUsername(e.currentTarget.value)}}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.username ? <p style={{ color: "red", fontSize: "12px" }}>{errors.username}</p> : null}
                </div>

                <div>
                    <label htmlFor='email'>Email</label>
                    <input type="email" name="email" placeholder="Enter your email "   
                    value={email} onChange={(e)=>{setEmail(e.currentTarget.value)}}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.email ? <p style={{ color: "red", fontSize: "12px" }}>{errors.email}</p> : null}
                </div>

                <div>
                    <label htmlFor='password'>Password</label>
                    <input type="password" name="password" placeholder="Enter your password "   
                    value={password} onChange={(e)=>{setPassword(e.currentTarget.value)}}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.password ? <p style={{ color: "red", fontSize: "12px" }}>{errors.password}</p> : null}
                </div>

                <div>
                    <label htmlFor='password'>Profile Image</label>
                    <input
                        id="avatar-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        // onChange={(e) => uploadAvatar(e.target.files[0])}
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.avatar_url ? <p style={{ color: "red", fontSize: "12px" }}>{errors.avatar_url}</p> : null}
                </div>
            </div>
            <button type="submit" onClick={handleSubmit}
             className="flex  items-center  justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2 hover:opacity-90 transition-opacity
            "
            >Sign up </button>

        </form>

    </>

    )
}