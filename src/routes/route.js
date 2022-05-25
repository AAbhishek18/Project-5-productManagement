const express = require('express');
const router = express.Router()

const userController = require("../controllers/userController")
const productController =require('../controllers/productController')
const {authentication} =require('../middleware/auth')



 router.post('/register',userController.createUser)
 router.post('/login',userController.loginUser)
 
 router.get('/user/:userId/profile',authentication,userController.getUser)

 router.post('/products',productController.createProduct)



 
module.exports = router