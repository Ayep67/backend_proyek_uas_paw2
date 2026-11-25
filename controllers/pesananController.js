const Pesanan = require('../models/pesananModel');
const mongoose = require('mongoose');
const { errorHttp } = require('../middlewares/errorHandler');

const LIMIT_DEFAULT = 10;
const LIMIT_MAKS = 50;
const FIELD_SORT = ['idUser', 'namaUser', 'createdAt'];
const FIELD_BOLEH_DIPILIH = [
  'idUser',
  'namaUser',
  'items',
  'subtotal',
  'biayaPengiriman',
  'total',
  'metodeAntar',
  'alamat',
  'metodePembayaran',
  'eWallet',
  'status',
  'createdAt',
];

// Mengubah bilangan dari query string menjadi bilangan bulat yang aman
function angkaAman(nilai, bawaan, min, maks) {
  const n = parseInt(nilai, 10);
  if (Number.isNaN(n)) return bawaan;
  return Math.min(Math.max(n, min), maks);
}

function nilaiUang(nilai, field) {
  const angka = typeof nilai === 'string' && nilai.trim() !== '' ? Number(nilai) : nilai;
  if (typeof angka !== 'number' || !Number.isFinite(angka) || angka < 0) {
    throw errorHttp(400, `${field} harus berupa angka tidak negatif`);
  }
  return angka;
}

function hitungRincianPesanan(subtotal, biayaPengiriman) {
  const subtotalAngka = nilaiUang(subtotal, 'subtotal');
  const biayaPengirimanAngka = nilaiUang(biayaPengiriman, 'biayaPengiriman');
  const total = subtotalAngka + biayaPengirimanAngka;
  if (!Number.isFinite(total)) {
    throw errorHttp(400, 'total pesanan tidak valid');
  }
  return {
    subtotal: subtotalAngka,
    biayaPengiriman: biayaPengirimanAngka,
    total,
  };
}

function tampilkanDenganTotal(pesanan) {
  const data = pesanan.toObject();
  if (typeof data.subtotal === 'number' && typeof data.biayaPengiriman === 'number') {
    const total = data.subtotal + data.biayaPengiriman;
    if (Number.isFinite(total)) data.total = total;
  }
  return data;
}

function biayaDariBody(body) {
  return body.biayaPengiriman === undefined
    ? body.biayapengiriman
    : body.biayaPengiriman;
}

exports.create = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw errorHttp(400, 'Body pesanan harus berupa object JSON');
  }
  if (req.body.status !== undefined) {
    throw errorHttp(400, 'Status pesanan ditentukan otomatis saat pesanan dibuat');
  }

  const biayaInput = biayaDariBody(req.body);
  const { subtotal, biayaPengiriman, total } = hitungRincianPesanan(
    req.body.subtotal,
    biayaInput === undefined ? 0 : biayaInput
  );

  try {
    const pesanan = await Pesanan.create({
      idUser: req.user.id,
      namaUser: req.user.nama,
      items: req.body.items,
      subtotal,
      biayaPengiriman,
      total,
      metodeAntar: req.body.metodeAntar,
      alamat: req.body.alamat || req.user.alamat,
      metodePembayaran: req.body.metodePembayaran,
      eWallet: req.body.eWallet,
    });
    res.status(201).json(pesanan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  const filter = {};
  if (req.query.namaUser) {
    filter.namaUser = { $regex: String(req.query.namaUser), $options: 'i' };
  }
  if (req.query.produk) {
    const produk = String(req.query.produk);
    if (mongoose.Types.ObjectId.isValid(produk)) {
      filter['items.produk'] = produk;
    } else {
      filter['items.namaProduk'] = { $regex: produk, $options: 'i' };
    }
  }

  const page = angkaAman(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = angkaAman(req.query.limit, LIMIT_DEFAULT, 1, LIMIT_MAKS);

  // Sorting: ?sort=nama (naik) atau ?sort=-nama (turun). Bawaan: terbaru dulu
  const sortParam = String(req.query.sort || '-createdAt');
  const arah = sortParam.startsWith('-') ? -1 : 1;
  const sortField = sortParam.replace(/^-/, '');
  if (!FIELD_SORT.includes(sortField)) {
    throw errorHttp(400, `sort hanya boleh: ${FIELD_SORT.join(', ')}`);
  }

  // Projection: ?fields=namaUser,alamat,status
  let select = '';
  if (req.query.fields) {
    const fields = String(req.query.fields).split(',').map((f) => f.trim());
    if (!fields.every((f) => FIELD_BOLEH_DIPILIH.includes(f))) {
      throw errorHttp(400, `fields hanya boleh: ${FIELD_BOLEH_DIPILIH.join(', ')}`);
    }
    select = fields.join(' ');
  }

  const query = Pesanan.find(filter)
    .select(select)
    .sort({ [sortField]: arah, _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  query.populate('idUser', 'nama email noTelp alamat');
  query.populate('items.produk', 'nama kategori harga');

  const [data, total] = await Promise.all([query, Pesanan.countDocuments(filter)]);

  res.json({
    data: data.map(tampilkanDenganTotal),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

exports.getById = async (req, res) => {
  const data = await Pesanan.findById(req.params.id)
    .populate('idUser', 'nama email noTelp alamat')
    .populate('items.produk', 'nama kategori harga');
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.json(tampilkanDenganTotal(data));
};

exports.getByUser = async (req, res) => {
  const data = await Pesanan.find({ idUser: req.params.idUser })
    .populate('idUser', 'nama email noTelp alamat')
    .populate('items.produk', 'nama kategori harga');
  res.json(data.map(tampilkanDenganTotal));
};

exports.update = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw errorHttp(400, 'Body pesanan harus berupa object JSON');
  }

  const pesanan = await Pesanan.findById(req.params.id);
  if (!pesanan) throw errorHttp(404, 'Data tidak ditemukan');

  const subtotalInput = req.body.subtotal === undefined ? pesanan.subtotal : req.body.subtotal;
  const biayaInput = biayaDariBody(req.body);
  const biayaPengirimanInput = biayaInput === undefined ? pesanan.biayaPengiriman : biayaInput;
  const { subtotal, biayaPengiriman, total } = hitungRincianPesanan(
    subtotalInput,
    biayaPengirimanInput
  );
  const perubahan = { ...req.body, subtotal, biayaPengiriman, total };
  delete perubahan.biayapengiriman;

  const data = await Pesanan.findByIdAndUpdate(
    req.params.id,
    perubahan,
    { returnDocument: 'after', runValidators: true }
  );
  res.json(data);
};

exports.remove = async (req, res) => {
  const data = await Pesanan.findByIdAndDelete(req.params.id);
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.status(204).send();
};