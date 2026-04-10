require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cron = require("node-cron");
const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

// Servidor HTTP para manter o bot online via UptimeRobot
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot online!");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log("Servidor web ativo");
  });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const API_KEY = process.env.PANDASCORE_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// --- Persistência de IDs enviados ---
const ARQUIVO_ENVIADOS = "jogos_enviados.json";
let jogosEnviadosMeta = [];
const jogosEnviados = new Set();

function carregarJogosEnviados() {
  try {
    if (fs.existsSync(ARQUIVO_ENVIADOS)) {
      const dados = JSON.parse(fs.readFileSync(ARQUIVO_ENVIADOS, "utf8"));
      const limite = Date.now() - 2 * 24 * 60 * 60 * 1000;
      jogosEnviadosMeta = dados.filter((e) => e.ts > limite);
      jogosEnviadosMeta.forEach((e) => jogosEnviados.add(e.id));
      console.log(`${jogosEnviados.size} IDs carregados do arquivo.`);
    }
  } catch (e) {
    console.log("Erro ao carregar jogos enviados:", e.message);
  }
}

function registrarJogoEnviado(id) {
  if (jogosEnviados.has(id)) return;
  jogosEnviados.add(id);
  jogosEnviadosMeta.push({ id, ts: Date.now() });
  try {
    fs.writeFileSync(ARQUIVO_ENVIADOS, JSON.stringify(jogosEnviadosMeta));
  } catch (e) {
    console.log("Erro ao salvar jogos enviados:", e.message);
  }
}

// --- Cache de equipes ---
const cacheEquipes = {};

// --- Palavras-chave para filtrar ligas ---
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

// --- Dados dos jogadores ---
async function buscarJogadores(teamId) {
  if (!teamId) return [];
  if (cacheEquipes[teamId] !== undefined) return cacheEquipes[teamId];

  try {
    const resposta = await axios.get(
      `https://api.pandascore.co/teams/${teamId}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );
    const jogadores = resposta.data.players || [];
    cacheEquipes[teamId] = jogadores;
    return jogadores;
  } catch (e) {
    console.log(`Erro ao buscar time ${teamId}:`, e.message);
    cacheEquipes[teamId] = [];
    return [];
  }
}

async function temJogadorBrasileiro(teamId) {
  const jogadores = await buscarJogadores(teamId);
  return jogadores.some((p) => {
    const nat = (p.nationality || "").toLowerCase();
    return nat.includes("br") || nat.includes("brazil");
  });
}

// --- Times femininos em ligas masculinas ---
const timesFemininos = ["team liquid visa"];

function ligaFeminina(nomeLiga) {
  return nomeLiga.toLowerCase().includes("game changers");
}

function timeFemininoManual(nomeTime) {
  return timesFemininos.includes(nomeTime.toLowerCase());
}

async function formatarTime(nome, teamId, nomeLiga) {
  const br = await temJogadorBrasileiro(teamId);
  const mulher = ligaFeminina(nomeLiga) || timeFemininoManual(nome);
  let prefixo = "";
  if (br) prefixo += "🇧🇷  ";
  if (mulher) prefixo += "👩  ";
  return `${prefixo}${nome}`;
}

async function construirBlocoJogos(lista) {
  let bloco = "";
  for (const jogo of lista) {
    const campeonato = jogo.league?.name || "Liga desconhecida";
    const time1Nome = jogo.opponents[0]?.opponent?.name || "TBD";
    const time2Nome = jogo.opponents[1]?.opponent?.name || "TBD";
    const teamId1 = jogo.opponents[0]?.opponent?.id;
    const teamId2 = jogo.opponents[1]?.opponent?.id;

    const time1 = await formatarTime(time1Nome, teamId1, campeonato);
    const time2 = await formatarTime(time2Nome, teamId2, campeonato);

    const horario = new Date(jogo.begin_at).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    bloco += `🎮  ${time1}   vs   ${time2}\n🏆  ${campeonato}\n🕐  ${horario}\n\n`;
    registrarJogoEnviado(jogo.id);
  }
  return bloco.trim() || null;
}

async function verificarJogos() {
  try {
    const resposta = await axios.get(
      "https://api.pandascore.co/valorant/matches/upcoming",
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    const jogos = resposta.data;
    const agora = new Date();
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);

    const dataHojeStr = agora.toISOString().split("T")[0];
    const dataAmanhaStr = amanha.toISOString().split("T")[0];
    const idSadHoje = `sad-hoje-${dataHojeStr}`;
    const idSadAmanha = `sad-amanha-${dataAmanhaStr}`;

    const jogosHoje = [];
    const jogosAmanha = [];

    for (const jogo of jogos) {
      const campeonato = jogo.league?.name || "Liga desconhecida";
      if (!ligaDesejada(campeonato)) continue;

      const dataJogo = new Date(jogo.begin_at);
      if (mesmodia(dataJogo, agora)) jogosHoje.push(jogo);
      else if (mesmodia(dataJogo, amanha)) jogosAmanha.push(jogo);
    }

    // Filtra apenas jogos ainda não enviados
    const novosHoje = jogosHoje.filter((j) => !jogosEnviados.has(j.id));
    const novosAmanha = jogosAmanha.filter((j) => !jogosEnviados.has(j.id));
    const enviarSadHoje = jogosHoje.length === 0 && !jogosEnviados.has(idSadHoje);
    const enviarSadAmanha = jogosAmanha.length === 0 && !jogosEnviados.has(idSadAmanha);

    // Se não há nada novo para enviar, sai sem postar nada
    if (!novosHoje.length && !novosAmanha.length && !enviarSadHoje && !enviarSadAmanha) {
      console.log("Nenhuma novidade para enviar.");
      return;
    }

    const canal = await client.channels.fetch(CHANNEL_ID);

    // --- HOJE ---
    if (novosHoje.length > 0 || enviarSadHoje) {
      const headerHoje = `\u200b\n\u200b\n📅 **HOJE — ${dataCompleta(agora)}**\n\u200b`;
      await canal.send(headerHoje);
      if (enviarSadHoje) {
        await canal.send("😢 Triste, não temos partidas de vava marcadas para hoje.");
        registrarJogoEnviado(idSadHoje);
      } else {
        const bloco = await construirBlocoJogos(novosHoje);
        if (bloco) await canal.send(bloco);
      }
    }

    // --- AMANHÃ ---
    if (novosAmanha.length > 0 || enviarSadAmanha) {
      const headerAmanha = `\u200b\n\u200b\n📅 **AMANHÃ — ${dataCompleta(amanha)}**\n\u200b`;
      await canal.send(headerAmanha);
      if (enviarSadAmanha) {
        await canal.send("😢 Triste, não temos partidas de vava marcadas para amanhã.");
        registrarJogoEnviado(idSadAmanha);
      } else {
        const bloco = await construirBlocoJogos(novosAmanha);
        if (bloco) await canal.send(bloco);
      }
    }

  } catch (erro) {
    console.log("Erro ao buscar jogos:", erro.message);
  }
}

client.once("clientReady", () => {
  carregarJogosEnviados();
  console.log("Bot rodando!");

  verificarJogos();

  cron.schedule("0 9,14,18 * * *", () => {
    verificarJogos();
  });
});

client.login(TOKEN);
