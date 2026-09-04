import app from "./src/app.js"
import connectToDb from "./src/config/db.js"

const PORT = process.env.PORT || 8000

const startServer = async () =>{
    try {
        await connectToDb()

        app.listen(PORT,()=>{
            console.log('Server is running')
        })
    } catch (error) {
        console.error('Failed to start the server',error.message)
        process.exit(1)
    }
}

startServer()