import axios from "axios";
import express from "express";
import catchErrorAsync from "./utils/catchAsyncError";

const router = express.Router();



router.route("/test").get(async(req,resp,next)=>{
    const string = req.query.text as string;
    const encodedParams = new URLSearchParams();
encodedParams.set('q', string);
encodedParams.set('target', 'hi');
encodedParams.set('source', 'en');

const options = {
  method: 'POST',
  url: 'https://google-translate1.p.rapidapi.com/language/translate/v2',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    'Accept-Encoding': 'application/gzip',
    'X-RapidAPI-Key': '2c17824e1fmsh0d03e1d372e5ab1p1b3b16jsn6b6cd5a8ffc0',
    'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com'
  },
  data: encodedParams,
};
    try {
        const response = await axios.request(options);
        console.log(response.data);
        resp.status(200).json({hindi:response.data.data.translations[0].translatedText,data:response.data});
    } catch (error) {
        console.error(error);
    }
});

export const translateEnglishToHindi = async (text:string)=>{
  const encodedParams = new URLSearchParams();
  encodedParams.set('q', text);
  encodedParams.set('target', 'hi');
  encodedParams.set('source', 'en');
  
  const options = {
    method: 'POST',
    url: 'https://google-translate1.p.rapidapi.com/language/translate/v2',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'application/gzip',
      'X-RapidAPI-Key': '2c17824e1fmsh0d03e1d372e5ab1p1b3b16jsn6b6cd5a8ffc0',
      'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com'
    },
    data: encodedParams,
  };
  
  try {
    const response = await axios.request(options);
    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error(error);
  }
}


export default router;