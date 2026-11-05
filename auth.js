import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "supportpilot-dev-secret";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const sanitizeUser = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role || "customer",
});

export async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!/^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "customer",
    });

    const token = jwt.sign({ sub: String(newUser._id), role: newUser.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(201).json({
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Registration failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password ?? "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ sub: String(user._id), role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
}

export function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource" });
    }

    next();
  };
}
