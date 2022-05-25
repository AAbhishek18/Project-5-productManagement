const express = require('express');
const router = express.Router()

const userController = require("../controllers/userController")
const productController =require('../controllers/productController')
const {userAuth} =require('../middleware/auth')


//@ USER ROUTE HANDLER
 router.post('/register',userController.createUser)
 router.post('/login',userController.loginUser)
 router.get('/user/:userId/profile',userAuth,userController.getUser)
 router.put('/user/:userId/profile',userAuth,userController.updateUserDetails)

 //@ PRODUCT ROUTE HANDLER
//router.post('/products',productController.createProduct)



 
module.exports = router