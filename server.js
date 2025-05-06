
const cors = require("cors");
const express = require("express");
const app = express();
const port = process.env.APP_PORT || 3007;

app.use(cors({
  origin: "*", // Allow all origins or specify the required origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

app.use(express.static('public')); // Ensure 'public/index.html' exists
app.use(express.json());

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3007', 'http://fs1.ci.local'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
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


