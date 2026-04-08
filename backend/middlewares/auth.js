import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY;

function verifyJWT(req, res, next) {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).json({ auth: false, message: "Token não fornecido." });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ auth: false, message: "Token inválido." });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Acesso negado. Apenas admin." });
  }
  next();
}

export { verifyJWT, verifyAdmin, SECRET_KEY };