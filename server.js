const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const configs = require("./configs");
const { Server } = require("http");
const { MongoClient } = require("mongodb");

// APP
const app = express();

app.use("/", express.static(path.join(__dirname + "/src")));
app.use(bodyParser.json());
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", __dirname + "/src");

app.get("/", (req, res) => {
  res.render("index.html");
});

app.post("/api/nhapkho", (req, res) => {
  MongoClient.connect(configs.mongouri, { useNewUrlParser: true }, (cnnError, client) => {
    if (cnnError) {
      res.json({ error: cnnError.message, type: "Connection Error" });
      return;
    }
    let db = client.db();

    db.collection(configs.collection1, (colError, col) => {
      if (colError) {
        res.json({ error: cnnError.message, type: "Collection Error" });
        return;
      }

      col
        .aggregate([
          {
            $match: {
              t: {
                $gte: new Date(req.body.fromdate),
                $lt: new Date(req.body.todate)
              }
            }
          },
          { $lookup: { from: "vattu", localField: "c2", foreignField: "c1", as: "VT" } },
          { $lookup: { from: "nhanvien", localField: "c1", foreignField: "c1", as: "NV" } },
          {
            $addFields: {
              TenVT: { $arrayElemAt: ["$VT.c2", 0] },
              DonVi: { $arrayElemAt: ["$VT.c3", 0] },
              TenNV: { $arrayElemAt: ["$NV.c2", 0] }
            }
          },
          { $project: { _id: 0, VT: 0, NV: 0 } }
        ])
        .toArray((errData, docs) => {
          if (errData) res.json(new Error(errData));
          res.json(docs);
        });
    });
  });
});

app.post("/api/xuatkho", (req, res) => {
  MongoClient.connect(configs.mongouri, { useNewUrlParser: true }, (cnnError, client) => {
    if (cnnError) {
      res.json({ error: cnnError.message, type: "Connection Error" });
      return;
    }
    let db = client.db();

    db.collection(configs.collection2, (colError, col) => {
      if (colError) {
        res.json({ error: cnnError.message, type: "Collection Error" });
        return;
      }
      col
        .aggregate([
          {
            $match: {
              t: {
                $gte: new Date(req.body.fromdate),
                $lt: new Date(req.body.todate)
              }
            }
          },
          { $lookup: { from: "vattu", localField: "c2", foreignField: "c1", as: "VT" } },
          { $lookup: { from: "nhanvien", localField: "c1", foreignField: "c1", as: "NV" } },
          {
            $addFields: {
              TenVT: { $arrayElemAt: ["$VT.c2", 0] },
              DonVi: { $arrayElemAt: ["$VT.c3", 0] },
              TenNV: { $arrayElemAt: ["$NV.c2", 0] }
            }
          },
          { $project: { _id: 0, VT: 0, NV: 0 } }
        ])
        .toArray((errData, docs) => {
          if (errData) res.json(new Error(errData));
          res.json(docs);
        });
    });
  });
});

app.post("/api/tonkho", (req, res) => {
  MongoClient.connect(configs.mongouri, { useNewUrlParser: true }, (cnnError, client) => {
    if (cnnError) {
      res.json({ error: cnnError.message, type: "Connection Error" });
      return;
    }
    let db = client.db();

    db.collection(configs.collection1, (colError, col) => {
      if (colError) {
        res.json({ error: cnnError.message, type: "Collection Error" });
        return;
      }
      col
        .aggregate([
          { $sort: { t: -1 } },
          { $group: { _id: "$c2", input: { $sum: "$c4" } } },
          { $lookup: { from: "vattu", localField: "_id", foreignField: "c1", as: "VT" } },
          { $lookup: { from: "xuatkho", localField: "_id", foreignField: "c2", as: "OUT" } },
          {
            $addFields: {
              output: { $sum: "$OUT.c4" },
              TenVT: { $arrayElemAt: ["$VT.c2", 0] },
              DonVi: { $arrayElemAt: ["$VT.c3", 0] }
            }
          },
          { $unwind: "$TenVT" },
          { $project: { VT: 0, OUT: 0 } }
        ])
        .toArray((errData, docs) => {
          if (errData) res.json(new Error(errData));
          res.json(docs);
        });
    });
  });
});

// SERVER
const server = Server(app);
server.listen(configs.appport, () => {
  console.log("Server init on port: " + configs.appport);
});
