const axios = require('axios');

// Image mapping for the top 10 vegetables
const VEG_MAP = {
  'Potato': 'https://vaya.in/recipes/wp-content/uploads/2018/02/Potato.jpg',
  'Tomato': 'https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg',
  'Onion': 'https://images.moneycontrol.com/static-mcnews/2023/12/Onions.jpg',
  'Cabbage': 'https://solidstarts.com/wp-content/uploads/Cabbage_edited-scaled.jpg',
  'Cauliflower': 'https://m.media-amazon.com/images/I/91038A6-3uL.jpg',
  'Chilli': 'https://5.imimg.com/data5/ANDROID/Default/2021/3/XN/ZZ/LY/125301824/product-jpeg-500x500.jpg',
  'Brinjal': 'https://www.pioneer.com/india/Brinjal_Hybrid.jpg',
  'Ginger': 'https://m.media-amazon.com/images/I/61Nl-HhNf2L.jpg',
  'Garlic': 'https://m.media-amazon.com/images/I/71Y8O+T+LhL.jpg',
  'Lemon': 'https://m.media-amazon.com/images/I/71YyXkHlA1L.jpg'
};

// @desc    Get Live Mandi Prices from OGD India
// @route   GET /api/v1/market/prices
exports.getLivePrices = async (req, res) => {
  try {
    const API_KEY = "579b464db66ec23bdd0000012b7c70cb94e24a735e93bd6017c32367";
    const RESOURCE_ID = "35985678-0d79-46b4-9ed6-6f13308a1d24";
    
    // Fetching 100 records to ensure we find our specific vegetables in the mix
    const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=100`;

    const response = await axios.get(url);
    const records = response.data.records;

    // Filter only for commodities in our VEG_MAP
    const filteredPrices = records
      .filter(item => Object.keys(VEG_MAP).includes(item.commodity))
      .map(item => ({
        id: item.id || Math.random().toString(),
        name: item.commodity,
        market: `${item.market}, ${item.district}`,
        price: item.modal_price,
        unit: 'Q', // Quintal
        trend: Math.random() > 0.5 ? 'up' : 'down', 
        image: VEG_MAP[item.commodity]
      }))
      // Remove duplicates if same commodity is in multiple mandis
      .filter((value, index, self) =>
        index === self.findIndex((t) => t.name === value.name)
      )
      .slice(0, 10); 

    res.status(200).json({
      success: true,
      prices: filteredPrices
    });
  } catch (error) {
    console.error("Market API Error:", error.message);
    res.status(500).json({ success: false, message: "Mandi price server is temporarily unavailable." });
  }
};