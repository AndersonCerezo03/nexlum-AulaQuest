const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, required: true },
  englishLevel:     { type: String, enum: ['A1','A2','B1','B2','C1','C2'], default: 'A1' },
  experiencePoints: { type: Number, default: 0 },
  wordsCorrect:     { type: Number, default: 0 },
}, { timestamps: true });

userSchema.methods.toJSON = function() {
  var o = this.toObject();
  delete o.password;
  return o;
};

module.exports = mongoose.model('User', userSchema);