declare module "phpass" {
  export class PasswordHash {
    constructor(iterationCountLog2?: number, portableHashes?: boolean);
    hashPassword(password: string): string;
    checkPassword(password: string, storedHash: string): boolean;
  }
}
