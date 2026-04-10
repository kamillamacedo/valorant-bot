# 🎮 Bot de Partidas - Valorant (PandaScore)

Bot de Discord desenvolvido em Node.js para monitoramento automático de partidas profissionais de :contentReference[oaicite:0]{index=0}.

Ele utiliza a API da PandaScore para buscar jogos e envia atualizações programadas diretamente em um canal do servidor, mantendo a comunidade informada sobre partidas do dia e do dia seguinte.

---

## 🚀 Funcionalidades

- 📅 Envio automático de partidas de hoje e amanhã
- ⏰ Execução programada (09h, 14h e 18h)
- 🎯 Filtro de ligas relevantes (VCT, Challengers, Masters, Champions, etc.)
- 🇧🇷 Destaque para jogadores brasileiros nos times
- 👩 Identificação de times femininos (Game Changers e similares)
- 🧠 Evita duplicação de mensagens (persistência em arquivo JSON)
- 📊 Organização por data com mensagens estruturadas no canal
- 🌐 Servidor HTTP para manter o bot online (UptimeRobot)

---

## 🧰 Tecnologias utilizadas

- Node.js
- discord.js
- axios
- node-cron
- dotenv
- PandaScore API

---

## 📡 Como funciona

O bot realiza requisições periódicas à API da PandaScore para buscar partidas futuras de Valorant. Em seguida:

1. Filtra ligas relevantes (VCT, regionais e internacionais)
2. Separa partidas de hoje e amanhã
3. Formata os jogos com horário, times e campeonato
4. Envia mensagens no canal configurado no Discord
5. Registra os jogos enviados para evitar duplicações

---

## 🗂 Estrutura de persistência

O bot utiliza um arquivo local:

jogos_enviados.json

Esse arquivo garante que:
- Jogos não sejam enviados duas vezes
- Dados antigos sejam limpos automaticamente (últimas 48h)

---

## ⚙️ Variáveis de ambiente (.env)

```env
DISCORD_TOKEN=seu_token_do_bot
CHANNEL_ID=id_do_canal
PANDASCORE_TOKEN=sua_api_key
PORT=3000

📌 Agendamento automático

O bot executa verificações nos seguintes horários:

🕘 09:00
🕑 14:00
🕕 18:00

Caso o bot fique offline, ele recupera execuções perdidas automaticamente.

🌐 Servidor HTTP

O bot mantém um servidor HTTP simples ativo para evitar sleep em hospedagens gratuitas:

Endpoint: /
Resposta: Bot online!
💡 Objetivo

O objetivo do projeto é manter comunidades de Discord atualizadas automaticamente sobre partidas competitivas de Valorant, sem necessidade de atualização manual.

📄 Licença

Projeto de uso pessoal e educacional.

👤 Autor

Desenvolvido por Kamilla Macedo
