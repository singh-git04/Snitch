import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'

const Protected = ({children, role = null}) => {
    
    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)

    if(loading){
        return (
            <div className="min-h-screen flex items-center justify-center bg-white font-mono text-xs uppercase tracking-widest text-neutral-500">
                Loading...
            </div>
        )
    }

    if(!user){
        return <Navigate to='/login' replace />
    }

    if(role && user.role !== role){
        return <Navigate to='/' replace />
    }

  return children
}

export default Protected
