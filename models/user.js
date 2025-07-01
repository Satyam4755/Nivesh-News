
const mongoose=require('mongoose');
const userSchema=mongoose.Schema({
    profilePicture: String,
    profilePicturePublicId: {
        type: String,
        required: false
    },
    firstName:{
        type:String,
        required:[true,'First name is required'],
        trim:true,
    },
    lastName:String,
    email:{
        type:String,
        required:[true,'Email is required'],
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:[true,'Password is required'],
    },
    theme:{
        type:Boolean,
        default:false
    },
    // Option 1: Extend User schema
savedNews: [
  {
    title: String,
    description: String,
    url: String,
    urlToImage: String,
    publishedAt: String,
    source: {
      id: String,
      name: String,
    },
    content: String
  }
],

})

module.exports=mongoose.model('User',userSchema,'user')//---->model name, schema name, collection name;
