import { Request, Response, NextFunction, RequestHandler } from "express";

const catchErrorAsync = (func: (req: Request, resp: Response, next: NextFunction) => Promise<any>): RequestHandler => (
    req: Request,
    resp: Response,
    next: NextFunction
) => {
    Promise.resolve(func(req, resp, next)).catch(next);
};

export default catchErrorAsync;