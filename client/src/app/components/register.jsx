import { useState } from "react";
import SignUp from "./singUp";
import SignIn from "./signIn";


export default function Register({isOpen , onClose,isSignin,setIsLoading }){
    if(!isOpen)return null;

    const  [isSigninCopy,setIsSigninCopy]= useState(isSignin);

    const handleToggle=()=>{
        
        isSigninCopy?setIsSigninCopy(false):setIsSigninCopy(true);
        
    }
    return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
        <div  className="relative bg-card border border-border rounded-lg shadow-lg max-w-[500px] w-full max-h-[90vh] overflow-y-auto p-6 z-10">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pb-2">
                <h2 className="text-xl font-semibold">
                    {isSigninCopy?"Sign In":"Sign Up"}
                    
                    </h2>
                <button className="p-2 hover:bg-secondary rounded-circle transition-colors" aria-label="Close dialog"
                onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-5 h-5">
                    <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                </button>
            </div>
            {isSigninCopy?  <SignIn setIsLoading={setIsLoading} onClose={onClose}></SignIn>:
                            <SignUp setIsLoading={setIsLoading} onClose={onClose}></SignUp>
            }

            <button className="flex  items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2 hover:opacity-90 transition-opacity" aria-label="Toggle Dialoge"
                onClick={handleToggle}       
            >
                {isSigninCopy?"Create a new account":"Sign in to your account"}
            </button>
        </div>









      
      
      
    </div>

    )
}