import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  phone: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

export default model<IUser>("User", userSchema);
