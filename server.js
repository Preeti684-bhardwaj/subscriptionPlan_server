const express = require("express");
const app = express();
const cors = require('cors')
// This is a public sample test API key.
// Don’t submit any personally identifiable information in requests made with this key.
// Sign in to see your own test API key embedded in code samples.
const Stripe = require("stripe")
const dotenv =require('dotenv').config()

const stripe = Stripe(`${process.env.SECRET_KEY}`);

app.use(express.static("public"));
app.use(express.json());
app.use(cors())
app.post("/create-checkout-session", async (req, res) => {
    console.log(req.body);
    const features = req.body.features.join(', '); // Join features into a comma-separated string

    const session = await stripe.checkout.sessions.create({
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
        success_url: 'https://subscription-saa-s-ui.vercel.app/checkoutSuccess',
        cancel_url: 'https://subscription-saa-s-ui.vercel.app/checkoutFail',
        
    });
    res.send({ url: session.url });
});

app.listen(4242, () => console.log("Node server listening on port 4242!"));