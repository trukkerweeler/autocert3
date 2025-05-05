
const cors = require("cors");
const express = require("express");
const app = express();
const port = process.env.APP_PORT || 3007;

app.use(cors());

app.use(express.static('public')); // Ensure 'public/index.html' exists
app.use(express.json());

app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// const inputRoutes = require("./routes/input");
// app.use("/input", inputRoutes);

// const projectRoutes = require("./routes/project");
// app.use("/project", projectRoutes);

const woRoutes = require("./routes/wo");
app.use("/wo", woRoutes);

app.listen(port, async() => {
  // console.log(`Example app listening at http://localhost:${port}`);
  console.log(`server started on port ${port}`);
});


