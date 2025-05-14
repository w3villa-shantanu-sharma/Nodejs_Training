const db = require('../DB/dbconfig');


module.exports = (requiredStep) => {
    return async (req, res, next) => {
      const { email } = req.body;
      const [[user]] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      
      if (!user) return res.status(404).json({ message: "User not found" });
  
      if (user.next_action !== requiredStep) {
        return res.status(403).json({ message: `Please complete step: ${user.next_action} first.` });
      }
  
      req.user = user;
      next();
    };
  };
  