declare module "leo-profanity" {
  export function check(text: string): boolean;
  export function clean(text: string): string;
  export function list(): string[];
}
