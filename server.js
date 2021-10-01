const express = require('express');
const connectDB = require("./config/db");
const router = express.Router();

const app = express();

connectDB();

app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 5000;

app.use("/api/users", require("./routes/api/users"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/posts"));
app.use('/', router);

app.get('/', (req, res) => {
    res.send("API running")
});


app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});