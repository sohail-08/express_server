import express, { type Application, type Request, type Response } from "express"
import { userRoute } from "./modules/user/user.route"
import { profileRoute } from "./modules/profile/profile.route"
import { authRoute } from "./modules/auth/auth.route"
import logger from "./middleware/logger"
import cookieParser from "cookie-parser"
import cors from "cors"
import globalErrorHandler from "./middleware/globalErrorHandler"

const app: Application = express()

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(logger);
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",}));




app.get('/', (req : Request, res : Response) => {
  res.status(200).json({
    "message": "Express Server",
    "author": "next level",
  });
})


app.use('/api/users', userRoute);
app.use('/api/profiles', profileRoute);
app.use('/api/auth', authRoute);

app.use(globalErrorHandler);


export default app;
