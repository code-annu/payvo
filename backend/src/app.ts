import express from "express";

const app = express();

// app.use(cors());
// app.use(cookieParser());
// app.use(compression());
// app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
