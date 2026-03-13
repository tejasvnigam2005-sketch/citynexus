const checkingServer = (req,res) => {
    return res.status(200).json({
        message:"Server is running"
    });
}

module.exports = checkingServer
