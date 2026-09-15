import {RouterProvider} from "react-router"
import{ routes} from "./app.routes"
import { useAuth } from "../features/auth/hook/useAuth"
import { useEffect } from "react"
import { useSelector } from "react-redux"



const App = () => {
  const {handleGetMe} = useAuth()

  const user = useSelector(state => state.auth.user)

  console.log(user)
  
  useEffect(()=>{
    handleGetMe()
  },[])

  return (
    < RouterProvider router={routes} />
  )
}

export default App
