// Importar dependencias
import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

//Cargar express
const app = express();
const PORT = process.env.PORT || 3000;

// Servir frontend (index.html)
app.use("/", express.static("public"));

// Middleware para procesar json y urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Instancia de OpenAI y pasar Api Key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const context = `
        Eres un asistente de soporte para el supermercado "El PicoEsquina".
        Información del negocio:
            - Ubicacion: Calle de la pantomima, número 77, Madrid
            - Horario: Lunes a Sabado de 8:00 a 21:00, Domingos de 9:00 a 18:00
            - Productos: Pan, Leche, Huevos, Frutas, Verduras, Carnes y Bebidas (solo y exclusivamente tenemos estos productos)
            - Marcas: Pascual, Kaiku, Central lechera asturiana, Fanta, Coca cola, Pepsi
            - Metodos de pago: Efectivo, Tarjeta y Bizum
        Solo puedes responder preguntas sobre la tienda. Cualquier otra pregunta está prohibida.
    `;

let conversations = {};

// Ruta / endpoint / url
app.post("/api/chatbot", async (req, res) => {

    // Recibir pregunta del usuario
    const { userId, message } = req.body;

    if(!conversations[userId]) {
        conversations[userId] = [];
    }

    conversations[userId].push({ role: "user", content: message });

    if (!message)
        return res.status(404).json({ error: "Has mandado un mensaje vacio!" });

    try {
        // Peticion al modelo de IA
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: context },
                { role: "system", content: "Debes responder de la forma más corta y directa posible usando los minimos tokens posibles." },
                ...conversations[userId]
            ],
            max_tokens: 200
        });

        // Devolver respuesta
        const reply = response.choices[0].message.content;

        // Añadir al asistente la respuesta
        conversations[userId].push({ role: "assistant", content: reply });

        // Limitar numero de mensajes
        if (conversations[userId].length > 12) {
            conversations[userId] = conversations[userId].slice(-10);
        }

        return res.status(200).json({ reply });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ error: "Error al generar la respuesta" });
    }
});


// Servir el backend
app.listen(PORT, () => {
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
});