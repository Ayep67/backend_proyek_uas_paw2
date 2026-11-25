// Membuat akun admin, atau menaikkan akun yang sudah ada menjadi admin.
// Pakai: npm run buat-admin -- <nama> <email> <password>
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');

async function main() {
  const [namaInput, emailInput, password] = process.argv.slice(2);
  const nama = namaInput?.trim();
  const email = emailInput?.trim().toLowerCase();
  if (!nama || !email || !password || password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error('Pakai: npm run buat-admin -- <nama> <email> <password 8-72 byte>');
  }
  await mongoose.connect(process.env.DB_URI);

  const hashed = await bcrypt.hash(password, 10);
  let user = await User.findOne({ email });
  if (user) {
    user.nama = nama;
    user.password = hashed;
    user.role = 'admin';
    await user.save();
  } else {
    user = await User.create({ nama, email, password: hashed, role: 'admin' });
  }
  console.log(`Admin siap: ${user.email} (role: ${user.role})`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err.message); process.exit(1); });