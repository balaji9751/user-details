const http = require('http');
const db = require('../config/db');

// Helper to send XML request to TallyPrime
function fetchFromTally(xmlPayload, host = '127.0.0.1', port = 8000) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(xmlPayload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(xmlPayload);
    req.end();
  });
}

exports.getTallyLedger = async (req, res) => {
  // Query config first
  let host = '127.0.0.1';
  let port = 8000;
  try {
    const [configRows] = await db.query('SELECT host, port FROM tally_config WHERE id = 1');
    if (configRows && configRows.length > 0) {
      host = configRows[0].host;
      port = configRows[0].port;
    }
  } catch (err) {
    // Fallback to default
  }

  // XML Envelope to fetch ledgers from TallyPrime
  const xmlPayload = `
  <ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Export</TALLYREQUEST>
      <TYPE>Collection</TYPE>
      <ID>LedgerCollection</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
        <TDL>
          <TDLMessage>
            <COLLECTION Name="LedgerCollection">
              <TYPE>Ledger</TYPE>
              <FETCH>Name, Parent, LEDGERPHONE, EMAIL, LEDGERSTATE, COUNTRY, PINCODE, ADDRESS</FETCH>
            </COLLECTION>
          </TDLMessage>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>`;

  try {
    const tallyResponse = await fetchFromTally(xmlPayload, host, port);
    
    // Parse Ledgers
    const ledgers = [];
    const ledgerBlocks = tallyResponse.match(/<LEDGER[\s\S]*?<\/LEDGER>/gi) || [];

    for (const block of ledgerBlocks) {
      const name = (block.match(/<NAME>([\s\S]*?)<\/NAME>/i) || [])[1] || '';
      const parent = (block.match(/<PARENT[^>]*>([\s\S]*?)<\/PARENT>/i) || [])[1] || '';
      const phone = (block.match(/<LEDGERPHONE[^>]*>([\s\S]*?)<\/LEDGERPHONE>/i) || [])[1] || '';
      const email = (block.match(/<EMAIL[^>]*>([\s\S]*?)<\/EMAIL>/i) || [])[1] || '';
      const state = (block.match(/<LEDGERSTATE[^>]*>([\s\S]*?)<\/LEDGERSTATE>/i) || [])[1] || '';
      const country = (block.match(/<COUNTRY[^>]*>([\s\S]*?)<\/COUNTRY>/i) || [])[1] || '';
      const pincode = (block.match(/<PINCODE[^>]*>([\s\S]*?)<\/PINCODE>/i) || [])[1] || '';
      
      const addressMatches = block.match(/<ADDRESS[^>]*>([\s\S]*?)<\/ADDRESS>/gi) || [];
      const address = addressMatches.map(m => m.replace(/<ADDRESS[^>]*>|<\/ADDRESS>/gi, '').trim()).join(', ') || '';

      if (name) {
        ledgers.push({
          name: name.trim(),
          under: parent.trim(),
          phone: phone.trim().substring(0, 10) || '',
          email: email.trim() || '',
          state: state.trim() || 'Maharashtra',
          country: country.trim() || 'India',
          pincode: pincode.trim() || '400001',
          address: address.trim() || 'Tally Registered Office Address'
        });
      }
    }

    if (ledgers.length === 0) {
      throw new Error('No ledgers found in Tally response');
    }

    return res.json({
      success: true,
      source: `TallyPrime Live ODBC Connection (${host}:${port})`,
      ledgers: ledgers
    });

  } catch (error) {
    return res.status(503).json({
      success: false,
      message: `TallyPrime is currently offline or unreachable on host ${host}:${port}.`
    });
  }
};

// GET /api/tally/config - Get sync configuration
exports.getSyncConfig = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tally_config WHERE id = 1');
    if (rows && rows.length > 0) {
      const config = rows[0];
      return res.status(200).json({
        success: true,
        config: {
          host: config.host,
          port: config.port.toString(),
          syncInterval: config.sync_interval.toString(),
          autoSyncEnabled: !!config.auto_sync
        }
      });
    }
    return res.status(200).json({
      success: true,
      config: { host: '127.0.0.1', port: '8000', syncInterval: '10', autoSyncEnabled: true }
    });
  } catch (err) {
    console.error('Error fetching Tally config:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching config.' });
  }
};

// POST /api/tally/config - Update sync configuration
exports.updateSyncConfig = async (req, res) => {
  const { host, port, syncInterval, autoSyncEnabled } = req.body;
  try {
    const autoSyncVal = autoSyncEnabled ? 1 : 0;
    await db.query(
      'UPDATE tally_config SET host = ?, port = ?, sync_interval = ?, auto_sync = ? WHERE id = 1',
      [host, parseInt(port) || 8000, parseInt(syncInterval) || 10, autoSyncVal]
    );

    // Restart the background sync timer dynamically
    exports.startTallyAutoSync();

    return res.status(200).json({
      success: true,
      message: 'Tally configuration updated successfully.'
    });
  } catch (err) {
    console.error('Error updating Tally config:', err);
    return res.status(500).json({ success: false, message: 'Server error updating config.' });
  }
};

// Main Auto Sync Logic
async function syncTallyDataToDb() {
  let host = '127.0.0.1';
  let port = 8000;
  try {
    const [configRows] = await db.query('SELECT host, port FROM tally_config WHERE id = 1');
    if (configRows && configRows.length > 0) {
      host = configRows[0].host;
      port = configRows[0].port;
    }
  } catch (err) {
    // Fallback
  }

  const xmlPayload = `
  <ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Export</TALLYREQUEST>
      <TYPE>Collection</TYPE>
      <ID>LedgerCollection</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
        <TDL>
          <TDLMessage>
            <COLLECTION Name="LedgerCollection">
              <TYPE>Ledger</TYPE>
              <FETCH>Name, Parent, LEDGERPHONE, EMAIL, LEDGERSTATE, COUNTRY, PINCODE, ADDRESS</FETCH>
            </COLLECTION>
          </TDLMessage>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>`;

  let ledgers = [];
  try {
    const tallyResponse = await fetchFromTally(xmlPayload, host, port);
    const ledgerBlocks = tallyResponse.match(/<LEDGER[\s\S]*?<\/LEDGER>/gi) || [];

    for (const block of ledgerBlocks) {
      const name = (block.match(/<NAME>([\s\S]*?)<\/NAME>/i) || [])[1] || '';
      const parent = (block.match(/<PARENT[^>]*>([\s\S]*?)<\/PARENT>/i) || [])[1] || '';
      const phone = (block.match(/<LEDGERPHONE[^>]*>([\s\S]*?)<\/LEDGERPHONE>/i) || [])[1] || '';
      const email = (block.match(/<EMAIL[^>]*>([\s\S]*?)<\/EMAIL>/i) || [])[1] || '';
      const state = (block.match(/<LEDGERSTATE[^>]*>([\s\S]*?)<\/LEDGERSTATE>/i) || [])[1] || '';
      const country = (block.match(/<COUNTRY[^>]*>([\s\S]*?)<\/COUNTRY>/i) || [])[1] || '';
      const pincode = (block.match(/<PINCODE[^>]*>([\s\S]*?)<\/PINCODE>/i) || [])[1] || '';
      
      const addressMatches = block.match(/<ADDRESS[^>]*>([\s\S]*?)<\/ADDRESS>/gi) || [];
      const address = addressMatches.map(m => m.replace(/<ADDRESS[^>]*>|<\/ADDRESS>/gi, '').trim()).join(', ') || '';

      if (name) {
        ledgers.push({
          name: name.trim(),
          under: parent.trim(),
          phone: phone.trim().substring(0, 10) || '',
          email: email.trim() || '',
          state: state.trim() || 'Maharashtra',
          country: country.trim() || 'India',
          pincode: pincode.trim() || '400001',
          address: address.trim() || 'Tally Registered Office Address'
        });
      }
    }
  } catch (error) {
    console.log(`[Tally Auto Sync] Connection offline. TallyPrime server is unreachable on ${host}:${port}.`);
    return;
  }

  // Iterate over ledgers and write to Database
  for (const ledger of ledgers) {
    try {
      const fullname = ledger.name;
      const email = ledger.email || `${fullname.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
      
      let phone = ledger.phone;
      if (!phone) {
        let hash = 0;
        for (let i = 0; i < fullname.length; i++) {
          hash = fullname.charCodeAt(i) + ((hash << 5) - hash);
        }
        phone = '9' + Math.abs(hash).toString().substring(0, 9).padEnd(9, '0');
      }

      // Check if user already exists
      const [existing] = await db.query(
        'SELECT id FROM users WHERE phone = ? OR email = ? OR fullname = ?',
        [phone, email, fullname]
      );

      if (existing && existing.length > 0) {
        // Already synced/exists
        continue;
      }

      // Map under/parent to department
      const departments = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Product Management'];
      let mappedDept = 'Sales';
      if (departments.includes(ledger.under)) {
        mappedDept = ledger.under;
      } else if (ledger.under.toLowerCase().includes('debtor') || ledger.under.toLowerCase().includes('creditor')) {
        mappedDept = 'Finance';
      } else if (ledger.under.toLowerCase().includes('sale')) {
        mappedDept = 'Sales';
      } else if (ledger.under.toLowerCase().includes('admin') || ledger.under.toLowerCase().includes('office')) {
        mappedDept = 'Operations';
      }

      const sql = `
        INSERT INTO users (fullname, email, phone, gender, dob, department, state, country, address, pincode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        fullname,
        email,
        phone,
        'Male',
        '1995-05-15',
        mappedDept,
        ledger.state || 'Maharashtra',
        ledger.country || 'India',
        ledger.address || 'Tally imported address',
        ledger.pincode || '400001'
      ];

      await db.query(sql, params);
      console.log(`[Tally Auto Sync] Saved new ledger user: '${fullname}' (${mappedDept})`);
    } catch (err) {
      console.error(`[Tally Auto Sync] Error saving ledger '${ledger.name}':`, err.message);
    }
  }
}

// Function to start the background auto sync
let syncIntervalRef = null;
exports.startTallyAutoSync = async () => {
  if (syncIntervalRef) {
    clearInterval(syncIntervalRef);
    syncIntervalRef = null;
  }

  try {
    const [rows] = await db.query('SELECT * FROM tally_config WHERE id = 1');
    if (rows && rows.length > 0) {
      const config = rows[0];
      const isAutoSync = !!config.auto_sync;
      const intervalMs = (config.sync_interval || 10) * 1000;

      if (isAutoSync) {
        console.log(`[Tally Auto Sync] Background sync started. Host=${config.host}, Port=${config.port}, Interval=${config.sync_interval}s`);
        syncTallyDataToDb();
        syncIntervalRef = setInterval(syncTallyDataToDb, intervalMs);
      } else {
        console.log('[Tally Auto Sync] Background sync is currently disabled.');
      }
    } else {
      syncIntervalRef = setInterval(syncTallyDataToDb, 10000);
    }
  } catch (err) {
    console.error('[Tally Auto Sync] Failed to load config and start sync:', err.message);
  }
};
