import mongoose from "mongoose"

export const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MONGODB CONNECTION SUCCESSFULLY")
    }catch(error){
        console.error("Error connecting to MongoDB: ", error)
        process.exit(1) //exit with failure(1) or Success(0)
    }
}