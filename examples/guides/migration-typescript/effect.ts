// docs:start announce
async function announce(s: string) {
  console.log(s);
}
// docs:end announce

// docs:start execute
const job = announce("ran");
console.log("constructed");
await job;
await job;
// docs:end execute

export {};
