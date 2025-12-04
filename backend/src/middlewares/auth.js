const jwt = require('jsonwebtoken');
require('dotenv').config();
const { User } = require('../models'); // models/index.js

module.exports = async (req,res,next)=>{
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({message:'Unauthorized'});
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if(!user) return res.status(401).json({message:'Unauthorized'});
    req.user = user;
    next();
  } catch(err){
    return res.status(401).json({message:'Invalid token'});
  }
};
