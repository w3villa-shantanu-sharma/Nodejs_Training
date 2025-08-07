import db from '../DB/dbconfig.js';

export default (requiredStep) => {
  return async (req, res, next) => {
    try {
      // Safely extract email string, whether it's a string or inside an object
      const emailValue = req.body.email;
      const email = typeof emailValue === 'object' && emailValue !== null ? emailValue.email : emailValue;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Use parameterized query to prevent SQL injection
      const [rows] = await db.query(
        "SELECT * FROM users WHERE email = ?", 
        [email]
      );
      
      const user = rows[0];

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.next_action !== requiredStep) {
        return res.status(403).json({ 
          message: `Please complete step: ${user.next_action} first.` 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("checkNextAction middleware error:", error);
      return res.status(500).json({ 
        message: "Server error checking user status" 
      });
    }
  };
};
