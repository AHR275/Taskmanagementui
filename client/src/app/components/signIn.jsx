import { useState,useEffect, useRef } from "react";



export default function SignIn({onClose}){
    // if(!isOpen)return null; 
    // const [name,setName]=useState('');
    const [username,setUsername]=useState('');
    // const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');

    

    const [errors,setErrors]=useState({});



const handleSubmit = async (e) => {
    e.preventDefault();
    try{

            const res = await fetch("http://localhost:5122/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json().catch(() => ({}));
        setErrors(data.errors);
        
        if (!res.ok) {
            console.log("Login failed:", data);
            return;
        }
        
        console.log("Login success:", data);
        // onClose();
        window.location.reload();
    }catch(err){
        console.error(err.message);
    }


};






    return(
<>

    
    {/* sign In dialog  */}

        <form className="flex flex-column gap-2 mb-[10px]" >
            <div className="flex flex-column gap-4">
{      
        //   <div>
        //             <label htmlFor='name'>Name</label>
        //             <input type="text" name="name" placeholder="Enter your name "   
        //             value={name} onChange={(e)=>{setName(e.currentTarget.value)}} 
        //             className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        //             onInputCapture={isValid}
        //             />
        //             {errors.name ? <p style={{ color: "red", fontSize: "12px" }}>{errors.name}</p> : null}
        //         </div>
}
                <div>
                    <label htmlFor='username'>Username</label>
                    <input type="username" name="username" placeholder="Enter your username "   
                    value={username} onChange={(e)=>{setUsername(e.currentTarget.value)}}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.username ? <p style={{ color: "red", fontSize: "12px" }}>{errors.username}</p> : null}
                </div>

                {/* <div>
                    <label htmlFor='email'>Email</label>
                    <input type="email" name="email" placeholder="Enter your email "   
                    value={email} onChange={(e)=>{setEmail(e.currentTarget.value)}}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.email ? <p style={{ color: "red", fontSize: "12px" }}>{errors.email}</p> : null}
                </div> */}

                <div>
                    <label htmlFor='password'>Password</label>
                    <input type="password" name="password" placeholder="Enter your password "   
                    value={password} onChange={(e)=>{setPassword(e.currentTarget.value)}}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.password ? <p style={{ color: "red", fontSize: "12px" }}>{errors.password}</p> : null}
                </div>
            </div>
            <button type="submit" onClick={handleSubmit}
            className="flex  items-center align-items justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2 hover:opacity-90 transition-opacity
            w-fit-content"
            > Sign In </button>

        </form>
   
  </>
    )
}