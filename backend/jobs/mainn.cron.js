import dailyStreak  from "./daily-streak.cron";


async function main() {
    dailyStreak();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});