# Telegram Bot in Node.JS, using Telegraf

## What is this repository about?
It is a fork of `fabnicolas/telegram-telegraf-bot` meant to create a high level bot controllable from a dataset (see `src/bot-dataset` for example). It has multiple features as:
- Dialog conditions as "hear certain words", "wait for a certain time", "has this variable set to"...
- Sync and Async effects which will write into runtimeData
- Save state of dialogs as disk files / retrieve them later at startup
- Send images to Telegram and automatically cache fileId returned by Telegram
- Calculate next message by intelligent function

The goal is to be able to develop bots quickly writing only the dataset and reusing the logic.

## How to create the bot

### Step 1: create a 'user bot' and connect it with Node.js
- Open Telegram application on your computer;
- Contact BotFather through Telegram here: https://telegram.me/BotFather. This bot will be used to create your bot;
- As image suggests, follow those steps:
![image](http://i.imgur.com/POZq2tq.png)
- BotFather will provide you an API key. This API key is used to make requests to Telegram API in order to listen messages from your bot user, make bot answer accordingly and much more. Save it for next step.

### Step 2: configure your Node.js application
- Create config.js in the repository root with this content. Replace API_TOKEN with the API key you got from BotFather:
```javascript
module.exports = {telegraf_token:'API_TOKEN'};
```
This file will be automatically ignored from .gitignore to secure your API key in GitHub.


- Install dependencies:
```
npm install
```
This will install all dependencies in `package.json` so just `telegraf` in order to use Telegram API.

Done! Your bot is now configured.

## Run the bot
- Start your application:
```
npm start
```
If it prints:
```
Server has initialized bot nickname ! Nick: xxx
```
...congratulations! Now bot will do what you want.

## Secure your API key
In .gitignore:
```
config.js
```
API key will not be published inside your GitHub repository.
I have separated configuration logic from application logic in order to secure this key, but in a production environment it might not be enough.

Secure your API key as much as possible.
If your key gets stolen --- Bad things could happen with your bot.

If you're working on this repository with someone else, I suggest to NOT publish config.js but to share your configuration file privately with your collaborators OR let them build their own 'bot-users' with their own API keys.

# Documentation
For more informations, check Telegraf API: https://github.com/telegraf/telegraf.
For Telegram API, check: https://core.telegram.org/bots/api

# Tests
You can run `npm test`
