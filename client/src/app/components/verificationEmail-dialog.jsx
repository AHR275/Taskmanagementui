import { useState,useEffect } from "react"
export default function VerificationEmailDialog({user,isOpen,onClose,onSubmit ,errors}){
    if(!isOpen)return null ;
    const [email,setEmail]=useState(user.email); 

    
        

    
        return(
        <>

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
        <div  className="relative bg-card border border-border rounded-lg shadow-lg max-w-[500px] w-full max-h-[90vh] overflow-y-auto p-6 z-10">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pb-2">
                <h2 className="text-xl font-semibold">
                    
                    Verify Your Email
                </h2>
                <button className="p-2 hover:bg-secondary rounded-circle transition-colors" aria-label="Close dialog"
                onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-5 h-5">
                    <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                </button>
            </div>
       
     
    
    
            <form className="flex flex-column gap-2 mb-[10px]" 
                   onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit(e, email); // or onSubmit(email) (see below)
                    }}
            >
                <div className="flex flex-column gap-4">

    
    
                    <div>
                        <label htmlFor='email'>Email</label>
                        <input type="email" name="email" placeholder="Enter your email "   
                        value={email} onChange={(e)=>{setEmail(e.currentTarget.value)}}
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {errors.email ? <p style={{ color: "red", fontSize: "12px" }}>{errors.email}</p> : null}
                    </div>
    

                </div>
                <button type="submit" 
                 className="flex  items-center  justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2 hover:opacity-90 transition-opacity
                "
                >Verifiy</button>
    
            </form>
    
        </div>
        </div>
        </>
    
        )



}