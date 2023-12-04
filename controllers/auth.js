const User = require('../models/User')
const jwt = require('jsonwebtoken')
const auth = async (req, res, next) => {

  try{
      const token = req.headers.cookie.split('Authorization=')[1]

      console.log(req.cookies)
      console.log(token,'111111')
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
      console.log(decoded,'22222222222')
      const user = await User.findOne({ _id: decoded._id})
     

      if(!user) {
          throw new Error("User not found")
      }

      req.token = token
      req.user = user
      console.log('LOGGED')
      next()

  } catch(error) {
      res.render('index',{error:error,msg:false})
  }

  
}

module.exports = auth