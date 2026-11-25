const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { errorHttp } = require('../middlewares/errorHandler');

const SALT_ROUNDS = 10;
const PASSWORD_MIN = 8;
const PASSWORD_MAKS_BYTE = 72; // batas bcrypt: karakter setelah byte ke-72 diabaikan

exports.register = async (req, res) => {
  const { nama, email, password, noTelp = '', alamat = '' } = req.body;

  if (typeof nama !== 'string' || !nama.trim()) {
    throw errorHttp(400, 'Nama wajib diisi');
  }
  if (typeof email !== 'string' || !email.trim()) {
    throw errorHttp(400, 'Email wajib diisi');
  }

  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    throw errorHttp(400, `password wajib diisi, minimal ${PASSWORD_MIN} karakter`);
  }
  if (typeof noTelp !== 'string' || !noTelp.trim()) {
    throw errorHttp(400, 'Nomor telepon wajib diisi');
  }
  if (typeof alamat !== 'string' || !alamat.trim()) {
    throw errorHttp(400, 'Alamat wajib diisi');
  }
  if (Buffer.byteLength(password) > PASSWORD_MAKS_BYTE) {
    throw errorHttp(400, `password maksimal ${PASSWORD_MAKS_BYTE} byte`);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    nama: nama.trim(),
    email: email.trim(),
    password: hashed,
    noTelp: noTelp.trim(),
    alamat: alamat.trim(),
  });
  res.status(201).json({
    id: user._id,
    nama: user.nama,
    email: user.email,
    noTelp: user.noTelp,
    alamat: user.alamat,
    role: user.role,
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Harus berupa teks: mencegah objek seperti { "$ne": null } masuk ke kueri
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw errorHttp(400, 'email dan password wajib diisi');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  const cocok = user ? await bcrypt.compare(password, user.password) : false;
  // Pesan sama untuk "email tidak ada" dan "password salah"
  if (!cocok) throw errorHttp(401, 'Email atau password salah');

  const token = jwt.sign(
    {
      id: user._id,
      nama: user.nama,
      email: user.email,
      noTelp: user.noTelp,
      alamat: user.alamat,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  res.json({ token });
};

// Contoh endpoint yang membaca data pengguna dari token
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw errorHttp(404, 'Pengguna tidak ditemukan');

  res.json({
    id: user._id,
    nama: user.nama,
    email: user.email,
    noTelp: user.noTelp,
    alamat: user.alamat,
    role: user.role,
    berlakuSampai: new Date(req.user.exp * 1000),
  });
};