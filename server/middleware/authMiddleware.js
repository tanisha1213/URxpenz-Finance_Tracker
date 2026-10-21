import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'xpenz_default_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id;
    req.user = { id: decoded.id, _id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};