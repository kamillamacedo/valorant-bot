# 🎮 Valorant Match Bot (PandaScore)

A Discord bot built with Node.js that automatically monitors professional Valorant matches.

It uses the PandaScore API to fetch match data and sends scheduled updates directly to a Discord channel, keeping the community informed about upcoming matches for today and the next day.

---

## 🚀 Features

- 📅 Automatic updates for today's and tomorrow's matches  
- ⏰ Scheduled execution (9 AM, 2 PM, and 6 PM)  
- 🎯 Filtering of relevant leagues (VCT, Challengers, Masters, Champions, etc.)  
- 🇧🇷 Highlights Brazilian players in teams  
- 👩 Identifies women's teams (Game Changers and similar)  
- 🧠 Prevents duplicate messages (JSON-based persistence)  
- 📊 Organized messages grouped by date  
- 🌐 Lightweight HTTP server to keep the bot alive (UptimeRobot support)  

---

## 🧰 Tech Stack

- Node.js  
- discord.js  
- axios  
- node-cron  
- dotenv  
- PandaScore API  

---

## 📡 How It Works

The bot periodically requests data from the PandaScore API to retrieve upcoming Valorant matches.

It then:

1. Filters relevant leagues (regional and international)  
2. Separates matches for today and tomorrow  
3. Formats match details (time, teams, tournament)  
4. Sends structured messages to a Discord channel  
5. Stores sent matches to avoid duplication  

---

## 🗂 Persistence

The bot uses a local file:

```text
jogos_enviados.json
```

This ensures:
- Matches are not sent more than once
- Old data is automatically cleaned (last 48 hours)

---

## ⚙️ Environment Variables (.env)

```env
DISCORD_TOKEN=your_bot_token
CHANNEL_ID=your_channel_id
PANDASCORE_TOKEN=your_api_key
PORT=3000
```

---

## 📌 Scheduling

The bot runs checks at:

🕘 09:00
🕑 14:00
🕕 18:00

If the bot goes offline, it automatically recovers missed executions.

---

## 🌐 HTTP Server

A simple HTTP server is used to prevent the bot from sleeping on free hosting services.

Endpoint: /
Response: Bot online!
---

## 💡 Purpose

The goal of this project is to automate match updates for Valorant communities on Discord, removing the need for manual tracking

---

## 📚 Learning Note

This project was developed with the support of AI tools.
My focus was on understanding the logic, adapting the code, and learning how each part works in practice.

I’m continuously improving my knowledge to build and extend projects like this more independently.

---

## 📄 License

Personal and educational use.

---

## 👤 Author

Developed by Kamilla Macedo
