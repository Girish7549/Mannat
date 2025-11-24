const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentMethodSchema = new Schema({
    label: String,
    upiId: String,
    qrImage: String,
    active: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
