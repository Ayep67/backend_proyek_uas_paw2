const mongoose = require('mongoose');

const produkSchema = new mongoose.Schema({
  nama: { type: String, required: true, trim: true, maxlength: 120 },
  kategori: {type: String,required: true,lowercase: true,
    enum: ['kopi', 'non-kopi', 'makanan', 'snack'],},
  deskripsi: { type: String, trim: true, default: '' },
  harga: { type: Number, required: true, min: 0 },
  stok: { type: Number, required: true, min: 0, default: 0 },
  gambar: { type: String, trim: true, default: '' },
});

module.exports = mongoose.model('Produk', produkSchema);