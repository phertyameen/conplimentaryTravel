import { registerAs } from "@nestjs/config"

export default registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET || "super-secret-key-to-change-in-production",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  issuer: process.env.JWT_ISSUER || "complimentary-travel-insurance",
  audience: process.env.JWT_AUDIENCE || "complimentary-travel-insurance",
}))