const User  = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

// Send OTP

exports.sendOTP = async (req, res) => {

    try{

        //fetch email from req body
        const {email} = req.body;

        // check if user already exist
        const checkUserPresent  = await User.findOne({email});

        // if user already present , then return a response
        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User Already Registered"
            })
        }



        //generate otp

        let otp= otpGenerator.generate(6,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log(otp)



        //check unique otp or not 

        const result = await OTP.findOne({otp : otp})

        while(result){

            otp = otpGenerator(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        result = await OTP.findOne({otp : otp})
        }



        const otpPayload = {email, otp};

        //create an entry for otp
        const otpBody  = await OTP.create(otpPayload)
        console.log(otpBody);

        // return response sucessful

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp,
        })
    }
    catch(error){

        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};





// signup 

exports.signup = async (req, res) =>{

   try{


     // fetching data from req body
    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        accountType,
        contactNumber,
        otp,
    } = req.body;




    // validating
    if(!firstName || !lastName || !email  || !password || !confirmPassword || !otp){
        return res.status(403).json({
            success: false,
            message: "All fields are required"
        })
    }




    // matching both the passwords and confirmpassword

    if(password !== confirmPassword){
        return res.status(400).json({
            success: false,
            message: "Password and confirmpassword does not match, please try again"
        })
    }



    // check already user exist or not 

    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(400).json({
            success: false,
            message: "User is already existed"
        })
    }


    // finding the most recent OTP store for user 

    const recentOtp = await OTP.find({email}).sort({created: -1}).limit(1);
    console.log(recentOtp)

    // validate otp
     if(recentOtp.length == 0){
        //otp not found
        return res.status(400).json({
            success: false,
            message: "OTP not found"
        })
     }
     else if(otp !== recentOtp){
        //invalid otp
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        })
     }


     //Hashpassword

     const hashedPassword = await bcrypt.hash(password, 10);

     //Creating entry in DB

     const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        contactNumber: null,
        about: null,
     })

     const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        password: hashedPassword,
        accountType,
        additionalInformation: profileDetails._id,
        image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
     })



     return res.status(200).json({
        success: true,
        message: "User is registered successfully",
        user,
     });



   }


   catch(error){
    console.log(error)
    return res.status(500).json({
        success:false,
        message: "User cannot registered. Please try again"
    })
   }
}



// Login

exports.login = async(req, res) => {

    try{


        // get data req body
        const {email, password} = req.body;


        //validating the data
        if(!email || !password){
            return res.status(403).json({
                success: false,
                message:"All fields are required, fill all the fields"
            })
        }


        //user check exist or not 
        const user = await User.findOne({email}).populate("additionalDetails")
        if(!user){
            return res.status(401).json({
                success: false,
                message: "User not found. Please signup first"
            })
        }



        //generate JWT after matching passwords

        if(await bcrypt.compare(password, user.password)){
            const payload={
                email: user.email,
                id: user._id,
                accountType:user.accountType,
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '2h',
            })
            user.token = token;
            user.password = undefined;

            // create cookies and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: 'Logged in successfully'
            })
        }
        else{
            return res.status(401).json({
                succss: false,
                message: "Password is incorrect",
            })
        }




    }
    catch(error){
        console.log(error)
        return res.statu(500).json({
            success: false,
            message: "Login failure, try again"
        })
    }
}




// changepassword

//get data from req body
//get oldPassword, newPassword and confirmPassword
//validation
//update passwordd in DB
//send mail - password updated
//return response