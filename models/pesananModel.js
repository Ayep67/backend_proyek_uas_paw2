const mongoose = require('mongoose');

const pesananItemSchema = new mongoose.Schema({
  idProduk: { type: mongoose.Schema.Types.ObjectId, ref: 'Produk', required: true },
  namaProduk: { type: String, required: true },
  harga: { type: Number, required: true, min: 0 },
  jumlah: { type: Number, required: true, min: 1, default: 1 },
  catatan: { type: String, trim: true, default: '' },
}, { _id: false });

const pesananSchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  namaUser: { type: String, required: true, lowercase: true },
  items: { type: [pesananItemSchema], required: true, validate: v => v.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  biayaPengiriman: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  metodeAntar: { type: String, enum: ['pickup', 'delivery'], required: true },
  alamat: { type: String, trim: true, default: '' },
  metodePembayaran: { type: String, enum: ['bank', 'ewallet'], required: true },
  eWallet: { type: String, enum: ['GoPay', 'OVO', 'DANA'], default: undefined },
  status: { type: String, enum: ['Diproses', 'Siap Diambil', 'Diantar', 'Selesai'], default: 'Diproses' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pesanan', pesananSchema);