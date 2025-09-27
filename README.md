# 📦 Telegram Command API

**Telegram Command API** is a small wrapper for **Node.js** that makes handling commands and subcommands with [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) much easier.  

---

## 🚀 Installation
from **npm**:
```bash
npm install telegram-bot-commands-api
```

## ✨ Basic Example
```javascript
const TelegramBot = require("node-telegram-bot-api");
const { Command, SubCommand, CommandAPI, StringArgument } = require("telegram-command-api");

const bot = new TelegramBot("YOUR-TOKEN", { polling: true });
const api = new CommandAPI(bot);

// /hello
const hello = new Command("/hello", true)
  .executes(({ msg, bot }) => {
    bot.sendMessage(msg.chat.id, "Hello!");
  });

api.register(hello);

console.log("Bot started!");
```

## 📖 Wiki
#### 🔹 Command
Defines a main command (```/start```)
```javascript
const startCommand = new Command("/start", true)
  .executes(({ msg, bot }) => {
    bot.sendMessage(msg.chat.id, `Hello ${msg.from.id}!`);
  });
```

#### 🔹 SubCommand
Adds a subcommand to a main command.
```javascript
const registerCommand = new Command("/register", true)
  .withSubCommand(
    new SubCommand("name")
      .withArguments(new StringArgument("name"))
      .executes(({ msg, args, bot }) => {
        bot.sendMessage(msg.chat.id, `Registered with name ${args[0]}!`);
      })
  )
  .withSubCommand(
    new SubCommand("hi")
      .executes(({ msg, bot }) => {
        bot.sendMessage(msg.chat.id, "You wrote /register hi");
      })
  );
```

#### 🔹 Arguments
Currently supports:
- ```StringArgument("name")``` → captures a single world argument.
- ```NumberArgument("name")``` → captures a numeral argument.

_Examples_:
```javascript
new SubCommand("say")
  .withArguments(new StringArgument("message"))
  .executes(({ msg, args, bot }) => {
    bot.sendMessage(msg.chat.id, `You said: ${args[0]}`);
  });
```

```javascript
new SubCommand("say")
  .withArguments(new NumberArgument("number"))
  .executes(({ msg, args, bot }) => {
    bot.sendMessage(msg.chat.id, `You wrote number ${args[0]}`);
  });
```

#### 🔹 Requires (permissions)
You can restrict the usage of a command/subcommand with ```.require(...)```.
The callback must return ```true``` or ```false```.

_Example_:
```javascript
new SubCommand("vip")
  .require(async ({ msg, bot }) => {
    const member = await bot.getChatMember("-1001234567890", msg.from.id);
    return ["creator", "administrator", "member"].includes(member.status);
  })
  .executes(({ msg, bot }) => {
    bot.sendMessage(msg.chat.id, "You are in the VIP group ✅");
  });

```

## 🛠 API Reference
```Command```
- ```.executes(handler)``` → runs when the command is triggered
-  ```.withSubCommand(sub)``` → adds a subcommand
---
```SubCommand```
- ```.withArguments(arg)``` → adds an argument
- ```.executes(handler)``` → execution handler
- ```.require(fn)``` → async function that must return ```true```/```false```

## 📌 Final Example
```javascript
const bot = new TelegramBot("TOKEN", { polling: true });
const api = new CommandAPI(bot);

const start = new Command("/start", true)
  .executes(({ msg, bot }) => {
    bot.sendMessage(msg.chat.id, "Main /start command");
  })
  .withSubCommand(
    new SubCommand("hello")
      .executes(({ msg, bot }) => bot.sendMessage(msg.chat.id, "Hello!"))
  )
  .withSubCommand(
    new SubCommand("name")
      .withArguments(new StringArgument("name"))
      .executes(({ msg, args, bot }) => bot.sendMessage(msg.chat.id, `Hello ${args[0]}!`))
  );

api.register(start);
``` 