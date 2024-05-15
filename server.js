const express = require("express");
const axios =require('axios')
const path=require('path')
const ipRangeCheck=require('ip-range-check')
const cors = require('cors');
const dotenv = require('dotenv').config();

const app = express();
const Stripe = require("stripe");

const stripe = Stripe(`${process.env.SECRET_KEY}`);

app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(require('prerender-node').set('prerenderToken', `${process.env.PRERENDER_TOKEN}`));
app.use(cors());

// // Static Assets
// app.get('*.*', express.static('public'));
async function isIPInPrerenderList(ip){
    try{
        const response =await axios.getAdapter('https://ipranges.prerender.io/ipranges.txt');
        const ipRanges=response.data.split('\n');
        return ipRanges.some(ipRange=>ipRangeCheck(ip,ipRange));
    }catch{
        console.log('error fetching prerender IP lists',error);
        return false;
    }
}

// Route to check IP 
app.post('/check-ip',async(req,res)=>{
    const {ip}=req.body;
    if(!ip){
        return res.status(400).send({error:'IP address is required'});
    }
    const isInList=await isIPInPrerenderList(ip);
    res.send({ip,isInList});
});

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname ,'public','index.html'));
})

app.post("/create-checkout-session", async (req, res) => {
    console.log(req.body);
    const features = req.body.features.join(', '); // Join features into a comma-separated string

    const session = await stripe.checkout.sessions.create({
        // shipping_address_collection: {
        //     allowed_countries: ['IN',] // Specify allowed countries for shipping
        // },
        billing_address_collection: 'auto',
        payment_method_types: ['card'],
        customer_email: req.body.userName,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: req.body.planName,
                        description: `${req.body.description} - ${features}`, // Include features in description
                        metadata: {
                            id: req.body.userId
                        }
                    },
                    unit_amount: req.body.planPrice * 100,
                },
                quantity: 1, // Assuming quantity is always 1 for each line item
            },
        ],
        mode: 'payment',
        success_url: `https://new-video-editor.vercel.app/listings?accessToken=${req.body.accessToken}`,
        cancel_url: 'https://subscription-saa-s-ui.vercel.app/checkoutFail',
    });
    console.log(session);
    res.send({ url: session.url });
});

app.listen(4242, () => console.log("Node server listening on port 4242!"));
