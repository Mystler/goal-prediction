// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      ratings: Record<string, number>;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
