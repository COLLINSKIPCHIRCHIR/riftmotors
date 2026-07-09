import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Role guard — use after protect
export const requirePermission = (...permissions) => {
    return (req, res, next) => {
        const userPermissions = req.user.permissions || [];

        const allowed = permissions.every(permission =>
            userPermissions.includes(permission)
        );

        if (!allowed) {
            return res.status(403).json({
                message: "Access denied."
            });
        }

        next();
    };
};