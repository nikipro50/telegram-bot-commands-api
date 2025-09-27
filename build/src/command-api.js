"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandAPI = exports.Command = exports.SubCommand = exports.NumberArgument = exports.StringArgument = exports.Argument = void 0;
class Argument {
    constructor(name) {
        this.name = name;
    }
}
exports.Argument = Argument;
class StringArgument extends Argument {
    parse(input) {
        return input;
    }
}
exports.StringArgument = StringArgument;
class NumberArgument extends Argument {
    parse(input) {
        const n = Number(input);
        return isNaN(n) ? null : n;
    }
}
exports.NumberArgument = NumberArgument;
class SubCommand {
    constructor(name) {
        this.name = name;
        this.args = [];
        this.requirements = [];
    }
    withArguments(...args) {
        this.args = args;
        return this;
    }
    require(check) {
        this.requirements.push(check);
        return this;
    }
    executes(executor) {
        this.executor = executor;
        return this;
    }
    async run(ctx) {
        for (const check of this.requirements) {
            const ok = await check(ctx);
            if (!ok)
                return;
        }
        const parsed = [];
        for (let i = 0; i < this.args.length; i++) {
            const arg = this.args[i];
            const input = ctx.args[i];
            if (!input) {
                console.warn(`Missing Argument (User Id: ${ctx.msg.from.id ?? "Invalid"}): ${arg.name}`);
                return;
            }
            const value = arg.parse(input);
            if (value === null) {
                console.warn(`Invalid Argument (User Id: ${ctx.msg.from.id ?? "Invalid"}): ${arg.name}`);
                return;
            }
            parsed.push(value);
        }
        if (this.executor) {
            await this.executor({ ...ctx, args: parsed });
        }
    }
    get expectedArgs() {
        return this.args.length;
    }
}
exports.SubCommand = SubCommand;
class Command {
    constructor(name, ignoreCase = false) {
        this.name = name;
        this.ignoreCase = ignoreCase;
        this.subCommands = new Map();
    }
    executes(executor) {
        this.executor = executor;
        return this;
    }
    withSubCommand(sub) {
        this.subCommands.set(this.ignoreCase ? sub.name.toLowerCase() : sub.name, sub);
        return this;
    }
    async handle(msg, bot) {
        if (!msg.text)
            return;
        const parts = msg.text.trim().split(/\s+/);
        const cmdName = this.ignoreCase ? parts[0].toLowerCase() : parts[0];
        if (cmdName !== this.name)
            return;
        if (!parts[1] && this.executor) {
            await this.executor({ msg, bot, args: [] });
            return;
        }
        const subName = parts[1];
        if (!subName)
            return;
        const subKey = this.ignoreCase ? subName.toLowerCase() : subName;
        const sub = this.subCommands.get(subKey);
        if (!sub)
            return;
        const args = parts.slice(2);
        await sub.run({ msg, bot, args });
    }
}
exports.Command = Command;
class CommandAPI {
    constructor(bot) {
        this.bot = bot;
        this.commands = [];
        this.bot.on("message", (msg) => this.onMessage(msg));
    }
    register(command) {
        this.commands.push(command);
    }
    async onMessage(msg) {
        for (const cmd of this.commands) {
            await cmd.handle(msg, this.bot);
        }
    }
}
exports.CommandAPI = CommandAPI;
