const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const cartModel = require("../models/cartModel")
const validator = require("../validator/validator")
const mongoose = require('mongoose')
const redis = require('redis')
const { promisify } = require('util')



const redisClient = redis.createClient(
    14169,
    "redis-14169.c16.us-east-1-2.ec2.cloud.redislabs.com",

    { no_ready_check: true }
);
redisClient.auth("XpjNU5wqWNRfxsvtC18K9eXU43xR0FZb", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let cartId = req.params.cartId
        let data = req.body
        //let items= JSON.parse(data.items)

        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, msg: "Bad Request, No Data Provided" })
        }

        let { productId, quantity } = data

        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, msg: "UserId is required" })
        }

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        let findUser = await userModel.findOne({ userId })
        if (!findUser) {
            return res.status(404).send({ status: false, msg: "userId is not found" })
        }

        if (!validator.isValid(productId)) {
            return res.status(400).send({ status: false, msg: "ProductId is required" })
        }

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid productId" })
        }

        if (!validator.isValid(quantity)) {
            return res.status(400).send({ status: false, msg: "quantity is required" })
        }

        if (quantity < 1) {
            return res.status(400).send({ status: false, msg: "Please provide Quantity" })
        }

        //cart from cache
        // let cartFromCache = await GET_ASYNC(userId)
        // cartFromCache = JSON.parse(cartFromCache)
        // if(cartFromCache){
        //     return res.status(200).send({ status: true, msg: "Cart from cache", data: cartFromCache })
        //}
        //if not in cache then get from db and set in cache
        let cartIdFound = await cartModel.findOne({ userId: userId, isDeleted: false }).populate('items.productId')
        if (cartIdFound) {
            // await SET_ASYNC( `${userId}` ,JSON.stringify(cartIdFound))
            return res.status(200).send({ status: true, msg: "Cart already created", data: cartIdFound })
        }



        let findProduct = await productModel.findById({ _id: productId, isDeleted: false })
        if (!findProduct) {
            return res.status(404).send({ status: false, msg: "productId is not found" })
        }

        let findCart = await cartModel.findOne({ _id: userId }).populate('items.productId')
        console.log(findCart)
        if (!findCart) {

            let data = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: quantity
                }],
                totalPrice: findProduct.price * quantity,
                totalItems: 1
            }

            await cartModel.create(data)
            const cart = await cartModel.findOne({ userId }).select({ descripton: 0, currencyId: 0, currencyFormat: 0, isFreeShipping: 0 }).populate('items.productId')
            // await SET_ASYNC(`${userId}`   ,userId, JSON.stringify(cart)) 
            return res.status(201).send({ status: true, msg: "Cart Created Successfully", data: cart })

        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })

    }
}
//===============================================Update Cart API========================================================
const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body

        if (!Object.keys(data).length)
            return res.status(400).send({ status: false, message: "Please enter some data to update the cart." })

        //userId validation
        if (!mongoose.isValidObjectId(userId))
            res.status(400).send({ status: false, msg: "Please enter a valid userId" })

        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, msg: "userId is required" })
        }

        let findUser = await cartModel.findOne({ _id: userId, isDeleted: false })//check
        if (!findUser) {
            return res.status(400).send({ status: false, msg: "User is not found" })
        }

        //cartId validation
        if (!mongoose.isValidObjectId(cartId))
            res.status(400).send({ status: false, msg: "Please enter a valid cartId" })

        if (!validator.isValid(cartId)) {
            return res.status(400).send({ status: false, msg: "cartId is required" })
        }

        let findCart = await cartModel.findOne({ _id: cartId, isDeleted: false })
        if (!findCart) {
            return res.status(400).send({ status: false, msg: "cart is not found" })
        }

        //productId validation
        if (!mongoose.isValidObjectId(productId))
            res.status(400).send({ status: false, msg: "Please enter a valid productId" })

        if (!validator.isValid(productId)) {
            return res.status(400).send({ status: false, msg: "productId is required" })
        }

        let findProduct = await cartModel.findbyId({ _id: productId, isDeleted: false })//check
        if (!findProduct) {
            return res.status(400).send({ status: false, msg: "product is not found" })
        }

        let updateCarts = await cartModel.findByIdAndUpdate({ _id: userId, isDeleted: false }, { new: true })
        if (!updateCarts)
            return res.status(404).send({ status: false, message: "cart with this userId does not exist" })

        await cartModel.findByIdAndUpdate({ _id: productId }, { removeProduct: findProduct.removeProduct - 1 }, { new: true })
        res.status(204).send({ status: false, message: "product removed from cart successfully", data: updateCarts })


    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, msg: error.msg })

    }
}
//===============================================getCart API========================================================
const getCart = async function (req, res) {


    try {
        let data = req.body
        // console.log(data)
        let userId = req.params.userId
        //console.log(userId)
        if (Object.keys(userId) == 0) {
            return res.status(400).send({ status: false, msg: "Plz, provide userId" })
        }


        let cartFromCache = await GET_ASYNC(userId)
        if (cartFromCache) {
            cartFromCache = JSON.parse(cartFromCache)
            return res.status(200).send({ status: true, msg: "Cart from cache", data: cartFromCache })
        }
        const findCart = await cartModel.findOne({ userId, isDeleted: false }).select({ __v: 0 }).populate('items.productId')
        if (findCart) {
            return res.status(200).send({ status: true, msg: "Cart found", data: findCart })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }

}



//====================================== < Delete Cart > ============================================

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, msg: "userId is required" })
        }

        if (!mongoose.isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: "Please enter a valid userId" })
        }

        if (req.userId != userId) {
            return res.status(401).send({ status: false, message: "You're not Authorized" })
        }

        const findUser = await userModel.findById(userId)
        if (!findUser) {
            return res.status(404).send({ status: false, msg: "User does not exist" })
        }

        const deletedCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })

        if (deletedCart) {
            return res.status(204).send({ status: true, msg: "All Items in cart deleted Successfully", data: deletedCart })
        }
        else {
            return res.status(404).send({ status: false, message: "Cart for this User does not exist" })
        }

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createCart, updateCart, getCart, deleteCart }
