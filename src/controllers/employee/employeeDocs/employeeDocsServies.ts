import express, { Request, Response } from "express";


export const upload = async (req:Request,res:Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    }
    const location = (file as any).location;
    res.send("Successfully uploaded " + location);
};



