import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from '@noble/hashes/sha256';
import {hmac} from "@noble/hashes/hmac";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils";
import { base64 } from "@scure/base";
import { streamXOR as xchacha20 } from "@stablelib/xchacha20";

export class InvalidPinError extends Error {
  constructor(){
    super();
  }
}

/**
 * Pin protected data
 */
export class PinEncrypted {
    static readonly #opts = {c: 32, dkLen: 32}
    #decrypted?: Uint8Array
    #encrypted: PinEncryptedPayload
  
    constructor(enc: PinEncryptedPayload) {
      this.#encrypted = enc;
    }
  
    get value() {
      if(!this.#decrypted) throw new Error("Content has not been decrypted yet");
      return bytesToHex(this.#decrypted);
    }
  
    decrypt(pin: string) {
      const key = pbkdf2(sha256, pin, base64.decode(this.#encrypted.salt), PinEncrypted.#opts);
      const ciphertext = base64.decode(this.#encrypted.ciphertext);
      const nonce = base64.decode(this.#encrypted.iv);
      const plaintext = xchacha20(key, nonce, ciphertext, new Uint8Array(32));
      if(plaintext.length !== 32) throw new InvalidPinError();
      const mac = base64.encode(hmac(sha256, key, plaintext));
      if(mac !== this.#encrypted.mac) throw new InvalidPinError();
      this.#decrypted = plaintext;
    }

    toPayload() {
      return this.#encrypted;
    }
  
    static create(content: string, pin: string) {
      const salt = randomBytes(24);
      const nonce = randomBytes(24);
      const plaintext = hexToBytes(content);
      const key = pbkdf2(sha256, pin, salt, PinEncrypted.#opts);
      const mac = base64.encode(hmac(sha256, key, plaintext));
      const ciphertext = xchacha20(key, nonce, plaintext, new Uint8Array(32));
      const ret = new PinEncrypted({
        salt: base64.encode(salt),
        ciphertext: base64.encode(ciphertext),
        iv: base64.encode(nonce),
        mac
      });
      ret.#decrypted = plaintext;
      return ret;
    }
  }
  
  export interface PinEncryptedPayload {
    salt: string, // for KDF
    ciphertext: string
    iv: string,
    mac: string
  }
  