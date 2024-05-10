const express = require("express");
const app = express();
const rendertron = require('rendertron-middleware');
// const PORT = process.env.PORT || 8080;
const DIST_FOLDER = process.cwd() + '/public';
const cors = require('cors');
const Stripe = require("stripe");
const dotenv = require('dotenv').config();

const stripe = Stripe(`${process.env.SECRET_KEY}`);

app.use(express.static("public"));
app.use(express.json());
app.use(cors());

// Add googlebot to the list of bots we will use Rendertron for
const BOTS = rendertron.botUserAgents.concat('googlebot');
const BOT_UA_PATTERN = new RegExp(BOTS.join('|'), 'i');

app.set('view engine', 'html');

// Add Rendertron middleware to send bot requests to Rendertron
app.use(rendertron.makeMiddleware({
  proxyUrl: 'https://render-tron.appspot.com/render', // this is a DEMO URL! Do not use this in production!
  userAgentPattern: BOT_UA_PATTERN
}));

// Static Assets
app.get('*.*', express.static('public'));

// Point all routes to index...
app.get('*', (req, res) => {
  res.set('Vary', 'User-Agent');
  res.sendFile(DIST_FOLDER + '/index.html');
});


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
