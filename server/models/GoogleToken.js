const mongoose = require('mongoose');

const googleTokenSchema = new mongoose.Schema({
  access_token: { type: String },
  refresh_token: { type: String },
  scope: { type: String },
  token_type: { type: String },
  expiry_date: { type: Number }, // ms since epoch
}, { timestamps: true });

// Singleton helpers
googleTokenSchema.statics.getToken = async function() {
  const doc = await this.findOne();
  return doc || null;
};

googleTokenSchema.statics.setToken = async function(tokens) {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create(tokens);
  } else {
    Object.assign(doc, tokens);
    await doc.save();
  }
  return doc;
};

module.exports = mongoose.model('GoogleToken', googleTokenSchema);
