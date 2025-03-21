import express from "express";
import "dotenv/config";
import paypal from "@paypal/checkout-server-sdk";
import bodyParser from "body-parser";

const app = express();
app.use(express.static("src"));
app.use(bodyParser.json());

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8080 } = process.env;

const environment = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

const createOrder = async () => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: "100",
                },
            },
        ],
    });

    try {
        const response = await client.execute(request);
        return { jsonResponse: response.result, httpStatusCode: response.statusCode };
    } catch (error) {
        return { jsonResponse: null, httpStatusCode: 500 };
    }
};

app.post("/api/orders", async (req, res) => {
    try {
        const { jsonResponse, httpStatusCode } = await createOrder();
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        res.status(500).json({ error: "Error al crear la orden." });
    }
});

const captureOrder = async (orderID) => {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const response = await client.execute(request);
        return { jsonResponse: response.result, httpStatusCode: response.statusCode };
    } catch (error) {
        return { jsonResponse: null, httpStatusCode: 500 };
    }
};

app.post("/api/orders/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        res.status(500).json({ error: "Error al capturar la orden." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}/`);
});
