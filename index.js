/**
* AXI Sentry is a application which manages Thargoid Incursions via a database and discord bot which listens and interfaces with EDDN.
* @author   CMDR Mgram, CMDR Airom
*/

//------------------ DEV SWITCHES ------------------
// To enable or disble components for testing purposes
const enableListener = 1; // Set to 0 to disable listener from running
const enableAPI = 1; // Set to 0 to disable API from running
//--------------------------------------------------

require("dotenv").config();
const zlib = require("zlib");
const zmq = require("zeromq");
const api = require('express')();
const path = require('path');
const db = require('./db/index');
const eddb = require('./db/eddb');
const endpoint = require('./api/index');
var cron = require('node-cron');
const cors = require('cors');

// Global Variables
const SOURCE_URL = 'tcp://eddn.edcd.io:9500'; //EDDN Data Stream URL
const targetAllegiance = "Thargoid";
const targetGovernment = "$government_Dictatorship;";
let msg;

// Star System processing logic
async function processSystem(msg) {
  const { StarSystem, timestamp, SystemAllegiance, SystemGovernment } = msg.message;  // Destructuring msg
  let date = new Date();
  let time = date.getTime(timestamp); // Converting msg timestamp to Unix Epoch

  if (SystemAllegiance != undefined && time >= Date.now() - 86400000) { // Checking if report is recent
    let id = await db.getSysID(StarSystem);
    //console.log(`${StarSystem} - A: ${SystemAllegiance} - G: ${SystemGovernment} - ID: ${id}`)

    // If system does not exist in DB
    if (id == "0" && SystemAllegiance == targetAllegiance && SystemGovernment == targetGovernment) {
      id = await db.addSystem(StarSystem);
    }

    // If system does exist in DB
    if (id != "0") {
      await db.updateSysInfo(StarSystem, msg);
      if (SystemAllegiance == targetAllegiance && SystemGovernment == targetGovernment) {
        db.setStatus(StarSystem, 1);
        db.logIncursion(id, time);
      } else {
        db.setStatus(StarSystem, 0);
      }
    }  
  }
}

// Fetches existing systems and updates them with EDDB Station Data (This is VERY slow due to large data pull)
async function updateEDDBData() {
  let res = await db.query(`SELECT eddb_id FROM systems`)
  let idList = []
  for (let system of res.rows) {
    idList.push(system.eddb_id)
  }
  let systems = await eddb.getEDDBStationData(idList)
  for (let system of systems) {
    db.query(`UPDATE systems SET stations = $1 WHERE eddb_id = $2`, [JSON.stringify(system.stations), system.eddb_id])
  }
}

// Runs EDDB Fetch at :00 of every hour (Disabled due to memory issues)
/*
cron.schedule('0 * * * *', async () => {
  console.log("Fetching EDDB Data")
  await updateEDDBData()
  console.log("EDDB Update Complete")
});
*/

// Sentry Listener
async function run() {
  const sock = new zmq.Subscriber;

  sock.connect(SOURCE_URL);
  sock.subscribe('');
  console.log("[✔] EDDN Listener Connected: ", SOURCE_URL);

  // Data Stream Loop
  for await (const [src] of sock) { // For each data packet
    msg = JSON.parse(zlib.inflateSync(src));
    processSystem(msg);
  }
}

// API Code
if (enableAPI == 1) {
  api.use(cors())
  api.listen(process.env.PORT,() => {
    console.log('[✔] Sentry API Operational');  // Upon a successful connection will log to console
  });
} else { console.error(`WARN: API Disabled`)}

api.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

api.get('/styles.css', function(req, res) {
  res.sendFile(path.join(__dirname, '/dist/styles.css'));
});

api.get('/incursionshistory', async function(req, res) {
    const { rows } = await db.query(
      `SELECT incursionV2.inc_id,systems.system_id,systems.name,incursionV2.time,incursionV2.week
      FROM incursionV2
      INNER JOIN systems
      ON incursionV2.system_id=systems.system_id;`
    );
    res.json(endpoint.Response(rows))
  },
);

api.get('/incursions', async function(req, res) {
    const { rows } = await db.query(`SELECT * FROM systems WHERE status = '1'`);
    res.json(endpoint.Response(rows))
  },
);

api.get('/systems', async function(req, res) {
    const { rows } = await db.query(`SELECT * FROM systems`);
    res.json(endpoint.Response(rows))
  },
);

/*
api.get('/presence', async function(req, res) {
    const { rows } = await db.query(`SELECT systems.name,presence.presence_lvl,presence.time
    FROM presence
    INNER JOIN systems
    ON presence.system_id=systems.system_id;`);
    res.json(endpoint.Response(rows));
  },
);
*/
api.get('/ace', async function(req, res) {
  const { rows } = await db.queryWarden(`SELECT * FROM ace WHERE approval = 'true'`);
  res.json(endpoint.Response(rows));
},
);

// Switch Statements
if (enableListener == 1) { run(); } else { console.error(`WARN: Sentry Disabled`)}