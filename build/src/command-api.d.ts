import TelegramBot, { Message } from "node-telegram-bot-api";
export interface CommandContext {
    msg: Message;
    bot: TelegramBot;
    args: string[];
}
type Executor = (ctx: CommandContext) => void | Promise<void>;
export declare abstract class Argument<T> {
    name: string;
    constructor(name: string);
    abstract parse(input: string): T | null;
}
export declare class StringArgument extends Argument<string> {
    parse(input: string): string;
}
export declare class NumberArgument extends Argument<number> {
    parse(input: string): number | null;
}
export declare class SubCommand {
    name: string;
    private args;
    private executor?;
    private requirements;
    constructor(name: string);
    withArguments(...args: Argument<any>[]): this;
    require(check: (ctx: CommandContext) => Promise<boolean> | boolean): this;
    executes(executor: Executor): this;
    run(ctx: CommandContext): Promise<void>;
    get expectedArgs(): number;
}
export declare class Command {
    name: string;
    private ignoreCase;
    private subCommands;
    private executor?;
    constructor(name: string, ignoreCase?: boolean);
    executes(executor: Executor): this;
    withSubCommand(sub: SubCommand): this;
    handle(msg: Message, bot: TelegramBot): Promise<void>;
}
export declare class CommandAPI {
    private bot;
    private commands;
    constructor(bot: TelegramBot);
    register(command: Command): void;
    private onMessage;
}
export {};
//# sourceMappingURL=command-api.d.ts.map