require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cron = require("node-cron");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.PANDASCORE_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Guardar IDs de jogos enviados para evitar duplicidade
const jogosEnviados = new Set();

// Ligas que você quer acompanhar
const ligasPrincipais = [
  "VCB",
  "Challengers Brasil",
  "Game Changers Brasil",
  "VCT Americas",
  "Masters",
  "Champions",
];

async function verificarJogos() {
  try {
    const resposta = await axios.get(
      "https://api.pandascore.co/valorant/matches/upcoming",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    const jogos = resposta.data;

    for (const jogo of jogos) {
      const campeonato = jogo.league?.name || "Liga desconhecida";

      // Ignora jogos que não são das ligas principais
      if (!ligasPrincipais.includes(campeonato)) continue;

      const id = jogo.id;
      if (jogosEnviados.has(id)) continue;

      const time1 = jogo.opponents[0]?.opponent?.name || "TBD";
      const time2 = jogo.opponents[1]?.opponent?.name || "TBD";

      const data = new Date(jogo.begin_at).toLocaleString("pt-BR");

      const mensagem = `🎮 PARTIDA DE VALORANT

🏆 Liga:
${campeonato}

⚔️ Times:
${time1} vs ${time2}

📅 Data:
${data}`;

      const canal = await client.channels.fetch(CHANNEL_ID);
      await canal.send(mensagem);

      jogosEnviados.add(id);
    }
  } catch (erro) {
    console.log("Erro ao buscar jogos:", erro.message);
  }
}

client.once("clientReady", () => {
  console.log("Bot rodando!");

  // Primeira checagem assim que o bot inicia
  verificarJogos();

  // Atualizações 2x por dia: às 09:00 e 14:00
  cron.schedule("0 9,14 * * *", () => {
    verificarJogos();
  });
});

// Logar o bot
client.login(TOKEN);
