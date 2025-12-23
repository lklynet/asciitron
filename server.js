const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("."));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
