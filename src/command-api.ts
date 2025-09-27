import TelegramBot, { Message } from "node-telegram-bot-api";

export interface CommandContext {
    msg: Message;
    bot: TelegramBot;
    args: string[];
}

type Executor = (ctx: CommandContext) => void | Promise<void>;

export abstract class Argument<T> {
    constructor(public name: string) { }
    abstract parse(input: string): T | null;
}

export class StringArgument extends Argument<string> {
    parse(input: string) {
        return input;
    }
}

export class NumberArgument extends Argument<number> {
    parse(input: string) {
        const n = Number(input);
        return isNaN(n) ? null : n;
    }
}

export class SubCommand {
    private args: Argument<any>[] = [];
    private executor?: Executor;
    private requirements: ((ctx: CommandContext) => Promise<boolean> | boolean)[] = [];

    constructor(public name: string) { }

    withArguments(...args: Argument<any>[]): this {
        this.args = args;
        return this;
    }

    require(check: (ctx: CommandContext) => Promise<boolean> | boolean): this {
        this.requirements.push(check);
        return this;
    }

    executes(executor: Executor): this {
        this.executor = executor;
        return this;
    }

    async run(ctx: CommandContext) {
        for (const check of this.requirements) {
            const ok = await check(ctx);
            if (!ok) return;
        }

        const parsed: any[] = [];
        for (let i = 0; i < this.args.length; i++) {
            const arg = this.args[i];
            const input = ctx.args[i];
            if (!input) {
                console.warn(`Missing Argument (User Id: ${ctx.msg.from!.id ?? "Invalid"}): ${arg.name}`);
                return;
            }
            const value = arg.parse(input);
            if (value === null) {
                console.warn(`Invalid Argument (User Id: ${ctx.msg.from!.id ?? "Invalid"}): ${arg.name}`);
                return;
            }
            parsed.push(value);
        }

        if (this.executor) {
            await this.executor({ ...ctx, args: parsed });
        }
    }

    get expectedArgs(): number {
        return this.args.length;
    }
}

export class Command {
    private subCommands: Map<string, SubCommand> = new Map();
    private executor?: Executor;

    constructor(public name: string, private ignoreCase = false) { }

    executes(executor: Executor): this {
        this.executor = executor;
        return this;
    }

    withSubCommand(sub: SubCommand): this {
        this.subCommands.set(
            this.ignoreCase ? sub.name.toLowerCase() : sub.name,
            sub
        );
        return this;
    }

    async handle(msg: Message, bot: TelegramBot) {
        if (!msg.text) return;
        const parts = msg.text.trim().split(/\s+/);
        const cmdName = this.ignoreCase ? parts[0].toLowerCase() : parts[0];

        if (cmdName !== this.name) return;

        if (!parts[1] && this.executor) {
            await this.executor({ msg, bot, args: [] });
            return;
        }

        const subName = parts[1];
        if (!subName) return;

        const subKey = this.ignoreCase ? subName.toLowerCase() : subName;
        const sub = this.subCommands.get(subKey);
        if (!sub) return;

        const args = parts.slice(2);
        await sub.run({ msg, bot, args });
    }
}

export class CommandAPI {
    private commands: Command[] = [];

    constructor(private bot: TelegramBot) {
        this.bot.on("message", (msg) => this.onMessage(msg));
    }

    register(command: Command) {
        this.commands.push(command);
    }

    private async onMessage(msg: Message) {
        for (const cmd of this.commands) {
            await cmd.handle(msg, this.bot);
        }
    }
}
