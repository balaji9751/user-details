const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const docx = require('docx');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, TextRun, BorderStyle } = docx;

// Helper to fetch users based on query parameters (id or ids list)
async function fetchUsersForDownload(req) {
  const { id, ids } = req.query;
  let sql = 'SELECT * FROM users';
  const params = [];

  if (id) {
    sql += ' WHERE id = ?';
    params.push(id);
  } else if (ids) {
    const idArray = ids.split(',').map(item => parseInt(item)).filter(item => !isNaN(item));
    if (idArray.length > 0) {
      sql += ` WHERE id IN (${idArray.map(() => '?').join(',')})`;
      params.push(...idArray);
    }
  }

  sql += ' ORDER BY created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
}

// 1. PDF Download
exports.downloadPDF = async (req, res) => {
  try {
    const users = await fetchUsersForDownload(req);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found to export' });
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: users.length === 1 ? 'portrait' : 'landscape' });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Users_Export_${Date.now()}.pdf`);
    doc.pipe(res);

    if (users.length === 1) {
      // Individual Profile Layout
      const u = users[0];
      doc.rect(0, 0, 595.28, 120).fill('#0F172A'); // Dark Blue Header Accent
      doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('ADVANCE TECH', 40, 35);
      doc.fillColor('#06B6D4').fontSize(14).text('USER PROFILE SUMMARY', 40, 65);
      
      doc.fillColor('#1E293B').fontSize(12).font('Helvetica');
      let y = 150;
      
      const drawField = (label, val, yPos) => {
        doc.font('Helvetica-Bold').text(label, 45, yPos);
        doc.font('Helvetica').text(val || '-', 200, yPos);
        doc.moveTo(40, yPos + 22).lineTo(555, yPos + 22).strokeColor('#E2E8F0').lineWidth(1).stroke();
      };

      drawField('User ID:', u.id.toString(), y); y += 30;
      drawField('Full Name:', u.fullname, y); y += 30;
      drawField('Email Address:', u.email, y); y += 30;
      drawField('Phone Number:', u.phone, y); y += 30;
      drawField('Gender:', u.gender, y); y += 30;
      drawField('Date of Birth:', new Date(u.dob).toLocaleDateString(), y); y += 30;
      drawField('Department:', u.department, y); y += 30;
      drawField('State:', u.state, y); y += 30;
      drawField('Country:', u.country, y); y += 30;
      drawField('Zip / Pincode:', u.pincode, y); y += 30;
      drawField('Full Address:', u.address, y); y += 45;
      
      doc.fontSize(10).fillColor('#64748B').text(`Exported on ${new Date().toLocaleString()} | Secure Admin Copy`, 45, 750);

    } else {
      // Landscape table list layout
      doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold').text('Advance Tech - Users List', 30, 30);
      doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(`Exported on: ${new Date().toLocaleString()} | Total Users: ${users.length}`, 30, 55);
      
      // Draw Table Header
      let y = 80;
      doc.rect(30, y, 782, 25).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
      doc.text('ID', 35, y + 8);
      doc.text('Full Name', 65, y + 8);
      doc.text('Email', 190, y + 8);
      doc.text('Phone', 330, y + 8);
      doc.text('Gender', 420, y + 8);
      doc.text('Department', 480, y + 8);
      doc.text('State', 580, y + 8);
      doc.text('Country', 660, y + 8);
      doc.text('Date', 740, y + 8);
      
      y += 25;
      doc.fillColor('#1E293B').font('Helvetica').fontSize(9);

      for (const u of users) {
        if (y > 540) {
          doc.addPage();
          y = 30;
          doc.rect(30, y, 782, 25).fill('#0F172A');
          doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
          doc.text('ID', 35, y + 8);
          doc.text('Full Name', 65, y + 8);
          doc.text('Email', 190, y + 8);
          doc.text('Phone', 330, y + 8);
          doc.text('Gender', 420, y + 8);
          doc.text('Department', 480, y + 8);
          doc.text('State', 580, y + 8);
          doc.text('Country', 660, y + 8);
          doc.text('Date', 740, y + 8);
          y += 25;
          doc.fillColor('#1E293B').font('Helvetica').fontSize(9);
        }

        doc.text(u.id.toString(), 35, y + 8);
        doc.text(u.fullname.substring(0, 22), 65, y + 8);
        doc.text(u.email.substring(0, 24), 190, y + 8);
        doc.text(u.phone, 330, y + 8);
        doc.text(u.gender, 420, y + 8);
        doc.text(u.department || '-', 480, y + 8);
        doc.text(u.state, 580, y + 8);
        doc.text(u.country, 660, y + 8);
        doc.text(new Date(u.created_at).toLocaleDateString(), 740, y + 8);

        // draw border line
        doc.moveTo(30, y + 25).lineTo(812, y + 25).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        y += 25;
      }
    }

    doc.end();

    // Log Download
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'DOWNLOAD_PDF', `Exported PDF containing ${users.length} record(s)`, req.ip]
    );

  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating PDF export' });
  }
};

// 2. Excel Download
exports.downloadExcel = async (req, res) => {
  try {
    const users = await fetchUsersForDownload(req);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users Details');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Full Name', key: 'fullname', width: 25 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phone', width: 15 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'State', key: 'state', width: 18 },
      { header: 'Country', key: 'country', width: 18 },
      { header: 'Full Address', key: 'address', width: 40 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Registration Date', key: 'created_at', width: 20 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    for (const u of users) {
      worksheet.addRow({
        id: u.id,
        fullname: u.fullname,
        email: u.email,
        phone: u.phone,
        gender: u.gender,
        dob: new Date(u.dob).toLocaleDateString(),
        department: u.department || '-',
        state: u.state,
        country: u.country,
        address: u.address,
        pincode: u.pincode,
        created_at: new Date(u.created_at).toLocaleString()
      });
    }

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Users_Export_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    // Log Action
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'DOWNLOAD_EXCEL', `Exported Excel (.xlsx) containing ${users.length} record(s)`, req.ip]
    );

  } catch (err) {
    console.error('Excel export error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating Excel export' });
  }
};

// 3. Word Download (.docx)
exports.downloadDOCX = async (req, res) => {
  try {
    const users = await fetchUsersForDownload(req);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found to export' });
    }

    let doc;

    if (users.length === 1) {
      // Detailed user profile structure
      const u = users[0];
      doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "ADVANCE TECH", bold: true, size: 36, color: "0F172A" })
              ],
              spacing: { after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "USER DETAIL PROFILE", bold: true, size: 24, color: "06B6D4" })
              ],
              spacing: { after: 240 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Field", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })], width: { size: 70, type: WidthType.PERCENTAGE } })
                  ]
                }),
                ...Object.entries({
                  'User ID': u.id.toString(),
                  'Full Name': u.fullname,
                  'Email Address': u.email,
                  'Phone Number': u.phone,
                  'Gender': u.gender,
                  'Date of Birth': new Date(u.dob).toLocaleDateString(),
                  'Department': u.department || '-',
                  'State': u.state,
                  'Country': u.country,
                  'Pincode': u.pincode,
                  'Full Address': u.address,
                  'Registration Date': new Date(u.created_at).toLocaleString()
                }).map(([k, v]) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(k)] }),
                    new TableCell({ children: [new Paragraph(v)] })
                  ]
                }))
              ]
            })
          ]
        }]
      });
    } else {
      // General List Table structure
      const headerRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ID", bold: true, color: "FFFFFF" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Full Name", bold: true, color: "FFFFFF" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Email", bold: true, color: "FFFFFF" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phone", bold: true, color: "FFFFFF" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dept", bold: true, color: "FFFFFF" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Country", bold: true, color: "FFFFFF" })] })] })
        ],
        cantSplit: true
      });

      const bodyRows = users.map(u => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(u.id.toString())] }),
          new TableCell({ children: [new Paragraph(u.fullname)] }),
          new TableCell({ children: [new Paragraph(u.email)] }),
          new TableCell({ children: [new Paragraph(u.phone)] }),
          new TableCell({ children: [new Paragraph(u.department || '-')] }),
          new TableCell({ children: [new Paragraph(u.country)] })
        ]
      }));

      doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Advance Tech - Exported Users Report", bold: true, size: 28, color: "0F172A" })
              ],
              spacing: { after: 200 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [headerRow, ...bodyRows]
            })
          ]
        }]
      });
    }

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Users_Export_${Date.now()}.docx`);
    res.send(buffer);

    // Log Action
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'DOWNLOAD_DOCX', `Exported Word (.docx) containing ${users.length} record(s)`, req.ip]
    );

  } catch (err) {
    console.error('Word export error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating Word export' });
  }
};

// 4. CSV Download
exports.downloadCSV = async (req, res) => {
  try {
    const users = await fetchUsersForDownload(req);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found to export' });
    }

    // Generate CSV contents manually to avoid packages issues
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Gender', 'DOB', 'Department', 'State', 'Country', 'Address', 'Pincode', 'Registration Date'];
    
    // Escaping function for CSV cells
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = val.toString().replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    };

    const rows = users.map(u => [
      u.id,
      u.fullname,
      u.email,
      u.phone,
      u.gender,
      new Date(u.dob).toLocaleDateString(),
      u.department || '',
      u.state,
      u.country,
      u.address,
      u.pincode,
      new Date(u.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(escapeCSV).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Users_Export_${Date.now()}.csv`);
    res.send(csvContent);

    // Log Action
    await db.query(
      'INSERT INTO admin_activity_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'DOWNLOAD_CSV', `Exported CSV containing ${users.length} record(s)`, req.ip]
    );

  } catch (err) {
    console.error('CSV export error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating CSV export' });
  }
};
