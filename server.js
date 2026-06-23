// Entry point untuk cPanel Node.js Selector
// Skrip ini akan meneruskan eksekusi ke server standalone yang dihasilkan Next.js

const path = require('path');
const fs = require('fs');

const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServerPath)) {
    // Jalankan server standalone
    require(standaloneServerPath);
} else {
    console.error("Error: File .next/standalone/server.js tidak ditemukan.");
    console.error("Pastikan Anda telah menjalankan perintah 'npm run build' di lokal dan mengunggah folder .next/.");
    process.exit(1);
}
