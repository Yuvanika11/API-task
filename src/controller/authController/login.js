import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config/properties.js";
import dbConnection from "../../db/dbConnection.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!(username && password)) {
    return res.status(401).send({
      status: "failure",
      message: "Username or Password is missing",
    });
  }
  try {
    const query = `select * from users where username = $1`;
    const { rows: user } = await dbConnection.query(query, [username]);
    console.log("Generated user:", user);

    if (!user || user.length === 0) {
      return res.status(404).send({
        status: "failure",
        message: "User not found",
      });
    }
    const passwordMatch = await bcrypt.compare(password, user[0].password);

    console.log("Generated passwordMatch:", passwordMatch);
    if (!passwordMatch) {
      return res.status(401).send({
        status: "failure",
        message: "Invalid Password",
      });
    }
    const dataToTokenize = {
      role: user[0].role,
    };
    const token = jwt.sign(dataToTokenize, process.env.secret, {
      expiresIn: config.jwtExpiryTime,
    });

    return res.status(200).send({
      status: "success",
      message: "Login Successful",
      token: token,
    });
  } catch (err) {
    console.error("Database Error:", err);
    return res.status(500).send({
      status: "failure",
      message: "Internal Server Error",
    });
  }
};
