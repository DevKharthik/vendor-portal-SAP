// vendorPdfRoute.js
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https');

const router = express.Router();

const sapUsername = 'K901564';
const sapPassword = '06-Aug-030';
const baseURL = 'http://AZKTLDS5CP.kcloud.com:8000';
const servicePath = '/sap/opu/odata/SAP/ZVP_VENDOR_SRV/ZPDF_VPSet';

const agent = new https.Agent({ rejectUnauthorized: false });

router.get('/:belnr', async (req, res) => {
  const { belnr } = req.params;
  const url = `${baseURL}${servicePath}('${belnr}')`;

  try {
    const response = await axios.get(url, {
      httpsAgent: agent,
      auth: {
        username: sapUsername,
        password: sapPassword,
      },
      headers: {
        'Accept': 'application/xml',
      },
    });

    const xmlData = response.data;

    xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'XML Parse Error', error: err });
      }

      try {
        const pdfBase64 =
          result['entry']['content']['m:properties']['d:Pdfdata'];

        res.status(200).json({
          belnr,
          pdfData: pdfBase64,
        });
      } catch (extractError) {
        res.status(500).json({
          message: 'Failed to extract PDF data',
          error: extractError,
          raw: result,
        });
      }
    });
  } catch (error) {
    console.error('SAP PDF Fetch Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'SAP PDF Fetch Failed',
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
