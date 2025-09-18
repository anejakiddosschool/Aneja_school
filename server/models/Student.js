// backend/models/Student.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ["Male", "Female"] },
    dateOfBirth: { type: Date, required: true },
    gradeLevel: { type: String, required: true, trim: true },

    status: {
      type: String,
      required: true,
      enum: ["Active", "Graduated", "Withdrawn"],
      default: "Active",
    },
    password: { type: String, required: true, select: false },
    isInitialPassword: { type: Boolean, default: true },
    imageUrl: {
      type: String,
      default:
        "https://static.vecteezy.com/system/resources/previews/004/999/659/non_2x/geek-boy-with-graduation-hat-and-blue-eyeglasses-free-vector.jpg",
    },
    reportCardUrl: { type: String, default: "" },
    reportCardPublicId: { type: String, default: "" },
    // NEW: store class test reports in Cloudinary
    // STORE only one latest file just like report card
    reportClassTestUrl: { type: String, default: "" },
    reportClassTestPublicId: { type: String, default: "" },

    parentContact: {
      parentName: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },

    section: {
      type: String,
      trim: true,
    },
    rollNumber: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Student", studentSchema);
