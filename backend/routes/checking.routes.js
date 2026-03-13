const express = require('express')
const checkingServer = require('../controllers/checking')
const router = express.Router()



router.get('/' , checkingServer )


module.exports = router;