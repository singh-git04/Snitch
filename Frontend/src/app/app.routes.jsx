import {createBrowserRouter} from "react-router"
import Register from "../features/auth/pages/Register.jsx"
import Login from "../features/auth/pages/Login.jsx"
import CreateProduct from "../features/product/pages/CreateProduct.jsx"
import Dashboard from "../features/product/pages/Dashboard.jsx"
import Home from "./Home.jsx"

export const routes = createBrowserRouter([

    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "/register",
        element: <Register/>
    },
    {
        path: "/",
        element: <Home/>
    },
    {
        path: "/seller",
        children:[
            {
                path: "/seller/create-product",
                element: <CreateProduct/>
            },
            {
                path: "/seller/dashboard",
                element: <Dashboard/>
            }
        ]
    }
])
