import{setUser, setLoading, setError} from '../state/auth.slice'
import {register} from '../services/auth.api'
import {useDispatch} from 'react-redux'

export const useAuth = () =>{

    const dispatch = useDispatch()

    async function handleRegister({email, password, contact, fullname,isSeller = false}){
        
       const data = await register({email, password, contact, fullname,isSeller})

       dispatch(setUser(data.user))

    }

    return {handleRegister}
}