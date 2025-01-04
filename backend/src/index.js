const express = require('express');
const dotenv = require('dotenv');
const establishConnection = require("./utils/db");
const authRoutes = require("./routes/auth");
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const allowedOrigins = ['localhost:8000'];
//middleWares
app.use(cors({origin: allowedOrigins, credentials: true}));
app.use(express.json());
app.use(cookieParser())
dotenv.config();

// dataBase Connection
establishConnection();


const PORT = process.env.PORT || 3000;

// routes
app.use("/api/auth",authRoutes);


app.get('/', (req, res) => {
    res.send('Welcome to the E-Commerce API!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
