const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());
let db = null;

const intialDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is listening at port 3000");
    });
  } catch (err) {
    console.log(`db error : ${err.message}`);
    process.exit(1);
  }
};
intialDb();

const stateDbObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};
const districtDbObj = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    curved: dbObj.curved,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

app.get("/states/", async (req, res) => {
  const statesQue = `
    SELECT
      *
    FROM
      state;`;
  const statesArr = await db.all(statesQue);
  res.send(statesArr.map((eachState) => stateDbObj(eachState)));
});

app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const stateQue = `
    SELECT 
       *
    FROM 
       state
    WHERE 
        state_id = ${stateId};
    `;
  const stateIdArr = await db.get(stateQue);
  res.send(stateDbObj(stateIdArr));
});

app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, curved, active, deaths } = req.body;
  const districtPost = `
     INSERT INTO 
     district (district_name, state_id, cases, curved, active, deaths)
     VALUES (
        '${districtName}', ${stateId}, ${cases}, ${curved}, ${active}, ${deaths}
     )
     `;
  await db.run(districtPost);
  res.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const districtQue = `
    SELECT 
    *
    FROM 
       district
    WHERE 
        district_id = ${districtId};
    `;
  const disArr = await db.get(districtQue);
  res.send(districtDbObj(disArr));
});

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const districtDelQue = `
     DELETE FROM 
     district
     WHERE district_id = ${districtId};
     `;
  await db.run(districtDelQue);
  res.send("District removed");
});

app.put("/districts/:districtId/", async (req, res) => {
  const { districtName, stateId, cases, curved, active, deaths } = req.body;
  const { districtId } = req.params;
  const updateQue = `
     UPDATE district
     SET 
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     curved = ${curved},
     active = ${active},
     deaths = ${deaths}
     WHERE 
     district_id = ${districtId};
    `;
  await db.run(updateQue);
  console.log("District details updated");
});

app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const statesQue = `
    SELECT 
    SUM(cases),
    SUM(curved),
    SUM(active),
    SUM(deaths)
    FROM district
    WHERE state_id = ${stateId};
    `;
  const statesArr = await db.get(statesQue);
  res.send({
    totalCases: statesArr["SUM(cases)"],
    totalCurved: statesArr["SUM(curved)"],
    totalActive: statesArr["SUM(active)"],
    totalDeaths: statesArr["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const detailsQue = `
    SELECT state_id FROM district WHERE district_id = ${districtId};
    `;
  const stateId = await db.get(detailsQue);
  const stateNameQue = `
    SELECT state_name FROM state WHERE state_id = ${stateId};
    `;
  const stateName = await db.get(stateNameQue);
  res.send(stateName);
});

module.exports = app;
