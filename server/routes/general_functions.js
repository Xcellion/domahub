module.exports = {
  sendSuccess : function(req, res, next){
    res.send({
      state: "success"
    });
  },

  sendError : function(req, res, next){
    res.send({
      state: "error"
    });
  }
}
