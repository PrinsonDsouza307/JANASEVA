/**
 * JANASEVA – MongoDB REST API Controller
 * 
 * Implements HTTP request handlers for MongoDB collections:
 * complaints, users, panchayats, notifications, activity logs.
 */

const mongoManager = require('./mongo-client.cjs');

// Parse request body helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

async function handleMongoApi(req, res, pathname, queryParams) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  // Route 1: Health & Diagnostics (/api/mongo/health)
  if (pathname === '/api/mongo/health') {
    const health = await mongoManager.healthCheck();
    sendJson(res, 200, health);
    return true;
  }

  // Route 2: Test / Set Connection URI (/api/mongo/connect)
  if (pathname === '/api/mongo/connect' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (body.uri) {
        await mongoManager.close();
        const success = await mongoManager.connect(body.uri);
        const health = await mongoManager.healthCheck();
        sendJson(res, success ? 200 : 400, {
          success,
          message: success ? 'Connected to MongoDB' : 'Connection failed',
          details: health
        });
      } else {
        const success = await mongoManager.connect();
        const health = await mongoManager.healthCheck();
        sendJson(res, success ? 200 : 400, {
          success,
          message: success ? 'Connected using default config' : 'Connection failed',
          details: health
        });
      }
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  // If MongoDB is not connected, respond with informative status for data routes
  if (!mongoManager.isConnected) {
    if (pathname.startsWith('/api/mongo/')) {
      sendJson(res, 503, {
        error: 'MongoDB is not connected.',
        message: 'Provide your connection string via mongodb.config.json or POST /api/mongo/connect',
        status: 'DISCONNECTED',
        configuredUri: mongoManager.maskUri(mongoManager.config.uri)
      });
      return true;
    }
    return false;
  }

  const db = mongoManager.db;

  try {
    // -------------------------------------------------------------
    // Complaints Routes (/api/mongo/complaints)
    // -------------------------------------------------------------
    if (pathname === '/api/mongo/complaints') {
      if (req.method === 'GET') {
        const filter = {};
        if (queryParams.userId) filter.userId = queryParams.userId;
        if (queryParams.citizenEmail) filter.citizenEmail = queryParams.citizenEmail.toLowerCase();
        if (queryParams.panchayatId) filter.panchayatId = queryParams.panchayatId;
        if (queryParams.status) filter.status = queryParams.status;
        if (queryParams.category) filter.category = queryParams.category;

        const limit = parseInt(queryParams.limit) || 100;
        const complaints = await db.collection('complaints')
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray();

        sendJson(res, 200, { success: true, count: complaints.length, data: complaints });
        return true;
      }

      if (req.method === 'POST') {
        const complaint = await parseBody(req);
        if (!complaint.complaintId) {
          complaint.complaintId = 'JAN-' + Date.now();
        }
        if (!complaint.createdAt) {
          complaint.createdAt = new Date().toISOString();
        }
        complaint.updatedAt = new Date().toISOString();

        // Upsert by complaintId
        const result = await db.collection('complaints').updateOne(
          { complaintId: complaint.complaintId },
          { $set: complaint },
          { upsert: true }
        );

        // Record activity log
        await db.collection('activity_logs').insertOne({
          action: 'COMPLAINT_SUBMITTED',
          recordId: complaint.complaintId,
          timestamp: new Date().toISOString(),
          actor: complaint.citizenName || complaint.citizenEmail || 'Citizen'
        });

        sendJson(res, 201, { success: true, complaintId: complaint.complaintId, data: complaint });
        return true;
      }
    }

    // Single complaint by ID (/api/mongo/complaints/:id)
    const complaintMatch = pathname.match(/^\/api\/mongo\/complaints\/([^\/]+)$/);
    if (complaintMatch) {
      const complaintId = decodeURIComponent(complaintMatch[1]);

      if (req.method === 'GET') {
        const item = await db.collection('complaints').findOne({ complaintId });
        if (!item) {
          sendJson(res, 404, { error: 'Complaint not found', complaintId });
        } else {
          sendJson(res, 200, { success: true, data: item });
        }
        return true;
      }

      if (req.method === 'PUT' || req.method === 'PATCH') {
        const updates = await parseBody(req);
        updates.updatedAt = new Date().toISOString();
        delete updates._id; // Never overwrite MongoDB ObjectID

        const result = await db.collection('complaints').updateOne(
          { complaintId },
          { $set: updates }
        );

        if (result.matchedCount === 0) {
          sendJson(res, 404, { error: 'Complaint not found', complaintId });
        } else {
          const updated = await db.collection('complaints').findOne({ complaintId });
          sendJson(res, 200, { success: true, data: updated });
        }
        return true;
      }

      if (req.method === 'DELETE') {
        const result = await db.collection('complaints').deleteOne({ complaintId });
        sendJson(res, 200, { success: true, deleted: result.deletedCount > 0 });
        return true;
      }
    }

    // -------------------------------------------------------------
    // Users & Auth Routes (/api/mongo/auth/*)
    // -------------------------------------------------------------
    if (pathname === '/api/mongo/auth/register' && req.method === 'POST') {
      const user = await parseBody(req);
      if (!user.email) {
        sendJson(res, 400, { error: 'Email is required' });
        return true;
      }

      const email = user.email.toLowerCase().trim();
      const existing = await db.collection('users').findOne({ email });
      if (existing) {
        sendJson(res, 409, { error: 'User with this email already exists' });
        return true;
      }

      user.email = email;
      user.uid = user.uid || 'usr-' + Date.now().toString(36);
      user.role = user.role || 'citizen';
      user.createdAt = user.createdAt || new Date().toISOString();

      await db.collection('users').insertOne(user);
      sendJson(res, 201, { success: true, user });
      return true;
    }

    if (pathname === '/api/mongo/auth/login' && req.method === 'POST') {
      const { email, password } = await parseBody(req);
      if (!email || !password) {
        sendJson(res, 400, { error: 'Email and password required' });
        return true;
      }

      const cleanEmail = email.toLowerCase().trim();
      const user = await db.collection('users').findOne({ email: cleanEmail });

      if (!user || (user.password && user.password !== password)) {
        sendJson(res, 401, { error: 'Invalid email or password' });
        return true;
      }

      const safeUser = { ...user };
      delete safeUser.password;
      sendJson(res, 200, { success: true, user: safeUser });
      return true;
    }

    // -------------------------------------------------------------
    // Panchayats Routes (/api/mongo/panchayats)
    // -------------------------------------------------------------
    if (pathname === '/api/mongo/panchayats') {
      if (req.method === 'GET') {
        const panchayats = await db.collection('panchayats').find({}).toArray();
        sendJson(res, 200, { success: true, count: panchayats.length, data: panchayats });
        return true;
      }

      if (req.method === 'POST') {
        const gp = await parseBody(req);
        if (!gp.panchayatId) {
          sendJson(res, 400, { error: 'panchayatId is required' });
          return true;
        }

        await db.collection('panchayats').updateOne(
          { panchayatId: gp.panchayatId },
          { $set: gp },
          { upsert: true }
        );
        sendJson(res, 200, { success: true, data: gp });
        return true;
      }
    }

    // -------------------------------------------------------------
    // Notifications Routes (/api/mongo/notifications)
    // -------------------------------------------------------------
    if (pathname === '/api/mongo/notifications') {
      if (req.method === 'GET') {
        const filter = {};
        if (queryParams.userId) filter.userId = queryParams.userId;

        const notifs = await db.collection('notifications')
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray();

        sendJson(res, 200, { success: true, count: notifs.length, data: notifs });
        return true;
      }

      if (req.method === 'POST') {
        const notif = await parseBody(req);
        notif.notifId = notif.notifId || 'notif-' + Date.now();
        notif.createdAt = notif.createdAt || new Date().toISOString();
        notif.read = false;

        await db.collection('notifications').insertOne(notif);
        sendJson(res, 201, { success: true, data: notif });
        return true;
      }
    }

  } catch (err) {
    sendJson(res, 500, { error: err.message });
    return true;
  }

  return false;
}

module.exports = {
  handleMongoApi,
  mongoManager
};
