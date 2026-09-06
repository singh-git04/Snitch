import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = mongoose.Schema({
    fullname: {type:String, require:true},
    email: {type:String, require:true, unique:true},
    contact: {type:String, require:true},
    password: {type:String, require:true},
    role:{type:String, enum:["buyer", "seller"],default:"buyer"}
})


userSchema.pre("save", async function() {
    if(!this.isModified("password")) return

    const hash  = await bcrypt.hash(this.password,10)
    this.password = hash
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

export const userModel = mongoose.model("user",userSchema)

export default userModel