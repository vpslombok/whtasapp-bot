function doPost(e) {
  // Parse data dari permintaan POST
  const data = JSON.parse(e.postData.contents);

  // Akses Google Sheets
  const sheet = SpreadsheetApp.openById('1xZ7LJEgH11jsFdqoNVLOHbe1d-DmTTnjjf-ASPv4ixw').getSheetByName('tes');
  
  // Menghitung jumlah baris sebelum penambahan
  const initialRowCount = sheet.getLastRow();

  // Mengubah format nomor telepon dari 6281918408597@s.whatsapp.net menjadi 081918408597
  let rawNumber = data.number.split('@')[0]; // Ambil bagian sebelum '@'
  if (rawNumber.startsWith('62')) {
    rawNumber = '0' + rawNumber.slice(2); // Ganti '62' dengan '0'
  }

  // Mengurai dan memformat laporan
  const reportData = extractReportData(data.message);
  
  // Data yang akan ditambahkan ke sheet
  const row = [
    reportData.kode,
    reportData.namaToko,
    reportData.hariTanggal,
    reportData.namaPejabat,
    reportData.ac,
    reportData.teamsSo,
    reportData.amPendamping
  ];

  try {
    // Tambahkan data ke baris baru
    sheet.appendRow(row);

    // Menghitung jumlah baris setelah penambahan
    const finalRowCount = sheet.getLastRow();

    // Periksa apakah data benar-benar tersimpan
    if (finalRowCount > initialRowCount) {
      // Kirim pesan menggunakan API hanya jika data berhasil disimpan
      const apiUrl = 'https://wa.bael.my.id/send-message';
      const payload = {
        number: rawNumber,
        message: 'Data berhasil disimpan dan pesan berhasil dikirim'
      };

      const options = {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(payload)
      };
      
      const response = UrlFetchApp.fetch(apiUrl, options);
      const responseCode = response.getResponseCode();
      
      // Periksa apakah permintaan API berhasil
      if (responseCode === 200) {
        return ContentService.createTextOutput('Data received successfully and message sent');
      } else {
        return ContentService.createTextOutput('Data received, but failed to send message');
      }
    } else {
      throw new Error("Data gagal disimpan.");
    }
    
  } catch (error) {
    console.error('Error appending data or sending message:', error);
    return ContentService.createTextOutput('Data received, but error occurred while saving data or sending message');
  }
}

function extractReportData(message) {
  const lines = message.split('\n').map(line => line.trim()).filter(line => line !== "");

  const getValue = (key) => {
    const regex = new RegExp(`${key}\\s*:\\s*(.*)`, 'i');
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return "";
  };

  return {
    kode: getValue('Kode'),
    namaToko: getValue('Nama Toko'),
    hariTanggal: getValue('Hari/Tanggal'),
    namaPejabat: getValue('Nama Pejabat First Man'),
    ac: getValue('AC'),
    teamsSo: getValue('TEAMS SO'),
    amPendamping: getValue('AM pendamping')
  };
}
