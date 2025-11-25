import express, { Application, Request, Response } from 'express';
import path from 'path';

const app: Application = express();
const port: number = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req: Request, res: Response) => {
    res.send('Hello world!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});