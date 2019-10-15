const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'User must have a name']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'User must have an E-mail'],
    lowercase: true
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'User must have a password'],
    minlength: process.env.USER_PASSWORD_LENGTH,
    select: false
  },
  confirmPassword: {
    type: String,
    required: [true, 'Confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords do not match'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user'
  },
  passwordChangedAt: Date
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;

  next();
});

userSchema.methods.correctPassword = async function(
  enteredPassword,
  userPassword
) {
  return await bcrypt.compare(enteredPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTtimestamp) {
  if (this.passwordChangedAt) {
    // Convert from passwordChangedAt from date to timestamp
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTtimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
