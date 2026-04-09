require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cron = require("node-cron");
const http = require("http");

// Servidor HTTP para manter o bot online via UptimeRobot
http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot online!");
  })
  .listen(3000, () => {
    console.log("Servidor HTTP rodando na porta 3000");
  });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.PANDASCORE_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Guardar IDs de jogos enviados para evitar duplicidade
const jogosEnviados = new Set();

// Palavras-chave para filtrar as ligas desejadas
const palavrasChave = [
  "vct",
  "vcl",
  "brasil",
  "brazil",
  "americas",
  "masters",
  "champions",
  "game changers",
  "challengers",
];

function ligaDesejada(nomeLiga) {
  const nome = nomeLiga.toLowerCase();
  return palavrasChave.some((palavra) => nome.includes(palavra));
}

function mesmodia(dataA, dataB) {
  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  );
}

function dataCompleta(data) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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

    const agora = new Date();
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);

    const jogosHoje = [];
    const jogosAmanha = [];

    for (const jogo of jogos) {
      const campeonato = jogo.league?.name || "Liga desconhecida";
      if (!ligaDesejada(campeonato)) continue;

      const dataJogo = new Date(jogo.begin_at);

      if (mesmodia(dataJogo, agora)) {
        jogosHoje.push(jogo);
      } else if (mesmodia(dataJogo, amanha)) {
        jogosAmanha.push(jogo);
      }
    }

    const canal = await client.channels.fetch(CHANNEL_ID);

    // --- HOJE ---
    let mensagemHoje = `\u200b\n\u200b\n📅 **HOJE — ${dataCompleta(agora)}**\n\n`;

    if (jogosHoje.length === 0) {
      mensagemHoje += "😢 Triste, não temos partidas de vava marcadas para hoje.";
    } else {
      for (const jogo of jogosHoje) {
        if (jogosEnviados.has(jogo.id)) continue;
        const campeonato = jogo.league?.name || "Liga desconhecida";
        const time1 = jogo.opponents[0]?.opponent?.name || "TBD";
        const time2 = jogo.opponents[1]?.opponent?.name || "TBD";
        const horario = new Date(jogo.begin_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        mensagemHoje += `🎮 **${time1} vs ${time2}**\n🏆 ${campeonato}\n🕐 ${horario}\n\n`;
        jogosEnviados.add(jogo.id);
      }
    }

    await canal.send(mensagemHoje);

    // --- AMANHÃ ---
    let mensagemAmanha = `\u200b\n\u200b\n📅 **AMANHÃ — ${dataCompleta(amanha)}**\n\n`;

    if (jogosAmanha.length === 0) {
      mensagemAmanha += "😢 Triste, não temos partidas de vava marcadas para amanhã.";
    } else {
      for (const jogo of jogosAmanha) {
        if (jogosEnviados.has(jogo.id)) continue;
        const campeonato = jogo.league?.name || "Liga desconhecida";
        const time1 = jogo.opponents[0]?.opponent?.name || "TBD";
        const time2 = jogo.opponents[1]?.opponent?.name || "TBD";
        const horario = new Date(jogo.begin_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        mensagemAmanha += `🎮 **${time1} vs ${time2}**\n🏆 ${campeonato}\n🕐 ${horario}\n\n`;
        jogosEnviados.add(jogo.id);
      }
    }

    await canal.send(mensagemAmanha);

  } catch (erro) {
    console.log("Erro ao buscar jogos:", erro.message);
  }
}

client.once("clientReady", () => {
  console.log("Bot rodando!");

  // Primeira checagem assim que o bot inicia
  verificarJogos();

  // Atualizações 3x por dia: às 09:00, 14:00 e 18:00
  cron.schedule("0 9,14,18 * * *", () => {
    verificarJogos();
  });
});

// Logar o bot
client.login(TOKEN);
